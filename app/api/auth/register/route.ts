import { z } from 'zod'
import { createSession, HttpError, hashPassword } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import { clientKey, rateLimit } from '@/lib/rate-limit'

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters.')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, or underscores only.'),
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(80),
  email: z.string().trim().email('Enter a valid email.').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(200)
})

type NewUserRow = {
  id: number
  username: string
  role: string
  full_name: string
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(clientKey(request, 'register'), 5, 60_000)) {
      return Response.json(
        { ok: false, message: 'Too many attempts. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? 'Invalid details.'
        },
        { status: 400 }
      )
    }

    const { username, fullName, email, password } = parsed.data

    const existing = await query('SELECT 1 FROM users WHERE username = $1', [
      username
    ])
    if (existing.rows.length > 0) {
      return Response.json(
        { ok: false, message: 'That username is already taken.' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)
    const inserted = await query<NewUserRow>(
      `INSERT INTO users (username, password_hash, role, full_name, email)
       VALUES ($1, $2, 'customer', $3, $4)
       RETURNING id, username, role, full_name`,
      [username, passwordHash, fullName, email]
    )
    const user = inserted.rows[0]

    await createSession({
      userId: user.id,
      role: user.role,
      username: user.username
    })

    return Response.json(
      {
        ok: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.full_name
        }
      },
      { status: 201 }
    )
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

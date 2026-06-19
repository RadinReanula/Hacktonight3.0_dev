import { z } from 'zod'
import { createSession, HttpError, verifyPassword } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import { clientKey, rateLimit } from '@/lib/rate-limit'

const loginSchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200)
})

type UserRow = {
  id: number
  username: string
  role: string
  full_name: string
  password_hash: string
  email_verified: boolean
}

export async function POST(request: Request) {
  try {
    if (!rateLimit(clientKey(request, 'login'), 10, 60_000)) {
      return Response.json(
        { ok: false, message: 'Too many attempts. Please try again shortly.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid username or password.' },
        { status: 400 }
      )
    }

    const { username, password } = parsed.data
    const result = await query<UserRow>(
      `SELECT id, username, role, full_name, password_hash, email_verified
       FROM users WHERE username = $1`,
      [username]
    )
    const user = result.rows[0]

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return Response.json(
        { ok: false, message: 'Invalid username or password.' },
        { status: 401 }
      )
    }

    if (!user.email_verified) {
      return Response.json(
        {
          ok: false,
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email before signing in.'
        },
        { status: 403 }
      )
    }

    await createSession({
      userId: user.id,
      role: user.role,
      username: user.username
    })

    return Response.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name
      }
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

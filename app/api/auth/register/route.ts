import { z } from 'zod'
import { HttpError, hashPassword } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import {
  createVerificationToken,
  firstNameFromFullName
} from '@/lib/email/verification'
import {
  sendExistingAccountEmail,
  sendVerificationEmail
} from '@/lib/email/send'
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
}

const GENERIC_SUCCESS = {
  ok: true as const,
  needsVerification: true,
  message: 'Check your email to verify your account.'
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
    const normalizedEmail = email.toLowerCase()
    const firstName = firstNameFromFullName(fullName)

    const [usernameRow, emailRow] = await Promise.all([
      query('SELECT 1 FROM users WHERE username = $1', [username]),
      query<{ id: number }>(
        'SELECT id FROM users WHERE LOWER(email) = $1',
        [normalizedEmail]
      )
    ])

    const isDuplicate =
      usernameRow.rows.length > 0 || emailRow.rows.length > 0

    if (isDuplicate) {
      try {
        await sendExistingAccountEmail({ to: normalizedEmail, firstName })
      } catch (err) {
        console.error('[register-existing-email]', err)
      }
      return Response.json(GENERIC_SUCCESS, { status: 201 })
    }

    const passwordHash = await hashPassword(password)
    const inserted = await query<NewUserRow>(
      `INSERT INTO users (username, password_hash, role, full_name, email, email_verified)
       VALUES ($1, $2, 'customer', $3, $4, false)
       RETURNING id, username`,
      [username, passwordHash, fullName, normalizedEmail]
    )
    const user = inserted.rows[0]

    const rawToken = await createVerificationToken(user.id, 'signup')
    await sendVerificationEmail({
      to: normalizedEmail,
      firstName,
      rawToken
    })

    return Response.json(GENERIC_SUCCESS, { status: 201 })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

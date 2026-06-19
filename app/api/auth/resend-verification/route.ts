import { z } from 'zod'
import { HttpError } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import {
  createVerificationToken,
  firstNameFromFullName
} from '@/lib/email/verification'
import { sendVerificationEmail } from '@/lib/email/send'
import { clientKey, rateLimit } from '@/lib/rate-limit'

const resendSchema = z.object({
  email: z.string().trim().email('Enter a valid email.').max(120)
})

const GENERIC_SUCCESS = {
  ok: true,
  message: 'If an unverified account exists, we sent a new verification email.'
}

type UserRow = {
  id: number
  full_name: string
  email_verified: boolean
}

export async function POST(request: Request) {
  try {
    const emailKey = clientKey(request, 'resend-verify')
    if (!rateLimit(emailKey, 3, 60 * 60 * 1000)) {
      return Response.json(
        { ok: false, message: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parsed = resendSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(GENERIC_SUCCESS)
    }

    const normalizedEmail = parsed.data.email.toLowerCase()
    const result = await query<UserRow>(
      `SELECT id, full_name, email_verified FROM users WHERE LOWER(email) = $1`,
      [normalizedEmail]
    )
    const user = result.rows[0]

    if (user && !user.email_verified) {
      const rawToken = await createVerificationToken(user.id, 'resend')
      await sendVerificationEmail({
        to: normalizedEmail,
        firstName: firstNameFromFullName(user.full_name),
        rawToken
      })
    }

    return Response.json(GENERIC_SUCCESS)
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

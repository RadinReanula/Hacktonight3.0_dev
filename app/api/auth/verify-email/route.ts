import { NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import { getAppBaseUrl } from '@/lib/email/config'
import { verifyEmailToken } from '@/lib/email/verification'

type VerifiedUserRow = {
  id: number
  username: string
  role: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')?.trim()
    const baseUrl = getAppBaseUrl()

    if (!token) {
      return NextResponse.redirect(`${baseUrl}/login?verify=invalid`)
    }

    const result = await verifyEmailToken(token)
    if (!result) {
      return NextResponse.redirect(`${baseUrl}/login?verify=invalid`)
    }

    const userResult = await query<VerifiedUserRow>(
      `SELECT id, username, role FROM users
       WHERE id = $1 AND email_verified = true`,
      [result.userId]
    )
    const user = userResult.rows[0]
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?verify=invalid`)
    }

    await createSession({
      userId: user.id,
      role: user.role,
      username: user.username
    })

    return NextResponse.redirect(`${baseUrl}/dashboard?verified=1`)
  } catch (reason) {
    return serviceFailure(reason)
  }
}

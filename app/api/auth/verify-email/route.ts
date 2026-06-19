import { NextResponse } from 'next/server'
import { getAppBaseUrl } from '@/lib/email/config'
import { verifyEmailToken } from '@/lib/email/verification'
import { serviceFailure } from '@/lib/db'

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

    return NextResponse.redirect(`${baseUrl}/login?verified=1`)
  } catch (reason) {
    return serviceFailure(reason)
  }
}

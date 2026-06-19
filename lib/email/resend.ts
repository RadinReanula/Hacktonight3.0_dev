import { Resend } from 'resend'

let client: Resend | null = null

export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY must be set in production.')
    }
    throw new Error('RESEND_API_KEY is not configured.')
  }
  if (!client) {
    client = new Resend(apiKey)
  }
  return client
}

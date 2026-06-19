import { getAppBaseUrl, getFromEmail, getVerifyTtlHours, isEmailSendDisabled } from './config'
import { getResendClient } from './resend'
import {
  buildExistingAccountEmail,
  buildVerificationEmail
} from './templates'

type SendResult = { ok: true; id?: string }

async function deliverEmail(input: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<SendResult> {
  if (isEmailSendDisabled()) {
    console.info('[email-disabled]', input.to, input.subject)
    return { ok: true, id: 'disabled' }
  }

  const resend = getResendClient()
  const { data, error } = await resend.emails.send({
    from: getFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text
  })

  if (error) {
    console.error('[email-send-failure]', error)
    throw new Error('Failed to send email. Please try again later.')
  }

  return { ok: true, id: data?.id }
}

export async function sendVerificationEmail(input: {
  to: string
  firstName: string
  rawToken: string
}) {
  const baseUrl = getAppBaseUrl()
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(input.rawToken)}`
  const { subject, html, text } = buildVerificationEmail({
    firstName: input.firstName,
    verifyUrl,
    expiresHours: getVerifyTtlHours()
  })
  if (isEmailSendDisabled()) {
    console.info('[email-disabled] verification link:', verifyUrl)
  }
  return deliverEmail({ to: input.to, subject, html, text })
}

export async function sendExistingAccountEmail(input: {
  to: string
  firstName: string
}) {
  const baseUrl = getAppBaseUrl()
  const { subject, html, text } = buildExistingAccountEmail({
    firstName: input.firstName,
    loginUrl: `${baseUrl}/login`,
    resetUrl: `${baseUrl}/reset-password`
  })
  return deliverEmail({ to: input.to, subject, html, text })
}

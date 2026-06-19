export function getAppBaseUrl(): string {
  return (
    process.env.APP_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3001'
  )
}

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
}

export function getVerifyTtlHours(): number {
  const raw = Number(process.env.EMAIL_VERIFY_TTL_HOURS ?? 24)
  return Number.isFinite(raw) && raw > 0 ? raw : 24
}

export function isEmailSendDisabled(): boolean {
  return process.env.EMAIL_DISABLE_SEND === 'true'
}

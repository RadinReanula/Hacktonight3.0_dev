type VerificationEmailInput = {
  firstName: string
  verifyUrl: string
  expiresHours: number
}

type ExistingAccountEmailInput = {
  firstName: string
  loginUrl: string
  resetUrl: string
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f0f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(69,0,67,0.12);">
        <tr><td style="background:#450043;padding:24px 28px;">
          <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Nova Bank</p>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
        <tr><td style="padding:0 28px 24px;color:#6b7280;font-size:12px;line-height:1.5;">
          If you did not request this email, you can safely ignore it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#9a5c97;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">${label}</a>`
}

export function buildVerificationEmail(input: VerificationEmailInput) {
  const subject = 'Verify your Nova Bank email'
  const html = layout(
    subject,
    `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi ${input.firstName},</p>
     <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
       Thanks for signing up with Nova Bank. Please confirm your email address to activate your account.
     </p>
     ${button(input.verifyUrl, 'Verify email address')}
     <p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">
       This link expires in ${input.expiresHours} hours.
     </p>`
  )
  const text = `Hi ${input.firstName},\n\nVerify your Nova Bank email: ${input.verifyUrl}\n\nThis link expires in ${input.expiresHours} hours.`
  return { subject, html, text }
}

export function buildExistingAccountEmail(input: ExistingAccountEmailInput) {
  const subject = 'Nova Bank sign-up attempt'
  const html = layout(
    subject,
    `<p style="margin:0 0 12px;color:#111827;font-size:16px;">Hi ${input.firstName},</p>
     <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
       Someone tried to create a Nova Bank account using this email address, but an account already exists.
     </p>
     <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
       If this was you, sign in to your existing account or reset your password.
     </p>
     ${button(input.loginUrl, 'Sign in')}
     <p style="margin:16px 0 0;"><a href="${input.resetUrl}" style="color:#9a5c97;">Reset password</a></p>`
  )
  const text = `Hi ${input.firstName},\n\nAn account with this email already exists.\nSign in: ${input.loginUrl}\nReset password: ${input.resetUrl}`
  return { subject, html, text }
}

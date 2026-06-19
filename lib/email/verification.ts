import { randomBytes } from 'node:crypto'
import { hashSecret, verifySecret } from '@/lib/hash'
import { query } from '@/lib/db'
import { getVerifyTtlHours } from './config'

export function generateRawToken(): string {
  return randomBytes(32).toString('hex')
}

export async function invalidateUserTokens(userId: number) {
  await query(
    `UPDATE email_verification_tokens
     SET used_at = NOW()
     WHERE user_id = $1 AND used_at IS NULL`,
    [userId]
  )
}

export async function createVerificationToken(userId: number, purpose: string) {
  const rawToken = generateRawToken()
  const tokenHash = await hashSecret(rawToken)
  const ttlHours = getVerifyTtlHours()

  await invalidateUserTokens(userId)

  await query(
    `INSERT INTO email_verification_tokens (user_id, token_hash, purpose, expires_at)
     VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval)`,
    [userId, tokenHash, purpose, String(ttlHours)]
  )

  return rawToken
}

type TokenRow = {
  id: number
  user_id: number
  token_hash: string
}

export async function verifyEmailToken(
  rawToken: string
): Promise<{ userId: number } | null> {
  const active = await query<TokenRow>(
    `SELECT id, user_id, token_hash
     FROM email_verification_tokens
     WHERE used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`
  )

  for (const row of active.rows) {
    const match = await verifySecret(rawToken, row.token_hash)
    if (!match) continue

    await query(
      `UPDATE users
       SET email_verified = true, email_verified_at = NOW()
       WHERE id = $1`,
      [row.user_id]
    )
    await query(
      `UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1`,
      [row.id]
    )
    return { userId: row.user_id }
  }

  return null
}

export function firstNameFromFullName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'there'
}

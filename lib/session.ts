import { jwtVerify, SignJWT } from 'jose'

export const SESSION_COOKIE = 'nova_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  userId: number
  role: string
  username: string
}

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set (>=16 chars) in production.')
    }
    return new TextEncoder().encode(
      'dev-only-insecure-session-secret-change-me'
    )
  }
  return new TextEncoder().encode(secret)
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      typeof payload.userId !== 'number' ||
      typeof payload.role !== 'string' ||
      typeof payload.username !== 'string'
    ) {
      return null
    }
    return {
      userId: payload.userId,
      role: payload.role,
      username: payload.username
    }
  } catch {
    return null
  }
}

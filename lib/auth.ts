import { cookies } from 'next/headers'
import { query } from './db'
import { hashSecret, verifySecret } from './hash'
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  type SessionPayload,
  verifySessionToken
} from './session'

export type Session = SessionPayload

/** Typed HTTP error that routes can convert into a safe Response. */
export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
  toResponse() {
    return Response.json(
      { ok: false, message: this.message },
      { status: this.status }
    )
  }
}

/** Password / PIN hashing helpers. */
export const hashPassword = hashSecret
export const hashPin = hashSecret
export const verifyPassword = verifySecret

/** Verifies a PIN against the stored hash for an owned account number. */
export async function verifyPin(
  accountNumber: string,
  pin: string
): Promise<boolean> {
  const result = await query<{ pin_hash: string }>(
    'SELECT pin_hash FROM accounts WHERE account_number = $1',
    [accountNumber]
  )
  const row = result.rows[0]
  if (!row) return false
  return verifySecret(pin, row.pin_hash)
}

/** Sets the signed, http-only session cookie. */
export async function createSession(payload: SessionPayload) {
  const token = await createSessionToken(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

/** Clears the session cookie. */
export async function clearSession() {
  const store = await cookies()
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

/** Returns the current session, or null if unauthenticated. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

/** Returns the session or throws HttpError(401). */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new HttpError(401, 'Authentication required.')
  return session
}

/** Returns the session or throws HttpError(401/403) if role mismatches. */
export async function requireRole(role: string): Promise<Session> {
  const session = await requireSession()
  if (session.role !== role) throw new HttpError(403, 'Forbidden.')
  return session
}

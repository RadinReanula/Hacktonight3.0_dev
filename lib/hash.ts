import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifySecret(plain: string, hash: string): Promise<boolean> {
  if (!hash) return Promise.resolve(false)
  return bcrypt.compare(plain, hash)
}

/** Returns the value unchanged if it is already a bcrypt hash. */
export async function hashIfNeeded(value: string): Promise<string> {
  if (value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$')) {
    return value
  }
  return hashSecret(value)
}

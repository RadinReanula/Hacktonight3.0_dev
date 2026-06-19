import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifySecret(plain: string, hash: string): Promise<boolean> {
  if (!hash) return Promise.resolve(false)
  return bcrypt.compare(plain, hash)
}

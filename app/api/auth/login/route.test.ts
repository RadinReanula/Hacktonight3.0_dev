import { beforeEach, describe, expect, it, vi } from 'vitest'

const { query, verifyPassword } = vi.hoisted(() => ({
  query: vi.fn(),
  verifyPassword: vi.fn()
}))

vi.mock('@/lib/db', () => ({
  query,
  serviceFailure: (_reason: unknown) =>
    Response.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
}))

vi.mock('@/lib/auth', () => ({
  verifyPassword,
  createSession: vi.fn(),
  HttpError: class HttpError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
    toResponse() {
      return Response.json({ ok: false, message: this.message }, { status: this.status })
    }
  }
}))

vi.mock('@/lib/rate-limit', () => ({
  clientKey: () => 'test',
  rateLimit: () => true
}))

import { POST } from './route'

describe('login route email verification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    verifyPassword.mockResolvedValue(true)
  })

  it('blocks login when email is not verified', async () => {
    query.mockResolvedValue({
      rows: [
        {
          id: 1,
          username: 'newuser',
          role: 'customer',
          full_name: 'New User',
          password_hash: 'hash',
          email_verified: false
        }
      ]
    })

    const response = await POST(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', password: 'password123' })
      })
    )
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.code).toBe('EMAIL_NOT_VERIFIED')
  })
})

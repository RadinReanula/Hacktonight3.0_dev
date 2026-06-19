import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  query,
  hashPassword,
  createVerificationToken,
  sendVerificationEmail,
  sendExistingAccountEmail
} = vi.hoisted(() => ({
  query: vi.fn(),
  hashPassword: vi.fn(),
  createVerificationToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
  sendExistingAccountEmail: vi.fn()
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
  hashPassword,
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

vi.mock('@/lib/email/verification', () => ({
  createVerificationToken,
  firstNameFromFullName: (name: string) => name.split(' ')[0]
}))

vi.mock('@/lib/email/send', () => ({
  sendVerificationEmail,
  sendExistingAccountEmail
}))

import { POST } from './route'

describe('register route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashPassword.mockResolvedValue('hashed')
    createVerificationToken.mockResolvedValue('raw-token')
    sendVerificationEmail.mockResolvedValue({ ok: true })
    sendExistingAccountEmail.mockResolvedValue({ ok: true })
  })

  it('creates unverified user and sends verification email', async () => {
    query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 9, username: 'newuser' }] })

    const response = await POST(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          fullName: 'New User',
          email: 'new@example.test',
          password: 'password123'
        })
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body).toEqual({
      ok: true,
      needsVerification: true,
      message: 'Check your email to verify your account.'
    })
    expect(sendVerificationEmail).toHaveBeenCalledOnce()
    expect(createVerificationToken).toHaveBeenCalledWith(9, 'signup')
  })

  it('returns generic success when username exists', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })

    const response = await POST(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'dilara',
          fullName: 'Dilara',
          email: 'other@example.test',
          password: 'password123'
        })
      })
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.needsVerification).toBe(true)
    expect(sendExistingAccountEmail).toHaveBeenCalledOnce()
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })
})

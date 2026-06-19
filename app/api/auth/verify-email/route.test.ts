import { beforeEach, describe, expect, it, vi } from 'vitest'

const { verifyEmailToken, query, createSession } = vi.hoisted(() => ({
  verifyEmailToken: vi.fn(),
  query: vi.fn(),
  createSession: vi.fn()
}))

vi.mock('@/lib/email/verification', () => ({
  verifyEmailToken
}))

vi.mock('@/lib/email/config', () => ({
  getAppBaseUrl: () => 'http://localhost:3001'
}))

vi.mock('@/lib/auth', () => ({
  createSession
}))

vi.mock('@/lib/db', () => ({
  query,
  serviceFailure: (_reason: unknown) =>
    Response.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
}))

import { GET } from './route'

describe('verify-email route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createSession.mockResolvedValue(undefined)
  })

  it('signs in verified user and redirects to dashboard', async () => {
    verifyEmailToken.mockResolvedValue({ userId: 9 })
    query.mockResolvedValue({
      rows: [{ id: 9, username: 'newuser', role: 'customer' }]
    })

    const response = await GET(
      new Request('http://localhost/api/auth/verify-email?token=abc')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/dashboard?verified=1'
    )
    expect(createSession).toHaveBeenCalledWith({
      userId: 9,
      role: 'customer',
      username: 'newuser'
    })
  })

  it('redirects to login with invalid flag when token fails', async () => {
    verifyEmailToken.mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost/api/auth/verify-email?token=bad')
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/login?verify=invalid'
    )
    expect(createSession).not.toHaveBeenCalled()
  })
})

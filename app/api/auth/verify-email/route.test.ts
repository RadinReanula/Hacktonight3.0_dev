import { beforeEach, describe, expect, it, vi } from 'vitest'

const { verifyEmailToken } = vi.hoisted(() => ({
  verifyEmailToken: vi.fn()
}))

vi.mock('@/lib/email/verification', () => ({
  verifyEmailToken
}))

vi.mock('@/lib/email/config', () => ({
  getAppBaseUrl: () => 'http://localhost:3001'
}))

vi.mock('@/lib/db', () => ({
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
  })

  it('redirects to login with verified flag on success', async () => {
    verifyEmailToken.mockResolvedValue({ userId: 1 })

    const response = await GET(
      new Request('http://localhost/api/auth/verify-email?token=abc')
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/login?verified=1'
    )
  })

  it('redirects to login with invalid flag when token fails', async () => {
    verifyEmailToken.mockResolvedValue(null)

    const response = await GET(
      new Request('http://localhost/api/auth/verify-email?token=bad')
    )

    expect(response.headers.get('location')).toBe(
      'http://localhost:3001/login?verify=invalid'
    )
  })
})

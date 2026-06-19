import { beforeEach, describe, expect, it, vi } from 'vitest'

const { clearSession } = vi.hoisted(() => ({
  clearSession: vi.fn()
}))

vi.mock('@/lib/auth', () => ({
  clearSession
}))

vi.mock('@/lib/db', () => ({
  serviceFailure: (_reason: unknown) =>
    Response.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
}))

import { POST } from './route'

describe('logout route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearSession.mockResolvedValue(undefined)
  })

  it('POST clears the session and returns ok', async () => {
    const response = await POST()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(clearSession).toHaveBeenCalledOnce()
  })
})

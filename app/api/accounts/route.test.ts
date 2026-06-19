import { beforeEach, describe, expect, it, vi } from 'vitest'

const { requireSession, hashPin, query } = vi.hoisted(() => ({
  requireSession: vi.fn(),
  hashPin: vi.fn(),
  query: vi.fn()
}))

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>()
  return {
    ...actual,
    requireSession,
    hashPin
  }
})

vi.mock('@/lib/db', () => ({
  query,
  serviceFailure: (_reason: unknown) =>
    Response.json(
      { ok: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
}))

import { HttpError } from '@/lib/auth'
import { DELETE, GET, PATCH, POST } from './route'

describe('accounts route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    hashPin.mockResolvedValue('hashed-pin')
  })

  it('GET returns 401 when unauthenticated', async () => {
    requireSession.mockRejectedValue(
      new HttpError(401, 'Authentication required.')
    )

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('GET returns accounts without pin_hash', async () => {
    requireSession.mockResolvedValue({ userId: 1, role: 'customer' })
    query.mockResolvedValue({
      rows: [
        {
          id: 1,
          account_number: '1000003423',
          account_name: 'Savings',
          balance: '100000.00'
        }
      ]
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.accounts).toEqual([
      {
        id: 1,
        accountNumber: '1000003423',
        accountName: 'Savings',
        balance: 100000
      }
    ])
    expect(JSON.stringify(body)).not.toContain('pin_hash')
  })

  it('POST returns 409 for duplicate account number', async () => {
    requireSession.mockResolvedValue({ userId: 1, role: 'customer' })
    query.mockRejectedValue({ code: '23505' })

    const response = await POST(
      new Request('http://localhost/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_number: '1000003423',
          account_name: 'Duplicate'
        })
      })
    )

    expect(response.status).toBe(409)
  })

  it('PATCH returns 404 when account is not owned', async () => {
    requireSession.mockResolvedValue({ userId: 1, role: 'customer' })
    query.mockResolvedValue({ rows: [], rowCount: 0 })

    const response = await PATCH(
      new Request('http://localhost/api/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 99, account_name: 'New name' })
      })
    )

    expect(response.status).toBe(404)
  })

  it('DELETE blocks non-zero balance accounts', async () => {
    requireSession.mockResolvedValue({ userId: 1, role: 'customer' })
    query.mockResolvedValueOnce({
      rows: [{ balance: '500.00' }],
      rowCount: 1
    })

    const response = await DELETE(
      new Request('http://localhost/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 })
      })
    )

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.message).toContain('non-zero balance')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError, requireSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { GET } from './route'

vi.mock('@/lib/auth', () => {
  class HttpError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
    toResponse() {
      return Response.json(
        { ok: false, message: this.message },
        { status: this.status }
      )
    }
  }
  return {
    requireSession: vi.fn(),
    HttpError
  }
})

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  serviceFailure: vi.fn(() =>
    Response.json({ ok: false, message: 'Server Failure' }, { status: 500 })
  )
}))

describe('GET /api/transactions', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 401 if authentication fails', async () => {
    vi.mocked(requireSession).mockRejectedValueOnce(
      new HttpError(401, 'Authentication required.')
    )

    const request = new Request('http://localhost/api/transactions')
    const response = await GET(request)
    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  it('returns transactions for user-owned accounts', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    // Mock accounts query
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { account_number: '1000003423' },
        { account_number: '1000004876' }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    // Mock count query
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ count: 15 }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    // Mock transactions select query
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          from_account: '1000003423',
          to_account: '1000004876',
          amount: 100.0,
          description: 'Test'
        }
      ],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    const request = new Request(
      'http://localhost/api/transactions?page=1&pageSize=10'
    )
    const response = await GET(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.transactions).toHaveLength(1)
    expect(body.pagination.total).toBe(15)
  })

  it('enforces owner-scoping when target account is specified', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    // Mock owned accounts query
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ account_number: '1000003423' }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    const request = new Request(
      'http://localhost/api/transactions?accountNumber=2000006754'
    )
    const response = await GET(request)
    expect(response.status).toBe(403)

    const body = await response.json()
    expect(body.ok).toBe(false)
    expect(body.message).toContain('Forbidden')
  })
})

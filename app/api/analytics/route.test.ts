import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireSession } from '@/lib/auth'
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

describe('GET /api/analytics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fails with 400 for invalid period parameter', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    const request = new Request(
      'http://localhost/api/analytics?period=invalid_period'
    )
    const response = await GET(request)
    expect(response.status).toBe(400)
  })

  it('returns valid spend analytics data', async () => {
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

    // Mock current period totals (spent = 5000, income = 12000)
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ total_expense: 5000.0, total_income: 12000.0 }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    // Mock previous period totals (spent = 4000, income = 10000)
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ total_expense: 4000.0, total_income: 10000.0 }],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    // Mock spend by category
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { category: 'Utilities', total: 3000.0 },
        { category: 'Dining', total: 2000.0 }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    // Mock spend over time (daily)
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { date: new Date('2026-06-10'), amount: 1500.0 },
        { date: new Date('2026-06-15'), amount: 3500.0 }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    // Mock top payees
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { name: 'Ceylon Electricity Board', total: 3000.0, count: 1 },
        { name: 'Pizza Hut', total: 2000.0, count: 2 }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    const request = new Request(
      'http://localhost/api/analytics?period=this_month'
    )
    const response = await GET(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.totals.current.expense).toBe(5000)
    expect(body.totals.current.income).toBe(12000)
    expect(body.totals.current.net).toBe(7000)
    expect(body.totals.previous.expense).toBe(4000)
    expect(body.totals.previous.income).toBe(10000)
    expect(body.categories).toHaveLength(2)
    expect(body.overTime).toHaveLength(2)
    expect(body.topPayees).toHaveLength(2)
  })
})

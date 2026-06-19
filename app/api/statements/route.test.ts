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

describe('GET /api/statements', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fails with 400 if required query params are missing', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    const request = new Request('http://localhost/api/statements')
    const response = await GET(request)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.ok).toBe(false)
  })

  it('returns statement with calculated opening/closing balances and running balances', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    // Mock account details query (current balance is 1000.00)
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        {
          account_name: 'Dilara Savings',
          account_number: '1000003423',
          balance: 1000.0
        }
      ],
      command: '',
      rowCount: 1,
      oid: 0,
      fields: []
    })

    // Mock queries to fetch transactions AFTER the from date (to calculate opening balance)
    // Let's say: 1 outgoing transaction of 200, 1 incoming transaction of 300 after 'from' date
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { type: 'OUT', total: 200.0 },
        { type: 'IN', total: 300.0 }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    // Mock range totals query (totals between [from, to])
    // Let's say: total credits = 100, total debits = 150
    vi.mocked(query).mockResolvedValueOnce({
      rows: [
        { type: 'OUT', total: 150.0 },
        { type: 'IN', total: 100.0 }
      ],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    // Mock line items query (sorted chronological ASC)
    const mockTx1 = {
      id: 1,
      from_account: '1000003423',
      to_account: '9999999999',
      amount: 150.0,
      description: 'Debited'
    }
    const mockTx2 = {
      id: 2,
      from_account: '9999999999',
      to_account: '1000003423',
      amount: 100.0,
      description: 'Credited'
    }
    vi.mocked(query).mockResolvedValueOnce({
      rows: [mockTx1, mockTx2],
      command: '',
      rowCount: 2,
      oid: 0,
      fields: []
    })

    const request = new Request(
      'http://localhost/api/statements?accountNumber=1000003423&from=2026-06-01&to=2026-06-20'
    )
    const response = await GET(request)
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.ok).toBe(true)
    expect(body.account.name).toBe('Dilara Savings')

    // Opening balance calculation: current (1000) + out_after_from (200) - in_after_from (300) = 900
    expect(body.summary.openingBalance).toBe(900)

    // Closing balance calculation: opening (900) + total_credits (100) - total_debits (150) = 850
    expect(body.summary.closingBalance).toBe(850)

    // Check line items running balances:
    // Start at opening balance (900).
    // Tx1 is debit of 150 -> running balance = 750
    // Tx2 is credit of 100 -> running balance = 850
    expect(body.transactions[0].runningBalance).toBe(750)
    expect(body.transactions[1].runningBalance).toBe(850)
  })

  it('restricts access to non-owned accounts', async () => {
    vi.mocked(requireSession).mockResolvedValueOnce({
      userId: 1,
      role: 'customer',
      username: 'dilara'
    })

    // Mock account check returning empty row (not found or not owned)
    vi.mocked(query).mockResolvedValueOnce({
      rows: [],
      command: '',
      rowCount: 0,
      oid: 0,
      fields: []
    })

    const request = new Request(
      'http://localhost/api/statements?accountNumber=2000006754&from=2026-06-01&to=2026-06-20'
    )
    const response = await GET(request)
    expect(response.status).toBe(403)
  })
})

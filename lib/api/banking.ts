export type Account = {
  id: number
  accountNumber: string
  accountName: string
  balance: number
}

export type Transaction = {
  id: number
  from_account: string
  to_account: string
  amount: number
  description: string | null
  status: string
  created_at: string
  type?: 'credit' | 'debit'
  runningBalance?: number
}

export type StatementSummary = {
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
}

export type StatementResponse = {
  ok: boolean
  account: {
    name: string
    number: string
  }
  summary: StatementSummary
  transactions: Transaction[]
}

export type AnalyticsTotals = {
  current: { expense: number; income: number; net: number }
  previous: { expense: number; income: number; net: number }
}

export type CategorySpend = {
  category: string
  total: number
}

export type OverTimeSpend = {
  date: string
  amount: number
}

export type PayeeSpend = {
  name: string
  total: number
  count: number
}

export type AnalyticsResponse = {
  ok: boolean
  totals: AnalyticsTotals
  categories: CategorySpend[]
  overTime: OverTimeSpend[]
  topPayees: PayeeSpend[]
}

export type TransactionsResponse = {
  ok: boolean
  transactions: Transaction[]
  pagination: {
    total: number
    page: number
    pageSize: number
    pages: number
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    message?: string
  } & T
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }
  return data
}

export function getMeRequest() {
  return fetchJson<{
    ok: true
    user: { id: number; username: string; role: string }
  }>('/api/auth/me')
}

export function getAccountsRequest(userId: number) {
  return fetchJson<{ ok: boolean; accounts: Account[] }>(
    `/api/accounts?userId=${userId}`
  )
}

export function getStatementsRequest(
  accountNumber: string,
  from: string,
  to: string
) {
  const params = new URLSearchParams({ accountNumber, from, to })
  return fetchJson<StatementResponse>(`/api/statements?${params.toString()}`)
}

export function getAnalyticsRequest(period: string) {
  return fetchJson<AnalyticsResponse>(`/api/analytics?period=${period}`)
}

export function getTransactionsRequest(params: {
  accountNumber?: string
  from?: string
  to?: string
  page: number
  pageSize: number
}) {
  const query = new URLSearchParams()
  if (params.accountNumber) query.append('accountNumber', params.accountNumber)
  if (params.from) query.append('from', params.from)
  if (params.to) query.append('to', params.to)
  query.append('page', params.page.toString())
  query.append('pageSize', params.pageSize.toString())

  return fetchJson<TransactionsResponse>(
    `/api/transactions?${query.toString()}`
  )
}

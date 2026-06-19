export type OverviewAccount = {
  id: number
  accountNumber: string
  accountName: string
  balance: number
}

export type RecentTransaction = {
  id: number
  direction: 'in' | 'out'
  counterparty: string
  amount: number
  description: string | null
  createdAt: string
}

export type OverviewResponse = {
  ok: true
  fullName: string
  totalBalance: number
  accounts: OverviewAccount[]
  recentTransactions: RecentTransaction[]
}

export async function fetchOverview(): Promise<OverviewResponse> {
  const res = await fetch('/api/overview')
  const data = (await res.json().catch(() => ({}))) as OverviewResponse & {
    ok?: boolean
    message?: string
  }
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }
  return data
}

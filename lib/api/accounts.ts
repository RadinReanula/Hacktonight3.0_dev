export type Account = {
  id: number
  accountNumber: string
  accountName: string
  balance: number
}

type ApiError = { ok: false; message?: string }
type AccountsResponse = { ok: true; accounts: Account[] }
type AccountResponse = { ok: true; account: Account }

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = (await res.json().catch(() => ({}))) as T & ApiError
  if (!res.ok || !('ok' in data) || !data.ok) {
    throw new Error(
      (data as ApiError).message || 'Something went wrong. Please try again.'
    )
  }
  return data
}

export async function fetchAccounts() {
  const data = await requestJson<AccountsResponse>('/api/accounts')
  return data.accounts
}

export function createAccount(input: {
  account_number: string
  account_name: string
  pin?: string
}) {
  return requestJson<AccountResponse>('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}

export function updateAccount(input: { id: number; account_name: string }) {
  return requestJson<AccountResponse>('/api/accounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}

export function deleteAccount(input: { id: number }) {
  return requestJson<{ ok: true }>('/api/accounts', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}

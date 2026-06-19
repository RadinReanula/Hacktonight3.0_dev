async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    message?: string
  } & T
  if (!res.ok || !data.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.')
  }
  return data
}

export type TransferResult = {
  ok: true
  transaction: {
    id: number
    fromAccount: string
    toAccount: string
    amount: number
    description: string | null
    status: string
    createdAt: string
  }
}

export function postTransfer(body: {
  fromAccount: string
  toAccount: string
  amount: number
  description?: string
  pin: string
}) {
  return postJson<TransferResult>('/api/transfer', body)
}

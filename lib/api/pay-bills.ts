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

export type PayBillResult = {
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

export function postPayBill(body: {
  fromAccount: string
  billerId: number
  reference: string
  amount: number
  pin: string
}) {
  return postJson<PayBillResult>('/api/pay-bills', body)
}

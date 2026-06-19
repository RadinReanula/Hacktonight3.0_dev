async function getJson<T>(url: string): Promise<T> {
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

export type Biller = {
  id: number
  slug: string
  name: string
  category: string
  logoPath: string | null
}

export function fetchBillers() {
  return getJson<{ ok: true; billers: Biller[] }>('/api/billers')
}

export type AuthUser = {
  id: number
  username: string
  role: string
  fullName?: string
}

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

export function loginRequest(input: { username: string; password: string }) {
  return postJson<{ ok: true; user: AuthUser }>('/api/auth/login', input)
}

export function registerRequest(input: {
  username: string
  fullName: string
  email: string
  password: string
}) {
  return postJson<{ ok: true; user: AuthUser }>('/api/auth/register', input)
}

export function logoutRequest() {
  return postJson<{ ok: true }>('/api/auth/logout', {})
}

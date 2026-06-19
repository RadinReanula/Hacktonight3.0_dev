import { clearSession } from '@/lib/auth'
import { serviceFailure } from '@/lib/db'

export async function POST() {
  try {
    await clearSession()
    return Response.json({ ok: true })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

import { getSession } from '@/lib/auth'
import { serviceFailure } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json(
        { ok: false, message: 'Not authenticated.' },
        { status: 401 }
      )
    }
    return Response.json({
      ok: true,
      user: {
        id: session.userId,
        username: session.username,
        role: session.role
      }
    })
  } catch (reason) {
    return serviceFailure(reason)
  }
}

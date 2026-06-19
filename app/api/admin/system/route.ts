import { HttpError, requireRole } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

export async function GET() {
  try {
    await requireRole('admin')

    const [users, accounts, logs] = await Promise.all([
      query(
        'SELECT id, username, role, full_name, email, created_at FROM users ORDER BY id'
      ),
      query(
        'SELECT id, user_id, account_number, account_name, balance, created_at FROM accounts ORDER BY id'
      ),
      query(
        'SELECT id, event, payload, created_at FROM audit_logs ORDER BY id DESC LIMIT 20'
      )
    ])

    return Response.json({
      ok: true,
      message: 'System overview.',
      users: users.rows,
      accounts: accounts.rows,
      auditLogs: logs.rows
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

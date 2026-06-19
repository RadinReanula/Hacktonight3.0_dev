import { HttpError, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

type UserRow = { full_name: string }

type AccountRow = {
  id: number
  account_number: string
  account_name: string
  balance: string
}

type TransactionRow = {
  id: number
  from_account: string
  to_account: string
  amount: string
  description: string | null
  created_at: Date
}

export async function GET() {
  try {
    const session = await requireSession()

    const userResult = await query<UserRow>(
      'SELECT full_name FROM users WHERE id = $1',
      [session.userId]
    )
    const user = userResult.rows[0]
    if (!user) {
      return Response.json(
        { ok: false, message: 'User not found.' },
        { status: 404 }
      )
    }

    const accountsResult = await query<AccountRow>(
      `SELECT id, account_number, account_name, balance
       FROM accounts WHERE user_id = $1 ORDER BY id`,
      [session.userId]
    )

    const accounts = accountsResult.rows.map((row) => ({
      id: row.id,
      accountNumber: row.account_number,
      accountName: row.account_name,
      balance: Number(row.balance)
    }))

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
    const accountNumbers = accounts.map((a) => a.accountNumber)

    let recentTransactions: Array<{
      id: number
      direction: 'in' | 'out'
      counterparty: string
      amount: number
      description: string | null
      createdAt: string
    }> = []

    if (accountNumbers.length > 0) {
      const txResult = await query<TransactionRow>(
        `SELECT id, from_account, to_account, amount, description, created_at
         FROM transactions
         WHERE from_account = ANY($1::text[]) OR to_account = ANY($1::text[])
         ORDER BY created_at DESC
         LIMIT 8`,
        [accountNumbers]
      )

      const owned = new Set(accountNumbers)
      recentTransactions = txResult.rows.map((row) => {
        const isOut = owned.has(row.from_account)
        return {
          id: row.id,
          direction: isOut ? ('out' as const) : ('in' as const),
          counterparty: isOut ? row.to_account : row.from_account,
          amount: Number(row.amount),
          description: row.description,
          createdAt: row.created_at.toISOString()
        }
      })
    }

    return Response.json({
      ok: true,
      fullName: user.full_name,
      totalBalance,
      accounts,
      recentTransactions
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

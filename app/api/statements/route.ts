import { z } from 'zod'
import { HttpError, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

const dateSchema = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: 'Invalid date format'
})

const statementQuerySchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  from: dateSchema,
  to: dateSchema
})

export async function GET(request: Request) {
  try {
    const session = await requireSession()

    const { searchParams } = new URL(request.url)
    const rawParams = {
      accountNumber: searchParams.get('accountNumber') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined
    }

    const parsed = statementQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      return Response.json(
        {
          ok: false,
          message: 'Invalid query parameters.',
          errors: parsed.error.format()
        },
        { status: 400 }
      )
    }

    const { accountNumber, from, to } = parsed.data
    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Fetch and check ownership of the account
    const accountRes = await query<{
      account_name: string
      account_number: string
      balance: number
    }>(
      'SELECT account_name, account_number, balance::float FROM accounts WHERE account_number = $1 AND user_id = $2',
      [accountNumber, session.userId]
    )
    const account = accountRes.rows[0]
    if (!account) {
      return Response.json(
        {
          ok: false,
          message:
            'Forbidden or account not found. You do not own this account.'
        },
        { status: 403 }
      )
    }

    // Fetch sum of all transactions AFTER the from date to walk back current balance
    const afterFromRes = await query<{ type: string; total: number }>(
      `SELECT 
         CASE WHEN from_account = $1 THEN 'OUT' ELSE 'IN' END as type,
         SUM(amount)::float as total
       FROM transactions
       WHERE (from_account = $1 OR to_account = $1)
         AND created_at >= $2
       GROUP BY 1`,
      [accountNumber, fromDate]
    )

    let outSumAfterFrom = 0
    let inSumAfterFrom = 0
    for (const row of afterFromRes.rows) {
      if (row.type === 'OUT') outSumAfterFrom = row.total
      if (row.type === 'IN') inSumAfterFrom = row.total
    }

    // opening balance = current balance + outgoing after from - incoming after from
    const openingBalance = account.balance + outSumAfterFrom - inSumAfterFrom

    // Fetch total credits/debits in the specified range [from, to]
    const rangeTotalsRes = await query<{ type: string; total: number }>(
      `SELECT 
         CASE WHEN from_account = $1 THEN 'OUT' ELSE 'IN' END as type,
         SUM(amount)::float as total
       FROM transactions
       WHERE (from_account = $1 OR to_account = $1)
         AND created_at >= $2
         AND created_at <= $3
       GROUP BY 1`,
      [accountNumber, fromDate, toDate]
    )

    let totalDebits = 0
    let totalCredits = 0
    for (const row of rangeTotalsRes.rows) {
      if (row.type === 'OUT') totalDebits = row.total
      if (row.type === 'IN') totalCredits = row.total
    }

    const closingBalance = openingBalance + totalCredits - totalDebits

    // Fetch line items inside [from, to]
    const lineItemsRes = await query<{
      id: number
      from_account: string
      to_account: string
      amount: number
      description: string | null
      status: string
      created_at: Date
    }>(
      `SELECT * 
       FROM transactions
       WHERE (from_account = $1 OR to_account = $1)
         AND created_at >= $2
         AND created_at <= $3
       ORDER BY created_at ASC, id ASC`,
      [accountNumber, fromDate, toDate]
    )

    let currentRunning = openingBalance
    const lineItems = lineItemsRes.rows.map((t) => {
      const isCredit = t.to_account === accountNumber
      const amountFloat = Number(t.amount)
      if (isCredit) {
        currentRunning += amountFloat
      } else {
        currentRunning -= amountFloat
      }
      return {
        id: t.id,
        from_account: t.from_account,
        to_account: t.to_account,
        amount: amountFloat,
        description: t.description,
        status: t.status,
        created_at: t.created_at,
        type: isCredit ? ('credit' as const) : ('debit' as const),
        runningBalance: currentRunning
      }
    })

    return Response.json({
      ok: true,
      account: {
        name: account.account_name,
        number: account.account_number
      },
      summary: {
        openingBalance,
        closingBalance,
        totalCredits,
        totalDebits
      },
      transactions: lineItems
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return error.toResponse()
    }
    return serviceFailure(error)
  }
}

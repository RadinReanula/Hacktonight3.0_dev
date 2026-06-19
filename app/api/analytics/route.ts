import { z } from 'zod'
import { HttpError, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

const periodSchema = z
  .enum(['this_month', 'last_month', '90_days'])
  .default('this_month')

export async function GET(request: Request) {
  try {
    const session = await requireSession()

    const { searchParams } = new URL(request.url)
    const rawPeriod = searchParams.get('period') || undefined
    const parsed = periodSchema.safeParse(rawPeriod)

    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid period parameter.' },
        { status: 400 }
      )
    }

    const period = parsed.data
    const now = new Date()
    let fromDate: Date
    let toDate: Date = now

    if (period === 'last_month') {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      fromDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        1,
        0,
        0,
        0,
        0
      )
      toDate = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      )
    } else if (period === '90_days') {
      fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    } else {
      // default to 'this_month'
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    }

    const diffMs = toDate.getTime() - fromDate.getTime()
    const prevFromDate = new Date(fromDate.getTime() - diffMs)
    const prevToDate = fromDate

    // Fetch owned accounts for the authenticated user
    const accountsResult = await query<{ account_number: string }>(
      'SELECT account_number FROM accounts WHERE user_id = $1',
      [session.userId]
    )
    const ownedAccounts = accountsResult.rows.map((row) => row.account_number)

    if (ownedAccounts.length === 0) {
      return Response.json({
        ok: true,
        totals: {
          current: { expense: 0, income: 0, net: 0 },
          previous: { expense: 0, income: 0, net: 0 }
        },
        categories: [],
        overTime: [],
        topPayees: []
      })
    }

    // 1. Current Period Totals
    const currentTotalsRes = await query<{
      total_expense: number
      total_income: number
    }>(
      `SELECT 
         COALESCE(SUM(CASE WHEN from_account = ANY($1) AND NOT (to_account = ANY($1)) THEN amount ELSE 0 END), 0)::float as total_expense,
         COALESCE(SUM(CASE WHEN to_account = ANY($1) AND NOT (from_account = ANY($1)) THEN amount ELSE 0 END), 0)::float as total_income
       FROM transactions
       WHERE (from_account = ANY($1) OR to_account = ANY($1))
         AND created_at >= $2
         AND created_at <= $3`,
      [ownedAccounts, fromDate, toDate]
    )
    const currentTotals = currentTotalsRes.rows[0] || {
      total_expense: 0,
      total_income: 0
    }

    // 2. Previous Period Totals
    const prevTotalsRes = await query<{
      total_expense: number
      total_income: number
    }>(
      `SELECT 
         COALESCE(SUM(CASE WHEN from_account = ANY($1) AND NOT (to_account = ANY($1)) THEN amount ELSE 0 END), 0)::float as total_expense,
         COALESCE(SUM(CASE WHEN to_account = ANY($1) AND NOT (from_account = ANY($1)) THEN amount ELSE 0 END), 0)::float as total_income
       FROM transactions
       WHERE (from_account = ANY($1) OR to_account = ANY($1))
         AND created_at >= $2
         AND created_at < $3`,
      [ownedAccounts, prevFromDate, prevToDate]
    )
    const prevTotals = prevTotalsRes.rows[0] || {
      total_expense: 0,
      total_income: 0
    }

    // 3. Spend by Category (Current Period)
    const categoriesRes = await query<{ category: string; total: number }>(
      `SELECT 
         CASE 
           WHEN LOWER(t.description) LIKE '%ceb%' OR LOWER(t.description) LIKE '%electricity%' OR LOWER(t.description) LIKE '%water%' OR LOWER(t.description) LIKE '%dialog%' OR LOWER(t.description) LIKE '%hutch%' OR LOWER(t.description) LIKE '%airtel%' OR LOWER(t.description) LIKE '%bill%' THEN 'Utilities'
           WHEN LOWER(t.description) LIKE '%lunch%' OR LOWER(t.description) LIKE '%dinner%' OR LOWER(t.description) LIKE '%food%' OR LOWER(t.description) LIKE '%restaurant%' OR LOWER(t.description) LIKE '%cafe%' OR LOWER(t.description) LIKE '%keells%' OR LOWER(t.description) LIKE '%cargills%' THEN 'Dining'
           WHEN LOWER(t.description) LIKE '%move%' OR LOWER(t.description) LIKE '%transfer%' THEN 'Transfers'
           WHEN LOWER(t.description) LIKE '%amazon%' OR LOWER(t.description) LIKE '%daraz%' OR LOWER(t.description) LIKE '%shopping%' THEN 'Shopping'
           WHEN LOWER(t.description) LIKE '%netflix%' OR LOWER(t.description) LIKE '%spotify%' OR LOWER(t.description) LIKE '%movie%' OR LOWER(t.description) LIKE '%tv%' THEN 'Entertainment'
           ELSE 'General'
         END as category,
         SUM(t.amount)::float as total
       FROM transactions t
       WHERE t.from_account = ANY($1) 
         AND NOT (t.to_account = ANY($1))
         AND t.created_at >= $2
         AND t.created_at <= $3
       GROUP BY 1
       ORDER BY total DESC`,
      [ownedAccounts, fromDate, toDate]
    )

    // 4. Spend over Time (Current Period - Daily)
    const overTimeRes = await query<{ date: Date; amount: number }>(
      `SELECT 
         DATE(t.created_at) as date,
         SUM(t.amount)::float as amount
       FROM transactions t
       WHERE t.from_account = ANY($1) 
         AND NOT (t.to_account = ANY($1))
         AND t.created_at >= $2
         AND t.created_at <= $3
       GROUP BY 1
       ORDER BY 1 ASC`,
      [ownedAccounts, fromDate, toDate]
    )

    // Format overTime dates to YYYY-MM-DD
    const overTime = overTimeRes.rows.map((row) => {
      const d = new Date(row.date)
      const formattedDate = d.toISOString().split('T')[0]
      return {
        date: formattedDate,
        amount: row.amount
      }
    })

    // 5. Top Payees (Current Period)
    const topPayeesRes = await query<{
      name: string
      total: number
      count: number
    }>(
      `SELECT 
         COALESCE(a.account_name, MAX(t.description), t.to_account, 'Unknown Payee') as name,
         SUM(t.amount)::float as total,
         COUNT(*)::int as count
       FROM transactions t
       LEFT JOIN accounts a ON t.to_account = a.account_number
       WHERE t.from_account = ANY($1) 
         AND NOT (t.to_account = ANY($1))
         AND t.created_at >= $2
         AND t.created_at <= $3
       GROUP BY t.to_account, a.account_name
       ORDER BY total DESC
       LIMIT 5`,
      [ownedAccounts, fromDate, toDate]
    )

    return Response.json({
      ok: true,
      totals: {
        current: {
          expense: currentTotals.total_expense,
          income: currentTotals.total_income,
          net: currentTotals.total_income - currentTotals.total_expense
        },
        previous: {
          expense: prevTotals.total_expense,
          income: prevTotals.total_income,
          net: prevTotals.total_income - prevTotals.total_expense
        }
      },
      categories: categoriesRes.rows,
      overTime,
      topPayees: topPayeesRes.rows
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return error.toResponse()
    }
    return serviceFailure(error)
  }
}

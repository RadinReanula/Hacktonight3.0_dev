import { z } from 'zod'
import { HttpError, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'

const dateSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  })
  .optional()

const querySchema = z.object({
  accountNumber: z.string().optional(),
  from: dateSchema,
  to: dateSchema,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
})

export async function GET(request: Request) {
  try {
    const session = await requireSession()

    const { searchParams } = new URL(request.url)
    const rawParams = {
      accountNumber: searchParams.get('accountNumber') || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined
    }

    const parsed = querySchema.safeParse(rawParams)
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

    const { accountNumber, from, to, page, pageSize } = parsed.data
    const offset = (page - 1) * pageSize

    // Fetch owned accounts for the authenticated user
    const accountsResult = await query<{ account_number: string }>(
      'SELECT account_number FROM accounts WHERE user_id = $1',
      [session.userId]
    )
    const ownedAccounts = accountsResult.rows.map((row) => row.account_number)

    if (ownedAccounts.length === 0) {
      return Response.json({
        ok: true,
        transactions: [],
        pagination: {
          total: 0,
          page,
          pageSize,
          pages: 0
        }
      })
    }

    // Determine target account(s) and verify ownership
    let targetAccounts = ownedAccounts
    if (accountNumber) {
      if (!ownedAccounts.includes(accountNumber)) {
        return Response.json(
          { ok: false, message: 'Forbidden. You do not own this account.' },
          { status: 403 }
        )
      }
      targetAccounts = [accountNumber]
    }

    // Build dynamic query
    let baseWhere = '(t.from_account = ANY($1) OR t.to_account = ANY($1))'
    const queryParams: unknown[] = [targetAccounts]
    let paramCounter = 2

    if (from) {
      baseWhere += ` AND t.created_at >= $${paramCounter}`
      queryParams.push(new Date(from))
      paramCounter++
    }

    if (to) {
      baseWhere += ` AND t.created_at <= $${paramCounter}`
      queryParams.push(new Date(to))
      paramCounter++
    }

    // Get total count
    const countQuery = `SELECT COUNT(*)::int as count FROM transactions t WHERE ${baseWhere}`
    const countResult = await query<{ count: number }>(countQuery, queryParams)
    const total = countResult.rows[0]?.count || 0

    // Add pagination params
    const selectQuery = `
      SELECT t.* 
      FROM transactions t 
      WHERE ${baseWhere} 
      ORDER BY t.created_at DESC 
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `
    queryParams.push(pageSize)
    queryParams.push(offset)

    const transactionsResult = await query(selectQuery, queryParams)
    const pages = Math.ceil(total / pageSize)

    return Response.json({
      ok: true,
      transactions: transactionsResult.rows,
      pagination: {
        total,
        page,
        pageSize,
        pages
      }
    })
  } catch (error) {
    if (error instanceof HttpError) {
      return error.toResponse()
    }
    return serviceFailure(error)
  }
}

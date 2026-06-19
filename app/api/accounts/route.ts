import { HttpError, hashPin, requireSession } from '@/lib/auth'
import { query, serviceFailure } from '@/lib/db'
import {
  createAccountSchema,
  deleteAccountSchema,
  patchAccountSchema
} from '@/lib/schemas/accounts'

type AccountRow = {
  id: number
  account_number: string
  account_name: string
  balance: string
}

function mapAccount(row: AccountRow) {
  return {
    id: row.id,
    accountNumber: row.account_number,
    accountName: row.account_name,
    balance: Number(row.balance)
  }
}

function isUniqueViolation(err: unknown) {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: string }).code === '23505'
  )
}

export async function GET() {
  try {
    const session = await requireSession()
    const result = await query<AccountRow>(
      `SELECT id, account_number, account_name, balance
       FROM accounts WHERE user_id = $1 ORDER BY id`,
      [session.userId]
    )

    return Response.json({
      ok: true,
      accounts: result.rows.map(mapAccount)
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json().catch(() => ({}))
    const parsed = createAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid account details.' },
        { status: 400 }
      )
    }

    const { account_number, account_name, pin } = parsed.data
    const pinHash = await hashPin(pin ?? '0000')

    const result = await query<AccountRow>(
      `INSERT INTO accounts (user_id, account_number, account_name, balance, pin_hash)
       VALUES ($1, $2, $3, 0, $4)
       RETURNING id, account_number, account_name, balance`,
      [session.userId, account_number, account_name, pinHash]
    )

    return Response.json({
      ok: true,
      account: mapAccount(result.rows[0])
    })
  } catch (reason) {
    if (isUniqueViolation(reason)) {
      return Response.json(
        { ok: false, message: 'Account number already exists.' },
        { status: 409 }
      )
    }
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json().catch(() => ({}))
    const parsed = patchAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid account details.' },
        { status: 400 }
      )
    }

    const { id, account_name } = parsed.data
    const result = await query<AccountRow>(
      `UPDATE accounts SET account_name = $1
       WHERE user_id = $2 AND id = $3
       RETURNING id, account_number, account_name, balance`,
      [account_name, session.userId, id]
    )

    if (result.rowCount === 0) {
      return Response.json(
        { ok: false, message: 'Account not found.' },
        { status: 404 }
      )
    }

    return Response.json({
      ok: true,
      account: mapAccount(result.rows[0])
    })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json().catch(() => ({}))
    const parsed = deleteAccountSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid account details.' },
        { status: 400 }
      )
    }

    const { id } = parsed.data
    const existing = await query<{ balance: string }>(
      `SELECT balance FROM accounts WHERE user_id = $1 AND id = $2`,
      [session.userId, id]
    )

    if (existing.rowCount === 0) {
      return Response.json(
        { ok: false, message: 'Account not found.' },
        { status: 404 }
      )
    }

    const balance = Number(existing.rows[0].balance)
    if (balance !== 0) {
      return Response.json(
        {
          ok: false,
          message: 'Cannot delete an account with a non-zero balance.'
        },
        { status: 400 }
      )
    }

    await query(`DELETE FROM accounts WHERE user_id = $1 AND id = $2`, [
      session.userId,
      id
    ])

    return Response.json({ ok: true })
  } catch (reason) {
    if (reason instanceof HttpError) return reason.toResponse()
    return serviceFailure(reason)
  }
}

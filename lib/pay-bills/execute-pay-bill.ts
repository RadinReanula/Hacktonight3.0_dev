import type { PoolClient } from 'pg'
import type { TransactionRow } from '@/lib/transfers/execute-transfer'
import { PayBillError } from './errors'
import type { PayBillInput } from './schemas'

type BillerRow = {
  id: number
  slug: string
  name: string
}

export type ExecutePayBillParams = PayBillInput & {
  userId: number
}

export async function executePayBill(
  client: PoolClient,
  params: ExecutePayBillParams
): Promise<TransactionRow> {
  const { fromAccount, billerId, reference, amount, userId } = params

  const from = await client.query<{ balance: string }>(
    'SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE',
    [fromAccount, userId]
  )

  if (!from.rows[0]) {
    throw new PayBillError(
      'FORBIDDEN',
      'You do not have access to this account.'
    )
  }

  if (Number(from.rows[0].balance) < amount) {
    throw new PayBillError(
      'INSUFFICIENT_FUNDS',
      'Insufficient funds for this payment.'
    )
  }

  const billerResult = await client.query<BillerRow>(
    'SELECT id, slug, name FROM billers WHERE id = $1',
    [billerId]
  )

  const biller = billerResult.rows[0]
  if (!biller) {
    throw new PayBillError('INVALID_BILLER', 'Selected biller was not found.')
  }

  await client.query(
    'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
    [amount, fromAccount]
  )

  const toAccount = `SETTLE:${biller.slug}`
  const description = `Pay ${biller.name} — ref ${reference}`

  const tx = await client.query<TransactionRow>(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by, status)
     VALUES ($1, $2, $3, $4, $5, 'SUCCESS')
     RETURNING id, from_account, to_account, amount, description, status, created_by, created_at`,
    [fromAccount, toAccount, amount, description, userId]
  )

  await client.query(
    `INSERT INTO audit_logs (event, payload) VALUES ('pay_bill', $1::jsonb)`,
    [
      JSON.stringify({
        userId,
        fromAccount,
        billerId,
        reference,
        amount
      })
    ]
  )

  const row = tx.rows[0]
  if (!row) {
    throw new Error('Transaction insert failed.')
  }

  return row
}

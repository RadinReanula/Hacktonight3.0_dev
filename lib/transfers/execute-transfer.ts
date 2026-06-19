import type { PoolClient } from 'pg'
import { TransferError } from './errors'
import type { TransferInput } from './schemas'

export type TransactionRow = {
  id: number
  from_account: string
  to_account: string
  amount: string
  description: string | null
  status: string
  created_by: number | null
  created_at: Date
}

export type ExecuteTransferParams = TransferInput & {
  userId: number
}

export async function executeTransfer(
  client: PoolClient,
  params: ExecuteTransferParams
): Promise<TransactionRow> {
  const { fromAccount, toAccount, amount, description, userId } = params

  const from = await client.query<{ balance: string }>(
    'SELECT balance FROM accounts WHERE account_number = $1 AND user_id = $2 FOR UPDATE',
    [fromAccount, userId]
  )

  if (!from.rows[0]) {
    throw new TransferError(
      'FORBIDDEN',
      'You do not have access to this account.'
    )
  }

  if (Number(from.rows[0].balance) < amount) {
    throw new TransferError(
      'INSUFFICIENT_FUNDS',
      'Insufficient funds for this transfer.'
    )
  }

  const destination = await client.query(
    'SELECT 1 FROM accounts WHERE account_number = $1',
    [toAccount]
  )

  if (!destination.rows[0]) {
    throw new TransferError(
      'INVALID_DESTINATION',
      'Destination account was not found.'
    )
  }

  await client.query(
    'UPDATE accounts SET balance = balance - $1 WHERE account_number = $2',
    [amount, fromAccount]
  )

  await client.query(
    'UPDATE accounts SET balance = balance + $1 WHERE account_number = $2',
    [amount, toAccount]
  )

  const tx = await client.query<TransactionRow>(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by, status)
     VALUES ($1, $2, $3, $4, $5, 'SUCCESS')
     RETURNING id, from_account, to_account, amount, description, status, created_by, created_at`,
    [fromAccount, toAccount, amount, description ?? null, userId]
  )

  await client.query(
    `INSERT INTO audit_logs (event, payload) VALUES ('transfer', $1::jsonb)`,
    [
      JSON.stringify({
        userId,
        fromAccount,
        toAccount,
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

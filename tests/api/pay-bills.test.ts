import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { verifyPin } from '@/lib/auth'
import { ensureDatabase, getClient, query } from '@/lib/db'
import type { PayBillError } from '@/lib/pay-bills/errors'
import { executePayBill } from '@/lib/pay-bills/execute-pay-bill'

async function getBalance(accountNumber: string) {
  const result = await query<{ balance: string }>(
    'SELECT balance FROM accounts WHERE account_number = $1',
    [accountNumber]
  )
  return Number(result.rows[0]?.balance ?? 0)
}

describe('executePayBill', () => {
  beforeAll(async () => {
    await ensureDatabase()
  })

  afterEach(async () => {
    await query(
      `UPDATE accounts SET balance = CASE account_number
        WHEN '1000003423' THEN 100000.00
        WHEN '1000004876' THEN 42000.00
        WHEN '2000006754' THEN 9870.00
        ELSE balance
      END
      WHERE account_number IN ('1000003423', '1000004876', '2000006754')`
    )
  })

  it('rejects insufficient funds', async () => {
    const fromAccount = '1000003423'
    const before = await getBalance(fromAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await expect(
        executePayBill(client, {
          fromAccount,
          billerId: 1,
          reference: 'BILL-12345',
          amount: before + 500,
          pin: '1234',
          userId: 1
        })
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_FUNDS'
      } satisfies Partial<PayBillError>)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(fromAccount)).toBe(before)
  })

  it('rejects a foreign source account', async () => {
    const kasunAccount = '2000006754'
    const before = await getBalance(kasunAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await expect(
        executePayBill(client, {
          fromAccount: kasunAccount,
          billerId: 1,
          reference: 'BILL-99999',
          amount: 100,
          pin: '4321',
          userId: 1
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN'
      } satisfies Partial<PayBillError>)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(kasunAccount)).toBe(before)
  })

  it('rolls back when the transaction is not committed', async () => {
    const fromAccount = '1000003423'
    const amount = 500
    const before = await getBalance(fromAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await executePayBill(client, {
        fromAccount,
        billerId: 1,
        reference: 'ROLLBACK-TEST',
        amount,
        pin: '1234',
        userId: 1
      })
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(fromAccount)).toBe(before)
  })
})

describe('pay bill PIN verification', () => {
  beforeAll(async () => {
    await ensureDatabase()
  })

  it('rejects a bad PIN', async () => {
    expect(await verifyPin('1000003423', '1234')).toBe(true)
    expect(await verifyPin('1000003423', '9999')).toBe(false)
  })
})

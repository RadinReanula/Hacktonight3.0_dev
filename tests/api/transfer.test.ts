import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { verifyPin } from '@/lib/auth'
import { ensureDatabase, getClient, query } from '@/lib/db'
import type { TransferError } from '@/lib/transfers/errors'
import { executeTransfer } from '@/lib/transfers/execute-transfer'

async function getBalance(accountNumber: string) {
  const result = await query<{ balance: string }>(
    'SELECT balance FROM accounts WHERE account_number = $1',
    [accountNumber]
  )
  return Number(result.rows[0]?.balance ?? 0)
}

describe('executeTransfer', () => {
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

  it('rejects insufficient funds without changing balances', async () => {
    const fromAccount = '1000003423'
    const toAccount = '2000006754'
    const beforeFrom = await getBalance(fromAccount)
    const beforeTo = await getBalance(toAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await expect(
        executeTransfer(client, {
          fromAccount,
          toAccount,
          amount: beforeFrom + 10_000,
          pin: '1234',
          userId: 1
        })
      ).rejects.toMatchObject({
        code: 'INSUFFICIENT_FUNDS'
      } satisfies Partial<TransferError>)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(fromAccount)).toBe(beforeFrom)
    expect(await getBalance(toAccount)).toBe(beforeTo)
  })

  it('rejects a foreign source account', async () => {
    const kasunAccount = '2000006754'
    const before = await getBalance(kasunAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await expect(
        executeTransfer(client, {
          fromAccount: kasunAccount,
          toAccount: '1000003423',
          amount: 100,
          pin: '4321',
          userId: 1
        })
      ).rejects.toMatchObject({
        code: 'FORBIDDEN'
      } satisfies Partial<TransferError>)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(kasunAccount)).toBe(before)
  })

  it('rolls back when the transaction is not committed', async () => {
    const fromAccount = '1000003423'
    const toAccount = '1000004876'
    const amount = 250
    const beforeFrom = await getBalance(fromAccount)
    const beforeTo = await getBalance(toAccount)

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await executeTransfer(client, {
        fromAccount,
        toAccount,
        amount,
        pin: '1234',
        userId: 1
      })
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(fromAccount)).toBe(beforeFrom)
    expect(await getBalance(toAccount)).toBe(beforeTo)
  })

  it('rejects an invalid destination account', async () => {
    const fromAccount = '1000003423'
    const beforeFrom = await getBalance(fromAccount)
    const beforeTo = await getBalance('2000006754')

    const client = await getClient()
    try {
      await client.query('BEGIN')
      await expect(
        executeTransfer(client, {
          fromAccount,
          toAccount: '0000000000',
          amount: 100,
          pin: '1234',
          userId: 1
        })
      ).rejects.toMatchObject({
        code: 'INVALID_DESTINATION'
      } satisfies Partial<TransferError>)
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }

    expect(await getBalance(fromAccount)).toBe(beforeFrom)
    expect(await getBalance('2000006754')).toBe(beforeTo)
  })
})

describe('verifyPin', () => {
  beforeAll(async () => {
    await ensureDatabase()
  })

  it('rejects a bad PIN', async () => {
    const valid = await verifyPin('1000003423', '1234')
    const invalid = await verifyPin('1000003423', '0000')
    expect(valid).toBe(true)
    expect(invalid).toBe(false)
  })
})

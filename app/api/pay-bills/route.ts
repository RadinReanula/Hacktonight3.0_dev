import { HttpError, requireSession, verifyPin } from '@/lib/auth'
import { getClient, serviceFailure } from '@/lib/db'
import { PayBillError, payBillErrorResponse } from '@/lib/pay-bills/errors'
import { executePayBill } from '@/lib/pay-bills/execute-pay-bill'
import { payBillSchema } from '@/lib/pay-bills/schemas'

export async function POST(request: Request) {
  const client = await getClient()

  try {
    const session = await requireSession()
    const body = await request.json().catch(() => ({}))
    const parsed = payBillSchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(
        { ok: false, message: 'Invalid payment details.' },
        { status: 400 }
      )
    }

    const { fromAccount, billerId, reference, amount, pin } = parsed.data

    const pinValid = await verifyPin(fromAccount, pin)
    if (!pinValid) {
      return Response.json(
        { ok: false, message: 'Invalid PIN.' },
        { status: 400 }
      )
    }

    await client.query('BEGIN')

    const transaction = await executePayBill(client, {
      fromAccount,
      billerId,
      reference,
      amount,
      pin,
      userId: session.userId
    })

    await client.query('COMMIT')

    return Response.json({
      ok: true,
      transaction: {
        id: transaction.id,
        fromAccount: transaction.from_account,
        toAccount: transaction.to_account,
        amount: Number(transaction.amount),
        description: transaction.description,
        status: transaction.status,
        createdAt: transaction.created_at
      }
    })
  } catch (reason) {
    await client.query('ROLLBACK').catch(() => {})

    if (reason instanceof HttpError) return reason.toResponse()
    if (reason instanceof PayBillError) return payBillErrorResponse(reason)
    return serviceFailure(reason)
  } finally {
    client.release()
  }
}

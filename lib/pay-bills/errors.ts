export type PayBillErrorCode =
  | 'FORBIDDEN'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_BILLER'
  | 'BAD_PIN'

export class PayBillError extends Error {
  code: PayBillErrorCode

  constructor(code: PayBillErrorCode, message: string) {
    super(message)
    this.name = 'PayBillError'
    this.code = code
  }
}

export function payBillErrorResponse(error: PayBillError) {
  const status = error.code === 'FORBIDDEN' ? 403 : 400
  return Response.json({ ok: false, message: error.message }, { status })
}

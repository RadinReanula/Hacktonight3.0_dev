export type TransferErrorCode =
  | 'FORBIDDEN'
  | 'INSUFFICIENT_FUNDS'
  | 'INVALID_DESTINATION'
  | 'BAD_PIN'

export class TransferError extends Error {
  code: TransferErrorCode

  constructor(code: TransferErrorCode, message: string) {
    super(message)
    this.name = 'TransferError'
    this.code = code
  }
}

export function transferErrorResponse(error: TransferError) {
  const status =
    error.code === 'FORBIDDEN'
      ? 403
      : error.code === 'INSUFFICIENT_FUNDS' ||
          error.code === 'INVALID_DESTINATION' ||
          error.code === 'BAD_PIN'
        ? 400
        : 400

  return Response.json({ ok: false, message: error.message }, { status })
}

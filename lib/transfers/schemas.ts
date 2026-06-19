import { z } from 'zod'

const accountNumber = z
  .string()
  .trim()
  .regex(/^\d{6,16}$/, 'Enter a valid account number.')

const pinSchema = z
  .string()
  .trim()
  .regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')

const amountSchema = z
  .number({ error: 'Enter a valid amount.' })
  .positive('Amount must be greater than zero.')
  .refine(
    (value) => Math.round(value * 100) === value * 100,
    'Amount can have at most 2 decimal places.'
  )

export const transferSchema = z
  .object({
    fromAccount: accountNumber,
    toAccount: accountNumber,
    amount: amountSchema,
    description: z.string().trim().max(140).optional(),
    pin: pinSchema
  })
  .refine((data) => data.fromAccount !== data.toAccount, {
    message: 'Source and destination accounts must differ.',
    path: ['toAccount']
  })

export type TransferInput = z.infer<typeof transferSchema>

/** Form schema without PIN (collected on confirm step). */
export const transferFormSchema = z
  .object({
    fromAccount: accountNumber,
    toAccount: accountNumber,
    amount: amountSchema,
    description: z.string().trim().max(140).optional()
  })
  .refine((data) => data.fromAccount !== data.toAccount, {
    message: 'Source and destination accounts must differ.',
    path: ['toAccount']
  })

export type TransferFormInput = z.infer<typeof transferFormSchema>

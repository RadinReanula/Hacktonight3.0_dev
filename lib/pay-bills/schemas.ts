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

export const payBillSchema = z.object({
  fromAccount: accountNumber,
  billerId: z.number().int().positive(),
  reference: z.string().trim().min(3).max(40),
  amount: amountSchema,
  pin: pinSchema
})

export type PayBillInput = z.infer<typeof payBillSchema>

export const payBillFormSchema = z.object({
  fromAccount: accountNumber,
  billerId: z.number().int().positive(),
  reference: z.string().trim().min(3).max(40),
  amount: amountSchema
})

export type PayBillFormInput = z.infer<typeof payBillFormSchema>

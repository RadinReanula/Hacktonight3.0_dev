import { z } from 'zod'

export const createAccountSchema = z.object({
  account_number: z
    .string()
    .regex(/^\d{8,16}$/, 'Account number must be 8–16 digits'),
  account_name: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(60, 'Account name must be at most 60 characters'),
  pin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
    .optional()
})

export const patchAccountSchema = z.object({
  id: z.number().int().positive(),
  account_name: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(60, 'Account name must be at most 60 characters')
})

export const deleteAccountSchema = z.object({
  id: z.number().int().positive()
})

export const createAccountFormSchema = z.object({
  accountNumber: z
    .string()
    .regex(/^\d{8,16}$/, 'Account number must be 8–16 digits'),
  accountName: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(60, 'Account name must be at most 60 characters'),
  pin: z
    .string()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits')
    .optional()
    .or(z.literal(''))
})

export const editAccountFormSchema = z.object({
  accountName: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(60, 'Account name must be at most 60 characters')
})

export type CreateAccountInput = z.infer<typeof createAccountSchema>
export type PatchAccountInput = z.infer<typeof patchAccountSchema>
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>
export type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>
export type EditAccountFormValues = z.infer<typeof editAccountFormSchema>

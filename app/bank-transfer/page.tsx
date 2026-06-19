'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { AppShell } from '@/components/shell/app-shell'
import { PageHeader } from '@/components/shell/page-header'
import { StatusScreen } from '@/components/shell/status-screen'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { fetchAccounts } from '@/lib/api/accounts'
import { postTransfer } from '@/lib/api/transfer'
import { transferFormSchema } from '@/lib/transfers/schemas'

const pinSchema = z.object({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')
})

type TransferFormValues = z.infer<typeof transferFormSchema>
type PinValues = z.infer<typeof pinSchema>

type Step = 'form' | 'confirm' | 'result'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(value)
}

export default function BankTransferPage() {
  const [step, setStep] = useState<Step>('form')
  const [pendingTransfer, setPendingTransfer] =
    useState<TransferFormValues | null>(null)
  const [result, setResult] = useState<{
    variant: 'success' | 'error'
    title: string
    description?: string
    transactionId?: number
  } | null>(null)

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  })

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: {
      fromAccount: '',
      toAccount: '',
      amount: undefined,
      description: ''
    }
  })

  const pinForm = useForm<PinValues>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: '' }
  })

  const transferMutation = useMutation({
    mutationFn: postTransfer,
    onSuccess: (data) => {
      setResult({
        variant: 'success',
        title: 'Transfer successful',
        description: `Your transfer of ${formatCurrency(data.transaction.amount)} was completed.`,
        transactionId: data.transaction.id
      })
      setStep('result')
    },
    onError: (error) => {
      setResult({
        variant: 'error',
        title: 'Transfer failed',
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.'
      })
      setStep('result')
    }
  })

  function onFormSubmit(values: TransferFormValues) {
    setPendingTransfer(values)
    pinForm.reset({ pin: '' })
    setStep('confirm')
  }

  function onConfirmSubmit(values: PinValues) {
    if (!pendingTransfer) return
    transferMutation.mutate({
      ...pendingTransfer,
      pin: values.pin
    })
  }

  function resetWizard() {
    form.reset()
    pinForm.reset()
    setPendingTransfer(null)
    setResult(null)
    setStep('form')
  }

  if (step === 'result' && result) {
    return (
      <AppShell>
        <PageHeader title="Bank Transfer" />
        <Card className="mx-auto max-w-lg">
          <CardContent className="pt-6">
            <StatusScreen
              variant={result.variant}
              title={result.title}
              description={
                result.transactionId
                  ? `${result.description} Confirmation #${result.transactionId}.`
                  : result.description
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={resetWizard}>
                  Make another transfer
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              </div>
            </StatusScreen>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  if (step === 'confirm' && pendingTransfer) {
    const fromAccount = accountsQuery.data?.find(
      (a) => a.accountNumber === pendingTransfer.fromAccount
    )

    return (
      <AppShell>
        <PageHeader title="Bank Transfer" description="Confirm your transfer" />
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <CardTitle>Review transfer</CardTitle>
            <CardDescription>
              Enter your PIN to authorize this transfer.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">From</dt>
                <dd className="font-medium">
                  {fromAccount?.accountName ?? pendingTransfer.fromAccount}
                </dd>
                <dd className="text-muted-foreground text-xs">
                  {pendingTransfer.fromAccount}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">To</dt>
                <dd className="font-medium">{pendingTransfer.toAccount}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">
                  {formatCurrency(pendingTransfer.amount)}
                </dd>
              </div>
              {pendingTransfer.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Description</dt>
                  <dd className="font-medium">{pendingTransfer.description}</dd>
                </div>
              ) : null}
            </dl>

            <form
              className="flex flex-col gap-4"
              onSubmit={pinForm.handleSubmit(onConfirmSubmit)}
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="pin">4-digit PIN</FieldLabel>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  aria-invalid={Boolean(pinForm.formState.errors.pin)}
                  {...pinForm.register('pin')}
                />
                <FieldError>{pinForm.formState.errors.pin?.message}</FieldError>
              </Field>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('form')}
                  disabled={transferMutation.isPending}
                >
                  <ArrowLeft className="size-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={transferMutation.isPending}
                >
                  {transferMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm transfer'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <PageHeader
        title="Bank Transfer"
        description="Send money to another Nova Bank account"
      />
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Transfer details</CardTitle>
          <CardDescription>
            Choose your account and enter the recipient details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accountsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading accounts...
            </div>
          ) : accountsQuery.isError ? (
            <StatusScreen
              variant="error"
              title="Could not load accounts"
              description={
                accountsQuery.error instanceof Error
                  ? accountsQuery.error.message
                  : 'Please try again.'
              }
            >
              <Button onClick={() => accountsQuery.refetch()}>Retry</Button>
            </StatusScreen>
          ) : (
            <form
              className="flex flex-col gap-4"
              onSubmit={form.handleSubmit(onFormSubmit)}
              noValidate
            >
              <Field>
                <FieldLabel htmlFor="fromAccount">From account</FieldLabel>
                <Controller
                  control={form.control}
                  name="fromAccount"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="fromAccount"
                        aria-invalid={Boolean(
                          form.formState.errors.fromAccount
                        )}
                      >
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accountsQuery.data?.map((account) => (
                          <SelectItem
                            key={account.id}
                            value={account.accountNumber}
                          >
                            {account.accountName} ({account.accountNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>
                  {form.formState.errors.fromAccount?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="toAccount">To account number</FieldLabel>
                <Input
                  id="toAccount"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-invalid={Boolean(form.formState.errors.toAccount)}
                  {...form.register('toAccount')}
                />
                <FieldError>
                  {form.formState.errors.toAccount?.message}
                </FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="amount">Amount (LKR)</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  inputMode="decimal"
                  aria-invalid={Boolean(form.formState.errors.amount)}
                  {...form.register('amount', { valueAsNumber: true })}
                />
                <FieldError>{form.formState.errors.amount?.message}</FieldError>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">
                  Description (optional)
                </FieldLabel>
                <Input
                  id="description"
                  maxLength={140}
                  aria-invalid={Boolean(form.formState.errors.description)}
                  {...form.register('description')}
                />
                <FieldError>
                  {form.formState.errors.description?.message}
                </FieldError>
              </Field>

              <Button type="submit" className="mt-2">
                Continue
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AppShell>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Droplets,
  Landmark,
  Loader2,
  type LucideIcon,
  Shield,
  Smartphone,
  Tv,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { fetchAccounts } from '@/lib/api/accounts'
import { type Biller, fetchBillers } from '@/lib/api/billers'
import { postPayBill } from '@/lib/api/pay-bills'
import { payBillFormSchema } from '@/lib/pay-bills/schemas'

const payBillWithPinSchema = payBillFormSchema.extend({
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits.')
})

type PayBillFormValues = z.infer<typeof payBillWithPinSchema>

type PaymentResult = {
  variant: 'success' | 'error'
  title: string
  description?: string
  transactionId?: number
}

const categoryIcons: Record<string, LucideIcon> = {
  Electricity: Zap,
  Water: Droplets,
  Mobile: Smartphone,
  Entertainment: Tv,
  Insurance: Shield,
  Finance: Landmark
}

function BillerIcon({ category }: { category: string }) {
  const Icon = categoryIcons[category] ?? Landmark
  return (
    <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
      <Icon className="size-6" aria-hidden />
    </span>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2
  }).format(value)
}

function PayBillsLoading() {
  return (
    <AppShell>
      <PageHeader title="Pay Bills" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
    </AppShell>
  )
}

function PayBillsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const billerSlug = searchParams.get('biller')
  const status = searchParams.get('status')

  const [selectedBiller, setSelectedBiller] = useState<Biller | null>(null)
  const [result, setResult] = useState<PaymentResult | null>(null)

  const billersQuery = useQuery({
    queryKey: ['billers'],
    queryFn: async () => {
      const data = await fetchBillers()
      return data.billers
    }
  })

  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts
  })

  const form = useForm<PayBillFormValues>({
    resolver: zodResolver(payBillWithPinSchema),
    defaultValues: {
      fromAccount: '',
      billerId: 0,
      reference: '',
      amount: undefined,
      pin: ''
    }
  })

  const payMutation = useMutation({
    mutationFn: postPayBill,
    onSuccess: (data) => {
      setResult({
        variant: 'success',
        title: 'Payment successful',
        description: `Your payment of ${formatCurrency(data.transaction.amount)} was completed.`,
        transactionId: data.transaction.id
      })
      router.replace('/pay-bills?status=success')
    },
    onError: (error) => {
      setResult({
        variant: 'error',
        title: 'Payment failed',
        description:
          error instanceof Error
            ? error.message
            : 'Something went wrong. Please try again.'
      })
      router.replace('/pay-bills?status=error')
    }
  })

  const { reset, getValues } = form

  useEffect(() => {
    if ((status === 'success' || status === 'error') && !result) {
      router.replace('/pay-bills')
    }
  }, [status, result, router])

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      return
    }

    if (!billerSlug) {
      setSelectedBiller(null)
      return
    }

    if (!billersQuery.data) {
      return
    }

    const biller = billersQuery.data.find((item) => item.slug === billerSlug)
    if (!biller) {
      router.replace('/pay-bills')
      return
    }

    setSelectedBiller(biller)
    reset({
      fromAccount: getValues('fromAccount') || '',
      billerId: biller.id,
      reference: '',
      amount: undefined,
      pin: ''
    })
  }, [billerSlug, billersQuery.data, getValues, reset, router, status])

  function handleSelectBiller(biller: Biller) {
    router.push(`/pay-bills?biller=${encodeURIComponent(biller.slug)}`)
  }

  function handleBackToBillers() {
    router.back()
  }

  function onSubmit(values: PayBillFormValues) {
    payMutation.mutate(values)
  }

  function resetWizard() {
    form.reset()
    setSelectedBiller(null)
    setResult(null)
    router.push('/pay-bills')
  }

  const showResult =
    (status === 'success' || status === 'error') && result !== null
  const showForm = !showResult && billerSlug !== null && selectedBiller !== null
  const showSelect = !showResult && !showForm

  if (showResult && result) {
    return (
      <AppShell>
        <PageHeader title="Pay Bills" />
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
                  Pay another bill
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

  if (showForm && selectedBiller) {
    return (
      <AppShell>
        <PageHeader
          title="Pay Bills"
          description={`Pay ${selectedBiller.name}`}
        />
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BillerIcon category={selectedBiller.category} />
              <div>
                <CardTitle>{selectedBiller.name}</CardTitle>
                <CardDescription>{selectedBiller.category}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {accountsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading accounts...
              </div>
            ) : (
              <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
                noValidate
              >
                <input
                  type="hidden"
                  {...form.register('billerId', { valueAsNumber: true })}
                />

                <Field>
                  <FieldLabel htmlFor="fromAccount">From account</FieldLabel>
                  <Controller
                    control={form.control}
                    name="fromAccount"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="fromAccount">
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
                  <FieldLabel htmlFor="reference">
                    Bill / account reference
                  </FieldLabel>
                  <Input
                    id="reference"
                    autoComplete="off"
                    aria-invalid={Boolean(form.formState.errors.reference)}
                    {...form.register('reference')}
                  />
                  <FieldError>
                    {form.formState.errors.reference?.message}
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
                  <FieldError>
                    {form.formState.errors.amount?.message}
                  </FieldError>
                </Field>

                <Field>
                  <FieldLabel htmlFor="pin">4-digit PIN</FieldLabel>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    aria-invalid={Boolean(form.formState.errors.pin)}
                    {...form.register('pin')}
                  />
                  <FieldError>{form.formState.errors.pin?.message}</FieldError>
                </Field>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBackToBillers}
                    disabled={payMutation.isPending}
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={payMutation.isPending}
                  >
                    {payMutation.isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Pay bill'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </AppShell>
    )
  }

  if (!showSelect) {
    return <PayBillsLoading />
  }

  return (
    <AppShell>
      <PageHeader
        title="Pay Bills"
        description="Select a biller to pay your bill"
      />
      {billersQuery.isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          <Loader2 className="mr-2 size-4 animate-spin" />
          Loading billers...
        </div>
      ) : billersQuery.isError ? (
        <Card className="mx-auto max-w-lg">
          <CardContent className="pt-6">
            <StatusScreen
              variant="error"
              title="Could not load billers"
              description={
                billersQuery.error instanceof Error
                  ? billersQuery.error.message
                  : 'Please try again.'
              }
            >
              <Button onClick={() => billersQuery.refetch()}>Retry</Button>
            </StatusScreen>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {billersQuery.data?.map((biller) => (
            <Card
              key={biller.id}
              className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <button
                type="button"
                className="flex h-full w-full flex-col items-center gap-3 p-6 text-center"
                onClick={() => handleSelectBiller(biller)}
              >
                <BillerIcon category={biller.category} />
                <div>
                  <p className="font-medium">{biller.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {biller.category}
                  </p>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}

export default function PayBillsPage() {
  return (
    <Suspense fallback={<PayBillsLoading />}>
      <PayBillsContent />
    </Suspense>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, FileText, Loader2, Receipt } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { AppShell } from '@/components/shell/app-shell'
import { PageHeader } from '@/components/shell/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { fetchOverview } from '@/lib/api/overview'
import { formatCurrency, formatDate, maskAccountNumber } from '@/lib/format'

const quickActions = [
  { label: 'Transfer', href: '/bank-transfer', icon: ArrowLeftRight },
  { label: 'Pay Bills', href: '/pay-bills', icon: Receipt },
  { label: 'Statements', href: '/e-statement', icon: FileText }
]

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const [verifiedBanner, setVerifiedBanner] = useState(
    searchParams.get('verified') === '1'
  )

  useEffect(() => {
    if (!verifiedBanner) return
    const url = new URL(window.location.href)
    url.searchParams.delete('verified')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [verifiedBanner])

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['overview'],
    queryFn: fetchOverview
  })

  const firstName = data?.fullName.split(' ')[0] ?? ''

  return (
    <AppShell userName={data?.fullName}>
      <PageHeader title="Dashboard" />

      {verifiedBanner ? (
        <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-center text-primary text-sm">
          Email verified successfully. Welcome to Nova Bank!
        </p>
      ) : null}

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-destructive text-sm">
              {error instanceof Error
                ? error.message
                : 'Failed to load dashboard.'}
            </p>
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Retrying...
                </>
              ) : (
                'Try again'
              )}
            </Button>
          </CardContent>
        </Card>
      ) : data ? (
        <div className="flex flex-col gap-6">
          <Card className="relative overflow-hidden">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <p className="text-muted-foreground text-sm">
                  Welcome back, {firstName}!
                </p>
                <p className="text-muted-foreground text-sm">Total balance</p>
                <p className="font-bold text-3xl tracking-tight">
                  {formatCurrency(data.totalBalance)}
                </p>
              </div>
              <Image
                src="/dashboard-logo.png"
                alt=""
                width={160}
                height={160}
                className="hidden object-contain sm:block"
              />
            </CardContent>
          </Card>

          {data.accounts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {account.accountName}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {maskAccountNumber(account.accountNumber)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold text-xl">
                      {formatCurrency(account.balance)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {quickActions.map((action) => (
                <Button key={action.href} asChild variant="outline">
                  <Link href={action.href}>
                    <action.icon className="size-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No recent transactions.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>
                          {maskAccountNumber(tx.counterparty)}
                        </TableCell>
                        <TableCell>{tx.description ?? '—'}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.direction === 'in' ? 'success' : 'destructive'
                            }
                          >
                            {tx.direction === 'in' ? 'In' : 'Out'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {tx.direction === 'out' ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Calendar,
  Download,
  FileText,
  Printer
} from 'lucide-react'
import { useEffect, useState } from 'react'
import AppShell from '@/components/shell/app-shell'
import PageHeader from '@/components/shell/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  getAccountsRequest,
  getMeRequest,
  getStatementsRequest
} from '@/lib/api/banking'

export default function EStatementPage() {
  const now = new Date()
  const firstDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const todayStr = now.toISOString().split('T')[0]

  const [from, setFrom] = useState(firstDayStr)
  const [to, setTo] = useState(todayStr)
  const [selectedAccount, setSelectedAccount] = useState('')

  // 1. Fetch current user
  const {
    data: userData,
    isLoading: isUserLoading,
    error: userError
  } = useQuery({
    queryKey: ['me'],
    queryFn: getMeRequest
  })

  const userId = userData?.user?.id

  // 2. Fetch accounts for this user
  const {
    data: accountsData,
    isLoading: isAccountsLoading,
    error: accountsError
  } = useQuery({
    queryKey: ['accounts', userId],
    queryFn: () => getAccountsRequest(userId as number),
    enabled: !!userId
  })

  const accounts = accountsData?.accounts || []

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0].accountNumber)
    }
  }, [accounts, selectedAccount])

  // 3. Fetch statement details
  const {
    data: statementData,
    isLoading: isStatementLoading,
    error: statementError
  } = useQuery({
    queryKey: ['statements', selectedAccount, from, to],
    queryFn: () => getStatementsRequest(selectedAccount, from, to),
    enabled: !!selectedAccount && !!from && !!to
  })

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    })
      .format(amount)
      .replace('LKR', 'Rs.')
  }

  // CSV export handler
  const handleDownloadCSV = () => {
    if (
      !statementData?.transactions ||
      statementData.transactions.length === 0
    ) {
      return
    }

    const headers = [
      'Date',
      'Description',
      'Reference ID',
      'Type',
      'Amount (Rs.)',
      'Balance (Rs.)'
    ]
    const rows = statementData.transactions.map((t) => [
      new Date(t.created_at).toLocaleString(),
      t.description || '',
      t.id,
      t.type === 'credit' ? 'Credit' : 'Debit',
      t.amount.toFixed(2),
      t.runningBalance?.toFixed(2) || '0.00'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `statement_${selectedAccount}_${from}_to_${to}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print PDF handler
  const handlePrintPDF = () => {
    window.print()
  }

  const isLoading = isUserLoading || isAccountsLoading
  const hasError = !!userError || !!accountsError || !!statementError

  return (
    <AppShell userName={userData?.user?.username}>
      <style>
        {`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 20px !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}
      </style>

      <div className="space-y-6">
        <PageHeader
          title="E-Statement"
          description="View and download secure official account statements"
          actions={
            statementData &&
            statementData.transactions.length > 0 && (
              <div className="flex gap-2 no-print">
                <Button
                  variant="outline"
                  onClick={handleDownloadCSV}
                  className="gap-2 cursor-pointer transition-all duration-200 active:scale-95"
                >
                  <Download className="size-4" /> Download CSV
                </Button>
                <Button
                  onClick={handlePrintPDF}
                  className="gap-2 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 active:scale-95"
                >
                  <Printer className="size-4" /> Print / PDF
                </Button>
              </div>
            )
          }
        />

        {/* Filters Card */}
        <Card className="no-print border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300">
          <CardContent className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="account-select">Select Account</FieldLabel>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger
                      id="account-select"
                      className="w-full bg-background border-border/80 focus:ring-ring"
                    >
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem
                          key={acc.accountNumber}
                          value={acc.accountNumber}
                        >
                          {acc.accountName} ({acc.accountNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="from-date">From Date</FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    id="from-date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="pl-10 bg-background border-border/80"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="to-date">To Date</FieldLabel>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    id="to-date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="pl-10 bg-background border-border/80"
                  />
                </div>
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {hasError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive space-y-3">
            <AlertCircle className="mx-auto size-10" />
            <h3 className="font-semibold text-lg">Failed to load statement</h3>
            <p className="text-sm text-muted-foreground">
              There was an error communicating with the banking service. Please
              check your inputs and try again.
            </p>
          </div>
        )}

        {/* Loading State */}
        {!hasError && (isLoading || isStatementLoading) && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border/30">
                  <CardContent className="p-6 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="border-border/30">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Area */}
        {!hasError && !isLoading && !isStatementLoading && statementData && (
          <div className="space-y-6 print-container">
            {/* Account Info Header */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b pb-6">
              <div className="flex items-center gap-4">
                <div className="size-16 relative flex items-center justify-center bg-primary/10 rounded-full text-primary border border-primary/20 shadow-inner">
                  <FileText className="size-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Nova Bank Redesign
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Official E-Statement
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right text-sm space-y-1">
                <div>
                  <strong>Account Name:</strong> {statementData.account.name}
                </div>
                <div>
                  <strong>Account Number:</strong>{' '}
                  {statementData.account.number}
                </div>
                <div>
                  <strong>Statement Period:</strong>{' '}
                  {new Date(from).toLocaleDateString()} -{' '}
                  {new Date(to).toLocaleDateString()}
                </div>
                <div>
                  <strong>Branch:</strong> Head Office, Colombo
                </div>
              </div>
            </div>

            {/* Account Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Opening Balance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatCurrency(statementData.summary.openingBalance)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Credits (+)
                  </p>
                  <p className="mt-2 text-2xl font-bold text-success">
                    {formatCurrency(statementData.summary.totalCredits)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Debits (-)
                  </p>
                  <p className="mt-2 text-2xl font-bold text-destructive">
                    {formatCurrency(statementData.summary.totalDebits)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/25 border-primary/30 shadow-sm transition-all duration-300 hover:shadow-md">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Closing Balance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-foreground">
                    {formatCurrency(statementData.summary.closingBalance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Transactions Details Table */}
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="border-b p-6 bg-muted/20">
                  <h3 className="font-bold text-base text-foreground">
                    Transaction Details
                  </h3>
                </div>
                {statementData.transactions.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-2">
                    <AlertCircle className="mx-auto size-8 text-muted-foreground/60" />
                    <p className="font-medium text-base">
                      No transactions found
                    </p>
                    <p className="text-sm">
                      There are no transactions recorded for the chosen period.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/10">
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Reference ID</TableHead>
                        <TableHead className="text-right">Debit (-)</TableHead>
                        <TableHead className="text-right">Credit (+)</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statementData.transactions.map((t) => (
                        <TableRow
                          key={t.id}
                          className="transition-all hover:bg-muted/30"
                        >
                          <TableCell className="text-muted-foreground font-mono">
                            {new Date(t.created_at).toLocaleDateString()}{' '}
                            <span className="text-xs text-muted-foreground/60">
                              {new Date(t.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-foreground">
                            {t.description || 'Banking Transaction'}
                          </TableCell>
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {t.id}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-destructive">
                            {t.type === 'debit'
                              ? `-${formatCurrency(t.amount)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-success">
                            {t.type === 'credit'
                              ? `+${formatCurrency(t.amount)}`
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground">
                            {formatCurrency(t.runningBalance || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}

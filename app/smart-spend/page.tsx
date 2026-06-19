'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Info,
  PieChart as PieIcon,
  ShoppingBag,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend as ChartLegend,
  Tooltip as ChartTooltip,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis
} from 'recharts'
import AppShell from '@/components/shell/app-shell'
import PageHeader from '@/components/shell/page-header'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getAnalyticsRequest, getMeRequest } from '@/lib/api/banking'

// Standard budget caps per category for visual comparison
const BUDGETS: Record<string, number> = {
  Utilities: 15000,
  Dining: 25000,
  Transfers: 30000,
  Shopping: 20000,
  Entertainment: 10000,
  General: 15000
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--muted-foreground)'
]

export default function SmartSpendPage() {
  const [period, setPeriod] = useState('this_month')

  // 1. Fetch current user
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMeRequest
  })

  // 2. Fetch spending analytics
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => getAnalyticsRequest(period)
  })

  const isLoading = isUserLoading || isAnalyticsLoading

  // Currency Formatter
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    })
      .format(amount)
      .replace('LKR', 'Rs.')
  }

  // Trend Formatter
  const renderTrend = (
    current: number,
    previous: number,
    type: 'expense' | 'income' | 'net'
  ) => {
    if (previous === 0) {
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="size-3" /> No prior data
        </span>
      )
    }

    const diff = current - previous
    const pct = (diff / Math.abs(previous)) * 100
    const isIncrease = pct > 0
    const formattedPct = `${isIncrease ? '+' : ''}${pct.toFixed(1)}%`

    // Outgoing expenses going up is bad (red), income going up is good (green)
    let isPositiveIndicator = false
    if (type === 'expense') {
      isPositiveIndicator = !isIncrease // Expense increase is bad, decrease is good
    } else {
      isPositiveIndicator = isIncrease // Income/Net increase is good, decrease is bad
    }

    return (
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isPositiveIndicator ? 'text-success' : 'text-destructive'
        }`}
      >
        {isIncrease ? (
          <ArrowUpRight className="size-3" />
        ) : (
          <ArrowDownRight className="size-3" />
        )}
        {formattedPct} vs last period
      </span>
    )
  }

  const totals = analyticsData?.totals
  const categoriesData = analyticsData?.categories || []
  const overTimeData = analyticsData?.overTime || []
  const topPayees = analyticsData?.topPayees || []

  // Map category data for PieChart
  const pieData = categoriesData.map((c) => ({
    name: c.category,
    value: c.total
  }))

  return (
    <AppShell userName={userData?.user?.username}>
      <div className="space-y-6">
        <PageHeader
          title="Smart Spend"
          description="Track your spending habits, analyze cash flow, and manage budgets"
          actions={
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px] bg-background border-border/80 focus:ring-ring cursor-pointer">
                <SelectValue placeholder="Select Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="90_days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          }
        />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/30">
                  <CardContent className="p-6 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-40" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/30">
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card className="border-border/30">
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Error State */}
        {analyticsError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive space-y-3">
            <Info className="mx-auto size-10" />
            <h3 className="font-semibold text-lg">Failed to load analytics</h3>
            <p className="text-sm text-muted-foreground">
              An error occurred while loading your spending metrics. Please try
              again.
            </p>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !analyticsError && totals && (
          <div className="space-y-6">
            {/* KPI Cards Row */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Spent
                    </p>
                    <div className="rounded-lg bg-destructive/10 p-2 text-destructive">
                      <TrendingDown className="size-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {formatCurrency(totals.current.expense)}
                  </p>
                  <div className="mt-2">
                    {renderTrend(
                      totals.current.expense,
                      totals.previous.expense,
                      'expense'
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Income
                    </p>
                    <div className="rounded-lg bg-success/10 p-2 text-success">
                      <TrendingUp className="size-4" />
                    </div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {formatCurrency(totals.current.income)}
                  </p>
                  <div className="mt-2">
                    {renderTrend(
                      totals.current.income,
                      totals.previous.income,
                      'income'
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">
                      Net Cash Flow
                    </p>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <DollarSign className="size-4" />
                    </div>
                  </div>
                  <p
                    className={`mt-2 text-3xl font-bold ${totals.current.net >= 0 ? 'text-success' : 'text-destructive'}`}
                  >
                    {formatCurrency(totals.current.net)}
                  </p>
                  <div className="mt-2">
                    {renderTrend(
                      totals.current.net,
                      totals.previous.net,
                      'net'
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Empty State */}
            {categoriesData.length === 0 && (
              <Card className="border-border/40 p-12 text-center text-muted-foreground space-y-4">
                <div className="mx-auto rounded-full bg-muted p-4 size-16 flex items-center justify-center">
                  <Activity className="size-8 text-muted-foreground/60" />
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  No transaction data available
                </h3>
                <p className="max-w-md mx-auto text-sm">
                  We could not find any spending records for the selected
                  period. Start making transfers or bill payments to see
                  metrics.
                </p>
              </Card>
            )}

            {/* Visual Charts Section */}
            {categoriesData.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Spend by Category Card */}
                <Card className="border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieIcon className="size-5 text-primary" /> Spend by
                      Category
                    </CardTitle>
                    <CardDescription>
                      Visual breakdown of expenses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            'Spent'
                          ]}
                          contentStyle={{
                            background: 'var(--card)',
                            borderColor: 'var(--border)',
                            borderRadius: 'var(--radius)'
                          }}
                        />
                        <ChartLegend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Spend over Time Card */}
                <Card className="border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="size-5 text-primary" /> Spend over
                      Time
                    </CardTitle>
                    <CardDescription>
                      Daily spending trend across the selected period
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] pr-4">
                    {overTimeData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Not enough data for daily trend
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overTimeData}>
                          <defs>
                            <linearGradient
                              id="colorSpend"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--primary)"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--primary)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis
                            dataKey="date"
                            stroke="var(--muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(v) => `Rs.${v}`}
                          />
                          <ChartTooltip
                            formatter={(value: number) => [
                              formatCurrency(value),
                              'Spend'
                            ]}
                            contentStyle={{
                              background: 'var(--card)',
                              borderColor: 'var(--border)',
                              borderRadius: 'var(--radius)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSpend)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Top Payees Card */}
                <Card className="border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingBag className="size-5 text-primary" /> Top Payees
                      & Merchants
                    </CardTitle>
                    <CardDescription>
                      Recipients you spend the most on
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {topPayees.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No payees recorded.
                      </p>
                    ) : (
                      topPayees.map((payee) => (
                        <div
                          key={payee.name}
                          className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                        >
                          <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-foreground">
                              {payee.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payee.count} transactions
                            </p>
                          </div>
                          <span className="font-bold text-sm text-foreground">
                            {formatCurrency(payee.total)}
                          </span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                {/* Budget Progress Bars Card */}
                <Card className="border-border/40 bg-card shadow-sm transition-all duration-300 hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="size-5 text-primary" /> Category Budgets
                    </CardTitle>
                    <CardDescription>
                      Current spending relative to target limits
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoriesData.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No category data.
                      </p>
                    ) : (
                      categoriesData.map((c) => {
                        const budget = BUDGETS[c.category] || 20000
                        const pct = Math.min((c.total / budget) * 100, 100)
                        const isOverBudget = c.total > budget

                        return (
                          <div key={c.category} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="font-semibold text-foreground">
                                {c.category}
                              </span>
                              <span className="text-muted-foreground">
                                {formatCurrency(c.total)} /{' '}
                                <span className="font-semibold">
                                  {formatCurrency(budget)}
                                </span>
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOverBudget ? 'bg-destructive' : 'bg-primary'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

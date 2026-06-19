import { PiggyBank } from 'lucide-react'
import { AppShell } from '@/components/shell/app-shell'
import { PageHeader } from '@/components/shell/page-header'
import { Card, CardContent } from '@/components/ui/card'

// Placeholder. Owned by Member 4 — to be built into the spending analytics
// dashboard per docs/team-plans/member-4-estatement-smartspend.md.
export default function SmartSpendPage() {
  return (
    <AppShell>
      <PageHeader
        title="Smart Spend"
        description="Spending insights and budgeting"
      />
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <PiggyBank className="size-6" />
          </span>
          <p className="font-medium">Smart Spend is coming soon</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Spending analytics, category breakdowns, and budgets will appear
            here.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  )
}

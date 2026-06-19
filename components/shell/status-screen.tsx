import { CheckCircle2, XCircle } from 'lucide-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'

type StatusScreenProps = {
  variant: 'success' | 'error'
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
}

export function StatusScreen({
  variant,
  title,
  description,
  children,
  className
}: StatusScreenProps) {
  const isSuccess = variant === 'success'
  const Icon = isSuccess ? CheckCircle2 : XCircle

  return (
    <div
      role="status"
      className={cn(
        'mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center',
        className
      )}
    >
      <div
        className={cn(
          'flex size-20 items-center justify-center rounded-full',
          isSuccess
            ? 'bg-success/10 text-success'
            : 'bg-destructive/10 text-destructive'
        )}
      >
        <Icon className="size-10" />
      </div>
      <h2 className="font-semibold text-xl">{title}</h2>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
      {children ? <div className="mt-2 w-full">{children}</div> : null}
    </div>
  )
}

export default StatusScreen

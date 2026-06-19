'use client'

import { Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { StatusScreen } from '@/components/shell/status-screen'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { resendVerificationRequest } from '@/lib/api/auth'

function CheckEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleResend() {
    if (!email) return
    setMessage(null)
    setError(null)
    setSending(true)
    try {
      const result = await resendVerificationRequest(email)
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend email.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="size-6" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent a verification link{email ? ` to ${email}` : ''}. Click it to
          activate your Nova Bank account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-center text-muted-foreground text-sm">
          You must verify your email before you can sign in.
        </p>

        {message ? (
          <p className="text-center text-primary text-sm">{message}</p>
        ) : null}
        {error ? (
          <p role="alert" className="text-center text-destructive text-sm">
            {error}
          </p>
        ) : null}

        <Button
          type="button"
          variant="outline"
          disabled={!email || sending}
          onClick={handleResend}
        >
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Sending...
            </>
          ) : (
            'Resend verification email'
          )}
        </Button>

        <p className="text-center text-muted-foreground text-sm">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <StatusScreen variant="success" title="Loading..." description="" />
      }
    >
      <CheckEmailContent />
    </Suspense>
  )
}

'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { AuthRequestError, loginRequest, resendVerificationRequest } from '@/lib/api/auth'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  password: z.string().min(1, 'Password is required.')
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formError, setFormError] = useState<string | null>(null)
  const [showResend, setShowResend] = useState(false)
  const [resendEmailInput, setResendEmailInput] = useState('')
  const [resendMessage, setResendMessage] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const [banner] = useState<string | null>(() => {
    if (searchParams.get('verified') === '1') {
      return 'Email verified. You can sign in now.'
    }
    if (searchParams.get('verify') === 'invalid') {
      return 'Verification link is invalid or expired. Request a new one below.'
    }
    return null
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    setShowResend(false)
    setResendMessage(null)
    try {
      await loginRequest(values)
      const next = searchParams.get('next')
      router.replace(next?.startsWith('/') ? next : '/dashboard')
      router.refresh()
    } catch (err) {
      if (err instanceof AuthRequestError && err.code === 'EMAIL_NOT_VERIFIED') {
        setFormError(err.message)
        setShowResend(true)
        return
      }
      setFormError(err instanceof Error ? err.message : 'Login failed.')
    }
  }

  async function handleResend() {
    if (!resendEmailInput.trim()) return
    setResending(true)
    setResendMessage(null)
    try {
      const result = await resendVerificationRequest(resendEmailInput.trim())
      setResendMessage(result.message)
    } catch (err) {
      setResendMessage(
        err instanceof Error ? err.message : 'Could not resend verification.'
      )
    } finally {
      setResending(false)
    }
  }

  return (
    <Card className="glass-panel border shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <Lock className="size-5" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your Nova Bank account</CardDescription>
      </CardHeader>
      <CardContent>
        {banner ? (
          <p className="mb-4 rounded-lg bg-primary/10 px-3 py-2 text-center text-primary text-sm">
            {banner}
          </p>
        ) : null}

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="username">Username</FieldLabel>
            <Input
              id="username"
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              {...register('username')}
            />
            <FieldError>{errors.username?.message}</FieldError>
          </Field>

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link
                href="/reset-password"
                className="text-muted-foreground text-sm hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              {...register('password')}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>

          {formError ? (
            <p role="alert" className="text-destructive text-sm">
              {formError}
            </p>
          ) : null}

          {showResend ? (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <Field>
                <FieldLabel htmlFor="resendEmail">Email for verification</FieldLabel>
                <Input
                  id="resendEmail"
                  type="email"
                  value={resendEmailInput}
                  onChange={(e) => setResendEmailInput(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resending || !resendEmailInput.trim()}
                onClick={handleResend}
              >
                {resending ? 'Sending...' : 'Resend verification email'}
              </Button>
              {resendMessage ? (
                <p className="text-primary text-sm">{resendMessage}</p>
              ) : null}
            </div>
          ) : null}

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href="/sign-up"
              className="font-medium text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 border-border/60 border-t pt-4 text-muted-foreground text-xs">
          <ShieldCheck className="size-4 text-success" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

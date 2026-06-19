'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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

// NOTE: Backend OTP/email delivery is not yet implemented. This page validates
// input and shows a confirmation. Wire it to a real reset endpoint when the
// email/OTP service is available.
const resetSchema = z.object({
  email: z.string().email('Enter a valid email.')
})

type ResetValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) })

  async function onSubmit(_values: ResetValues) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    setSent(true)
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="pt-6">
          <StatusScreen
            variant="success"
            title="Check your email"
            description="If an account matches that email, we've sent password reset instructions."
          >
            <Button asChild className="w-full">
              <Link href="/login">Back to sign in</Link>
            </Button>
          </StatusScreen>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send reset instructions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            <FieldError>{errors.email?.message}</FieldError>
          </Field>

          <Button type="submit" className="mt-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Sending...
              </>
            ) : (
              'Send reset link'
            )}
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Remembered it?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

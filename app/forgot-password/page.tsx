'use client'

import { useActionState } from 'react'
import { forgotPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'

const initialState = { error: null, message: undefined }

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPassword, initialState)

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            moonshot
          </Link>
        </div>

        <form action={action} className="space-y-4">
          <FieldGroup>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {state.error && (
              <p className="text-sm text-red-500 text-center">{state.error}</p>
            )}
            {state.message && (
              <p className="text-sm text-green-600 text-center font-medium">{state.message}</p>
            )}

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="bg-background"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isPending || !!state.message}>
              {isPending ? 'Sending…' : 'Send reset link'}
            </Button>
          </FieldGroup>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="underline underline-offset-4 hover:text-foreground">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}

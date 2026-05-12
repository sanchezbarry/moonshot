'use client'

import { useActionState } from 'react'
import { resetPassword } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { GalleryVerticalEnd } from 'lucide-react'
import Link from 'next/link'

const initialState = { error: null }

export default function ResetPasswordPage() {
  const [state, action, isPending] = useActionState(resetPassword, initialState)

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
              <h1 className="text-2xl font-bold">Set new password</h1>
              <p className="text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
            </div>

            {state.error && (
              <p className="text-sm text-red-500 text-center">{state.error}</p>
            )}

            <Field>
              <FieldLabel htmlFor="password">New Password</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="bg-background"
              />
              <FieldDescription>Must be at least 8 characters long.</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="bg-background"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Updating…' : 'Update password'}
            </Button>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}

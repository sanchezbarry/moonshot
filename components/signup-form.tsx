'use client'

import { useActionState, useState } from 'react'
import { signup, type AuthState } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { IconBrandGoogle } from '@tabler/icons-react'
import type { Provider } from '@supabase/supabase-js'
import { WalletLoginButton } from '@/components/WalletLoginButton'

const initialState: AuthState = { error: null }

export function SignupForm({ className }: { className?: string }) {
  const [state, action, isPending] = useActionState(signup, initialState)
  const [oauthLoading, setOauthLoading] = useState<Provider | null>(null)

  async function handleOAuth(provider: Provider) {
    setOauthLoading(provider)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <form className={cn('flex flex-col gap-6', className)} action={action}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Fill in the form below to create your account
          </p>
        </div>

        {state.error && (
          <p className="text-sm text-red-500 text-center">{state.error}</p>
        )}

        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="John Doe"
            required
            className="bg-background"
          />
        </Field>
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
          <FieldDescription>
            We&apos;ll use this to contact you. We will not share your email with anyone else.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
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
          <FieldDescription>Please confirm your password.</FieldDescription>
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Create Account'}
          </Button>
        </Field>

        <FieldSeparator>Or sign up with</FieldSeparator>

        <Field className="flex flex-col gap-2">
          <Button
            variant="outline"
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('google')}
          >
            <IconBrandGoogle className="size-4" />
            {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </Button>
          <WalletLoginButton />
        </Field>

        <FieldDescription className="px-6 text-center">
          Already have an account? <a href="/login">Sign in</a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}

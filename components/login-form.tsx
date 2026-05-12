'use client'

import { useActionState, useState } from 'react'
import { login, type AuthState } from '@/app/actions/auth'
import Link from 'next/link'
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

const initialState: AuthState = { error: null }

export function LoginForm({ className }: { className?: string }) {
  const [state, action, isPending] = useActionState(login, initialState)
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
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Enter your email below to login to your account
          </p>
        </div>

        {state.error && (
          <p className="text-sm text-red-500 text-center">{state.error}</p>
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
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="bg-background"
          />
        </Field>
        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Logging in…' : 'Login'}
          </Button>
        </Field>

        <FieldSeparator>Or continue with</FieldSeparator>

        <Field>
          <Button
            variant="outline"
            type="button"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('google')}
          >
            <IconBrandGoogle className="size-4" />
            {oauthLoading === 'google' ? 'Redirecting…' : 'Continue with Google'}
          </Button>
        </Field>

        <FieldDescription className="text-center">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="underline underline-offset-4">
            Sign up
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}

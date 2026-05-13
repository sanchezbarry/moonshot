'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export type AuthState = { error: string | null; message?: string }

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createClient()
  // Store display_name in Supabase user_metadata so the login fallback can
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  })

  if (error) return { error: error.message }

  // Create the profile row immediately after auth user is created.
  if (data.user) {
    await db.insert(profiles)
      .values({ id: data.user.id, displayName: name })
      .onConflictDoNothing()
  }

  redirect('/dashboard')
}

export async function forgotPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const headersList = await headers()
  const origin = headersList.get('origin') ?? 'http://localhost:3000'

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: error.message }

  return { error: null, message: 'Check your email for a password reset link.' }
}

export async function resetPassword(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) return { error: 'Passwords do not match.' }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }

  redirect('/dashboard')
}

// Called client-side after signInWithWeb3() succeeds.
export async function ensureProfile(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Supabase stores the wallet address in user_metadata.address
  const address = user.user_metadata?.address as string | undefined
  const displayName = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : user.email?.split('@')[0] ?? 'Explorer'

  await db.insert(profiles)
    .values({ id: user.id, displayName })
    .onConflictDoNothing()
}

export async function logout(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  // Insert profile in case it was never created (e.g. signup failed mid-way).
  if (data.user) {
    const displayName =
      (data.user.user_metadata?.display_name as string | undefined) ??
      data.user.email?.split('@')[0] ??
      'User'

    await db.insert(profiles)
      .values({ id: data.user.id, displayName })
      .onConflictDoNothing()
  }

  redirect('/dashboard')
}

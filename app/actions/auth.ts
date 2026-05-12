'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export type AuthState = { error: string | null }

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
  // retrieve it even if the profile insert below hasn't run yet
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  })

  if (error) return { error: error.message }

  // Create the profile row immediately after auth user is created.
  // The profile id matches auth.users.id — this is the permanent link between the two.
  // onConflictDoNothing guards against retries (e.g. if email confirmation is re-sent).
  if (data.user) {
    await db.insert(profiles)
      .values({ id: data.user.id, displayName: name })
      .onConflictDoNothing()
  }

  redirect('/quests')
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

  // Upsert profile in case it was never created (e.g. signup failed mid-way).
  // Prefer the display_name stored in Supabase user_metadata (set during signUp)
  // over the email prefix so the real name is used even on first login.
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

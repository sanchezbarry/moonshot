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
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return { error: error.message }

  // Create the profile row immediately after auth user is created.
  // The profile id matches auth.users.id — this is the permanent link between the two.
  if (data.user) {
    await db.insert(profiles).values({
      id: data.user.id,
      displayName: name,
    })
  }

  redirect('/quests')
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }

  redirect('/quests')
}

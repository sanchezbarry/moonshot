import { createBrowserClient } from '@supabase/ssr'

// Use this in Client Components ('use client') only.
// Creates a Supabase client that reads/writes session cookies in the browser.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', origin))
  }

  // Build the response first so we can attach the refreshed session cookies to it
  const response = NextResponse.redirect(new URL('/dashboard', origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        // Write refreshed cookies onto the redirect response, not the request
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !user) {
    return NextResponse.redirect(new URL('/login?error=oauth_failed', origin))
  }

  // Create profile if this is the first OAuth sign-in for this user.
  // OAuth providers expose the display name via user_metadata — field names
  // differ per provider (Google uses full_name, Twitch uses full_name or name).
  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'User'

  await db
    .insert(profiles)
    .values({ id: user.id, displayName })
    .onConflictDoNothing()

  return response
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, questCompletions } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Proxy guarantees user is authenticated before this page renders,
  // but we still narrow the type so TypeScript is satisfied
  if (!user) return null

  // Fetch profile and total check-in count in parallel
  const [[profile], [{ checkIns }]] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)),
    db
      .select({ checkIns: count() })
      .from(questCompletions)
      .where(eq(questCompletions.userId, user.id)),
  ])

  const displayName = profile?.displayName ?? user.email?.split('@')[0] ?? 'Explorer'
  const points = profile?.pointsBalance ?? 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">

      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">{user.email}</p>
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome back, {displayName} 👋
        </h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border bg-card p-6 space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Points Balance</p>
          <p className="text-5xl font-bold tracking-tight">{points.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">pts</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 space-y-1">
          <p className="text-sm text-muted-foreground font-medium">Total Check-ins</p>
          <p className="text-5xl font-bold tracking-tight">{checkIns}</p>
          <p className="text-xs text-muted-foreground">days completed</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-lg">What do you want to do?</h2>
        <div className="flex gap-3 flex-wrap">
          <Link
            href="/quests"
            className="rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            🚀 Complete Quests
          </Link>
          <Link
            href="/rewards"
            className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            🎁 Browse Rewards
          </Link>
        </div>
      </div>

    </div>
  )
}

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, questCompletions, rewardRedemptions, rewards } from '@/lib/db/schema'
import { eq, count, and } from 'drizzle-orm'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const [[profile], [{ checkIns }], earnedBadges] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)),

    db.select({ checkIns: count() })
      .from(questCompletions)
      .where(eq(questCompletions.userId, user.id)),

    // Join redemptions with rewards to find all badge-type rewards the user has claimed
    db.select({ title: rewards.title, description: rewards.description })
      .from(rewardRedemptions)
      .innerJoin(rewards, and(
        eq(rewardRedemptions.rewardId, rewards.id),
        eq(rewards.type, 'badge')
      ))
      .where(eq(rewardRedemptions.userId, user.id)),
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

      {/* Stats */}
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

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-lg">Badges</h2>
          <div className="flex flex-wrap gap-3">
            {earnedBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2"
                title={badge.description ?? ''}
              >
                <span className="text-lg">🏅</span>
                <span className="text-sm font-medium">{badge.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, quests, questCompletions } from '@/lib/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

const DAILY_CHECKIN_POINTS = 100

// Discriminated union so the client component can branch on status without null checks
export type CheckInResult =
  | { status: 'success'; pointsEarned: number; newBalance: number }
  | { status: 'already_checked_in'; nextCheckIn: string } // ISO string — Date isn't serialisable across server/client boundary
  | { status: 'error'; message: string }

export async function dailyCheckIn(): Promise<CheckInResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { status: 'error', message: 'Not authenticated' }

  // Calendar-day boundary in UTC — "once per day" means once per UTC date
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

  // Auto-seed the daily check-in quest row if it doesn't exist yet
  let [dailyQuest] = await db
    .select()
    .from(quests)
    .where(eq(quests.type, 'daily_checkin'))
    .limit(1)

  if (!dailyQuest) {
    ;[dailyQuest] = await db
      .insert(quests)
      .values({
        title: 'Daily Check-In',
        description: 'Check in every day to earn points',
        pointsReward: DAILY_CHECKIN_POINTS,
        type: 'daily_checkin',
      })
      .returning()
  }

  // Check for an existing completion record for today
  const [existing] = await db
    .select({ id: questCompletions.id })
    .from(questCompletions)
    .where(
      and(
        eq(questCompletions.userId, user.id),
        eq(questCompletions.questId, dailyQuest.id),
        gte(questCompletions.completedAt, todayStart)
      )
    )
    .limit(1)

  if (existing) {
    return {
      status: 'already_checked_in',
      nextCheckIn: tomorrowStart.toISOString(),
    }
  }

  // Atomic transaction — quest_completions is the immutable ledger.
  // Both writes succeed or both fail: no phantom points, no orphaned records.
  await db.transaction(async (tx) => {
    await tx.insert(questCompletions).values({
      userId: user.id,
      questId: dailyQuest.id,
    })

    await tx
      .update(profiles)
      .set({
        // Use sql`` to do the increment server-side, avoiding read-modify-write races
        pointsBalance: sql`${profiles.pointsBalance} + ${DAILY_CHECKIN_POINTS}`,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id))
  })

  const [profile] = await db
    .select({ pointsBalance: profiles.pointsBalance })
    .from(profiles)
    .where(eq(profiles.id, user.id))

  return {
    status: 'success',
    pointsEarned: DAILY_CHECKIN_POINTS,
    newBalance: profile?.pointsBalance ?? DAILY_CHECKIN_POINTS,
  }
}

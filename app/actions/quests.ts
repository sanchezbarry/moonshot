'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, quests, questCompletions } from '@/lib/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'

const DAILY_CHECKIN_POINTS = 100
const STREAK_BONUS_POINTS = 300
const STREAK_BONUS_INTERVAL = 7

export type CheckInResult =
  | { status: 'success'; pointsEarned: number; newBalance: number; newStreak: number; bonusAwarded: boolean }
  | { status: 'already_checked_in'; nextCheckIn: string; currentStreak: number }
  | { status: 'error'; message: string }

export type StreakInfo = {
  currentStreak: number
  checkedInToday: boolean
}

// Returns a UTC date string "YYYY-M-D" used for deduplicating completions by calendar day
function utcDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
}

// Counts consecutive calendar days (UTC) ending on today (if checkedInToday) or yesterday.
// Walks the sorted-descending date list and breaks on the first gap.
async function calculateStreak(userId: string, questId: string): Promise<StreakInfo> {
  const completions = await db
    .select({ completedAt: questCompletions.completedAt })
    .from(questCompletions)
    .where(and(eq(questCompletions.userId, userId), eq(questCompletions.questId, questId)))
    .orderBy(desc(questCompletions.completedAt))

  if (completions.length === 0) return { currentStreak: 0, checkedInToday: false }

  const now = new Date()
  const todayKey = utcDateKey(now)

  // Deduplicate to one entry per calendar day
  const uniqueDateKeys = [...new Set(completions.map((c) => utcDateKey(new Date(c.completedAt))))]

  const checkedInToday = uniqueDateKeys[0] === todayKey

  // Walk backwards from today (or yesterday) counting consecutive days
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  if (!checkedInToday) startDate.setUTCDate(startDate.getUTCDate() - 1)

  let streak = 0
  const cursor = new Date(startDate)
  const keySet = new Set(uniqueDateKeys)

  while (keySet.has(utcDateKey(cursor))) {
    streak++
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return { currentStreak: streak, checkedInToday }
}

// Called by the quests server page to pre-populate the UI with streak state
export async function getStreakInfo(questId: string): Promise<StreakInfo> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { currentStreak: 0, checkedInToday: false }
  return calculateStreak(user.id, questId)
}

export async function dailyCheckIn(): Promise<CheckInResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'error', message: 'Not authenticated' }

  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)

  let [dailyQuest] = await db.select().from(quests).where(eq(quests.type, 'daily_checkin')).limit(1)

  if (!dailyQuest) {
    ;[dailyQuest] = await db
      .insert(quests)
      .values({
        title: 'Daily Check-In',
        description: 'Show up every day and earn points. Consistency is the key to the moon.',
        pointsReward: DAILY_CHECKIN_POINTS,
        type: 'daily_checkin',
      })
      .returning()
  }

  // Reject if already checked in today
  const [existing] = await db
    .select({ id: questCompletions.id })
    .from(questCompletions)
    .where(and(
      eq(questCompletions.userId, user.id),
      eq(questCompletions.questId, dailyQuest.id),
      gte(questCompletions.completedAt, todayStart)
    ))
    .limit(1)

  if (existing) {
    const { currentStreak } = await calculateStreak(user.id, dailyQuest.id)
    return { status: 'already_checked_in', nextCheckIn: tomorrowStart.toISOString(), currentStreak }
  }

  // Streak before today's entry — walk up to yesterday
  const { currentStreak: previousStreak } = await calculateStreak(user.id, dailyQuest.id)
  const newStreak = previousStreak + 1
  const bonusAwarded = newStreak % STREAK_BONUS_INTERVAL === 0
  const totalPoints = DAILY_CHECKIN_POINTS + (bonusAwarded ? STREAK_BONUS_POINTS : 0)

  await db.transaction(async (tx) => {
    await tx.insert(questCompletions).values({ userId: user.id, questId: dailyQuest.id })
    await tx
      .update(profiles)
      .set({
        pointsBalance: sql`${profiles.pointsBalance} + ${totalPoints}`,
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
    pointsEarned: totalPoints,
    newBalance: profile?.pointsBalance ?? totalPoints,
    newStreak,
    bonusAwarded,
  }
}

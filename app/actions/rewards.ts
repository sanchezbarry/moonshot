'use server'

import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, rewards, rewardRedemptions } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export type RedeemResult =
  | { status: 'success'; message: string; newBalance: number; effect?: string }
  | { status: 'already_redeemed' }
  | { status: 'insufficient_balance'; required: number; current: number }
  | { status: 'error'; message: string }

// Auto-seeds Pioneer Badge and Double or Half if they don't exist yet.
// Returns both reward rows so callers can use the IDs without hardcoding them.
export async function getOrSeedRewards() {
  const existing = await db.select().from(rewards).where(eq(rewards.isActive, true))

  const hasPioneer = existing.some((r) => r.title === 'Pioneer Badge')
  const hasDoubleOrHalf = existing.some((r) => r.title === 'Double or Half')

  if (!hasPioneer) {
    await db.insert(rewards).values({
      title: 'Pioneer Badge',
      description:
        'A mark of the early explorers. Claim your Pioneer Badge and wear it on your dashboard as proof you were here from the start.',
      pointsCost: 100,
      type: 'badge',
    })
  }

  if (!hasDoubleOrHalf) {
    await db.insert(rewards).values({
      title: 'Double or Half',
      description:
        'Feeling lucky? Spend 100 pts to spin the wheel. 50% chance your remaining balance doubles. 50% chance it halves. High risk, high reward.',
      pointsCost: 100,
      type: 'loot',
    })
  }

  return db.select().from(rewards).where(eq(rewards.isActive, true))
}

export async function redeemReward(rewardId: string): Promise<RedeemResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { status: 'error', message: 'Not authenticated' }

  const [reward] = await db.select().from(rewards).where(eq(rewards.id, rewardId))
  if (!reward) return { status: 'error', message: 'Reward not found' }

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id))
  if (!profile) return { status: 'error', message: 'Profile not found' }

  // Badges are one-time only — check for existing redemption
  if (reward.type === 'badge') {
    const [existing] = await db
      .select({ id: rewardRedemptions.id })
      .from(rewardRedemptions)
      .where(
        and(
          eq(rewardRedemptions.userId, user.id),
          eq(rewardRedemptions.rewardId, rewardId)
        )
      )
      .limit(1)

    if (existing) return { status: 'already_redeemed' }
  }

  if (profile.pointsBalance < reward.pointsCost) {
    return {
      status: 'insufficient_balance',
      required: reward.pointsCost,
      current: profile.pointsBalance,
    }
  }

  // --- Pioneer Badge ---
  if (reward.type === 'badge') {
    await db.transaction(async (tx) => {
      await tx.insert(rewardRedemptions).values({ userId: user.id, rewardId })
      await tx
        .update(profiles)
        .set({
          pointsBalance: sql`${profiles.pointsBalance} - ${reward.pointsCost}`,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, user.id))
    })

    const [updated] = await db
      .select({ pointsBalance: profiles.pointsBalance })
      .from(profiles)
      .where(eq(profiles.id, user.id))

    return {
      status: 'success',
      message: '🏅 Pioneer Badge claimed! Check your dashboard.',
      newBalance: updated.pointsBalance,
    }
  }

  // --- Double or Half ---
  // Deduct cost first, then apply the random multiplier to the remaining balance
  const balanceAfterCost = profile.pointsBalance - reward.pointsCost
  const isDouble = Math.random() < 0.5
  const finalBalance = isDouble
    ? balanceAfterCost * 2
    : Math.floor(balanceAfterCost / 2)

  await db.transaction(async (tx) => {
    await tx.insert(rewardRedemptions).values({ userId: user.id, rewardId })
    await tx
      .update(profiles)
      .set({ pointsBalance: finalBalance, updatedAt: new Date() })
      .where(eq(profiles.id, user.id))
  })

  const effect = isDouble
    ? `🚀 Doubled! Your balance went from ${balanceAfterCost} → ${finalBalance} pts`
    : `💥 Halved! Your balance went from ${balanceAfterCost} → ${finalBalance} pts`

  return {
    status: 'success',
    message: effect,
    newBalance: finalBalance,
    effect: isDouble ? 'double' : 'half',
  }
}

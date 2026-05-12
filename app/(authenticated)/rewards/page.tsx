import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { profiles, rewards, rewardRedemptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { LayoutGrid } from '@/components/ui/layout-grid'
import { RewardCard } from '@/components/RewardCard'

const THUMBNAILS: Record<string, string> = {
  'Pioneer Badge':
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2672&auto=format&fit=crop',
  'Double or Half':
    'https://images.unsplash.com/photo-1518895312237-a9e23508077d?q=80&w=2676&auto=format&fit=crop',
}

const FALLBACK =
  'https://images.unsplash.com/photo-1476231682828-37e571bc172f?q=80&w=3474&auto=format&fit=crop'

// Classnames alternate between wide and narrow grid cells, each with a fixed height
// so LayoutGrid's absolute-positioned images have a parent height to fill
const CARD_CLASSES = ['md:col-span-2 h-64 md:h-80', 'col-span-1 h-64 md:h-80']

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Seed Pioneer Badge + Double or Half if they don't exist yet
  const existing = await db.select().from(rewards).where(eq(rewards.isActive, true))
  if (!existing.some((r) => r.title === 'Pioneer Badge')) {
    await db.insert(rewards).values({
      title: 'Pioneer Badge',
      description: 'A mark of the early explorers. Claim your Pioneer Badge and wear it on your dashboard as proof you were here from the start.',
      pointsCost: 100,
      type: 'badge',
    })
  }
  if (!existing.some((r) => r.title === 'Double or Half')) {
    await db.insert(rewards).values({
      title: 'Double or Half',
      description: 'Feeling lucky? Spend 100 pts to spin the wheel. 50% chance your remaining balance doubles. 50% chance it halves.',
      pointsCost: 100,
      type: 'loot',
    })
  }

  const [allRewards, [profile], redemptions] = await Promise.all([
    db.select().from(rewards).where(eq(rewards.isActive, true)),
    db.select({ pointsBalance: profiles.pointsBalance }).from(profiles).where(eq(profiles.id, user.id)),
    db.select({ rewardId: rewardRedemptions.rewardId }).from(rewardRedemptions).where(eq(rewardRedemptions.userId, user.id)),
  ])

  const redeemedIds = new Set(redemptions.map((r) => r.rewardId))
  const userBalance = profile?.pointsBalance ?? 0

  const cards = allRewards.map((reward, i) => ({
    id: reward.id,
    title: reward.title,
    className: CARD_CLASSES[i % 2],
    thumbnail: THUMBNAILS[reward.title] ?? FALLBACK,
    content: (
      <RewardCard
        reward={reward}
        userBalance={userBalance}
        isAlreadyRedeemed={redeemedIds.has(reward.id)}
      />
    ),
  }))

  return (
    <div className="w-full py-10">
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <h1 className="text-4xl font-bold">Rewards</h1>
        <p className="text-muted-foreground mt-1">
          Your balance:{' '}
          <span className="font-semibold text-foreground">{userBalance} pts</span>
        </p>
      </div>
      <LayoutGrid cards={cards} />
    </div>
  )
}

import { db } from '@/lib/db'
import { quests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getStreakInfo } from '@/app/actions/quests'
import { QuestCarousel } from './QuestCarousel'

export default async function QuestsPage() {
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
        description: 'Show up every day and earn points. Consistency is the key to the moon.',
        pointsReward: 100,
        type: 'daily_checkin',
      })
      .returning()
  }

  const streakInfo = await getStreakInfo(dailyQuest.id)

  return <QuestCarousel dailyQuest={dailyQuest} streakInfo={streakInfo} />
}

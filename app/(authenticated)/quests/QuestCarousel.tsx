'use client'

import { Carousel, Card } from '@/components/ui/apple-cards-carousel'
import { DailyCheckIn } from '@/components/DailyCheckIn'
import type { Quest } from '@/lib/db/schema'
import type { StreakInfo } from '@/app/actions/quests'

const DummyContent = () => (
  <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4">
    <p className="text-neutral-600 text-base md:text-2xl font-sans max-w-3xl mx-auto">
      <span className="font-bold text-neutral-700">Coming soon.</span>{' '}
      This quest is still being prepared. Check back later for more ways to earn points.
    </p>
  </div>
)

interface QuestCarouselProps {
  dailyQuest: Quest
  streakInfo: StreakInfo
}

export function QuestCarousel({ dailyQuest, streakInfo }: QuestCarouselProps) {
  const data = [
    {
      category: `Daily Quest · ${dailyQuest.pointsReward} pts`,
      title: dailyQuest.title,
      src: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=2672&auto=format&fit=crop',
      completed: streakInfo.checkedInToday,
      content: (
        <DailyCheckIn
          title={dailyQuest.title}
          description={dailyQuest.description}
          pointsReward={dailyQuest.pointsReward}
          initialStreak={streakInfo.currentStreak}
          checkedInToday={streakInfo.checkedInToday}
        />
      ),
    },
    {
      category: 'Social · 500 pts',
      title: 'Connect your Twitch account.',
      src: 'https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop',
      content: <DummyContent />,
    },
    {
      category: 'Special Event · 1000 pts',
      title: 'Call of Duty Tournament.',
      src: 'https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop',
      content: <DummyContent />,
    },
    {
      category: 'Onboarding · 250 pts',
      title: 'Complete your profile.',
      src: 'https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop',
      content: <DummyContent />,
    },
  ]

  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout={true} />
  ))

  return (
    <div className="w-full h-full py-20">
      <h2 className="max-w-7xl pl-4 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans">
        Quests
      </h2>
      <Carousel items={cards} />
    </div>
  )
}

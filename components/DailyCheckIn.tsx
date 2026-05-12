'use client'

import { useTransition, useState } from 'react'
import { dailyCheckIn, type CheckInResult } from '@/app/actions/quests'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DailyCheckInProps {
  title: string
  description: string
  pointsReward: number
  initialStreak: number
  checkedInToday: boolean
}

function formatTimeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0) return 'soon'
  const hours = Math.floor(diff / 1000 / 60 / 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

// Returns which day of the current 7-day cycle the streak is on (1–7), or 0 if no streak
function cycleDay(streak: number): number {
  if (streak === 0) return 0
  return ((streak - 1) % 7) + 1
}

function StreakDots({ streak, checkedInToday }: { streak: number; checkedInToday: boolean }) {
  const day = cycleDay(streak)

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700">
          {streak > 0 ? `🔥 ${streak} day streak` : 'Start your streak today'}
        </span>
        <span className="text-neutral-500">
          Day {checkedInToday ? day : Math.min(day, 7)} / 7
        </span>
      </div>

      {/* 7 segment progress dots */}
      <div className="flex gap-2">
        {Array.from({ length: 7 }, (_, i) => {
          const dotDay = i + 1
          const filled = dotDay <= day
          const isBonus = dotDay === 7

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={[
                  'h-3 rounded-full transition-all duration-300',
                  filled
                    ? isBonus
                      ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]'
                      : 'bg-primary'
                    : 'bg-neutral-200',
                ].join(' ')}
                style={{ width: '100%' }}
              />
              {isBonus && (
                <span className="text-[10px] font-bold text-amber-500">+300</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Bonus hint */}
      {!checkedInToday && day === 6 && (
        <p className="text-xs text-amber-600 font-medium">
          ⭐ Check in tomorrow for your 7-day bonus: +300 pts!
        </p>
      )}
      {checkedInToday && day === 7 && (
        <p className="text-xs text-amber-600 font-medium">
          🏆 7-day cycle complete! Keep the streak going.
        </p>
      )}
    </div>
  )
}

export function DailyCheckIn({ title, description, pointsReward, initialStreak, checkedInToday: initialCheckedIn }: DailyCheckInProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [streak, setStreak] = useState(initialStreak)
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedIn)

  function handleCheckIn() {
    startTransition(async () => {
      const res = await dailyCheckIn()
      setResult(res)
      if (res.status === 'success') {
        setStreak(res.newStreak)
        setCheckedInToday(true)
      }
    })
  }

  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 flex flex-col items-center gap-6">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-neutral-800 mb-1">{title}</h3>
          <p className="text-neutral-500 text-sm">{description}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-700">
            +{pointsReward} pts · +300 pts bonus on day 7
          </p>
        </div>

        <StreakDots streak={streak} checkedInToday={checkedInToday} />
      </div>

      <Button
        size="lg"
        onClick={handleCheckIn}
        disabled={isPending || checkedInToday}
        className="px-10 py-6 text-lg"
      >
        {checkedInToday ? '✓ Checked in today' : isPending ? 'Checking in…' : '🚀 Check In'}
      </Button>

      {/* Success */}
      <AlertDialog open={result?.status === 'success'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {result?.status === 'success' && result.bonusAwarded ? '🏆 7-Day Bonus!' : '🎉 Checked in!'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                {result?.status === 'success' && result.bonusAwarded && (
                  <p className="font-medium text-amber-600">You completed a 7-day streak!</p>
                )}
                <p>
                  You earned{' '}
                  <span className="font-bold text-foreground">
                    +{result?.status === 'success' ? result.pointsEarned : 0} pts
                  </span>
                  .
                </p>
                <p className="text-sm">
                  Streak:{' '}
                  <span className="font-semibold text-foreground">
                    🔥 {result?.status === 'success' ? result.newStreak : 0} days
                  </span>
                </p>
                <p className="text-sm">
                  New balance:{' '}
                  <span className="font-semibold text-foreground">
                    {result?.status === 'success' ? result.newBalance : 0} pts
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResult(null)}>Keep going 🌕</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Already checked in */}
      <AlertDialog open={result?.status === 'already_checked_in'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already checked in today</AlertDialogTitle>
            <AlertDialogDescription>
              Come back in{' '}
              <span className="font-semibold text-foreground">
                {result?.status === 'already_checked_in' ? formatTimeUntil(result.nextCheckIn) : ''}
              </span>{' '}
              for your next check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResult(null)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error */}
      <AlertDialog open={result?.status === 'error'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Something went wrong</AlertDialogTitle>
            <AlertDialogDescription>
              {result?.status === 'error' ? result.message : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResult(null)}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

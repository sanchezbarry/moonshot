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

function formatTimeUntil(isoString: string): string {
  const diff = new Date(isoString).getTime() - Date.now()
  if (diff <= 0) return 'soon'
  const hours = Math.floor(diff / 1000 / 60 / 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function DailyCheckIn() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<CheckInResult | null>(null)

  function handleCheckIn() {
    startTransition(async () => {
      const res = await dailyCheckIn()
      setResult(res)
    })
  }

  function handleDialogClose() {
    setResult(null)
  }

  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 flex flex-col items-center gap-6">
      <div className="text-center max-w-md">
        <h3 className="text-2xl font-bold text-neutral-800 mb-2">Daily Check-In</h3>
        <p className="text-neutral-500 text-base">
          Show up every day and earn <span className="font-semibold text-neutral-700">100 points</span> for each check-in.
          Consistency is the key to the moon.
        </p>
      </div>

      <Button
        size="lg"
        onClick={handleCheckIn}
        disabled={isPending}
        className="px-10 py-6 text-lg"
      >
        {isPending ? 'Checking in…' : '🚀 Check In'}
      </Button>

      {/* Success dialog */}
      <AlertDialog open={result?.status === 'success'} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🎉 Checked in!</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>
                  You earned{' '}
                  <span className="font-bold text-foreground">
                    +{result?.status === 'success' ? result.pointsEarned : 0} points
                  </span>
                  .
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
            <AlertDialogAction onClick={handleDialogClose}>Keep going 🌕</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Already checked in dialog */}
      <AlertDialog open={result?.status === 'already_checked_in'} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already checked in today</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve already earned your points for today. Come back in{' '}
              <span className="font-semibold text-foreground">
                {result?.status === 'already_checked_in'
                  ? formatTimeUntil(result.nextCheckIn)
                  : ''}
              </span>{' '}
              for your next check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error dialog */}
      <AlertDialog open={result?.status === 'error'} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Something went wrong</AlertDialogTitle>
            <AlertDialogDescription>
              {result?.status === 'error' ? result.message : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleDialogClose}>Dismiss</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

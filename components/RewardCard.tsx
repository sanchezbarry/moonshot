'use client'

import { useState, useTransition } from 'react'
import { redeemReward, type RedeemResult } from '@/app/actions/rewards'
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
import type { Reward } from '@/lib/db/schema'

interface RewardCardProps {
  reward: Reward
  userBalance: number
  isAlreadyRedeemed: boolean
}

export function RewardCard({ reward, userBalance, isAlreadyRedeemed }: RewardCardProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<RedeemResult | null>(null)
  const canAfford = userBalance >= reward.pointsCost

  function handleRedeem() {
    startTransition(async () => {
      const res = await redeemReward(reward.id)
      setResult(res)
    })
  }

  return (
    <div className="text-white space-y-3">
      <p className="font-bold text-xl md:text-2xl">{reward.title}</p>
      <p className="text-sm text-white/80 max-w-sm">{reward.description}</p>

      <div className="flex items-center gap-3 pt-1">
        <span className="text-sm font-semibold bg-white/20 rounded-full px-3 py-1">
          {reward.pointsCost} pts
        </span>

        {reward.type === 'badge' && isAlreadyRedeemed ? (
          <span className="text-sm text-white/60 italic">Already claimed ✓</span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-white border-white/50 hover:bg-white/20 hover:text-white bg-transparent"
            onClick={handleRedeem}
            disabled={isPending || !canAfford}
          >
            {isPending
              ? 'Redeeming…'
              : !canAfford
              ? `Need ${reward.pointsCost - userBalance} more pts`
              : 'Redeem'}
          </Button>
        )}
      </div>

      {/* Success */}
      <AlertDialog open={result?.status === 'success'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {result?.status === 'success' && reward.type === 'badge' ? '🏅 Badge Claimed!' : '🎲 Outcome!'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-1">
                <p>{result?.status === 'success' ? result.message : ''}</p>
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
            <AlertDialogAction onClick={() => setResult(null)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Already redeemed */}
      <AlertDialog open={result?.status === 'already_redeemed'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Already claimed</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ve already redeemed the {reward.title}. Check your dashboard to see it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResult(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Insufficient balance */}
      <AlertDialog open={result?.status === 'insufficient_balance'} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Not enough points</AlertDialogTitle>
            <AlertDialogDescription>
              You need{' '}
              <span className="font-semibold text-foreground">
                {result?.status === 'insufficient_balance' ? result.required : 0} pts
              </span>{' '}
              to redeem this reward. Complete more quests to earn points.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setResult(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

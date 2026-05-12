'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm">
        An unexpected error occurred. Try again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">Go to Dashboard</a>
        </Button>
      </div>
    </div>
  )
}

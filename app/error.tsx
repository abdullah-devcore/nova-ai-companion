'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error.message)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl glass-strong p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">{error.message}</p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}

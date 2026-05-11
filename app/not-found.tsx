import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="rounded-2xl glass-strong p-8 text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground text-sm">The page you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="inline-block w-full py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}

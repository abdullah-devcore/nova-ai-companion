import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cache auth state for the current request to avoid redundant checks
const authCheckCache = new WeakMap<NextRequest, { user: any; checked: boolean }>()

// Routes that require no auth checks
const PUBLIC_ROUTES = new Set([
  '/api',
  '/_next',
  '/__nextjs',
  '/favicon.ico',
])

// Routes that are auth-only
const AUTH_ROUTES = new Set(['/auth'])

// Routes that require authentication
const PROTECTED_ROUTES = new Set(['/chat', '/'])

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Fast path: skip auth check for public routes
  for (const route of PUBLIC_ROUTES) {
    if (pathname.startsWith(route)) {
      return NextResponse.next({ request })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              path: '/',
            })
          })
        },
      },
    }
  )

  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[Middleware] Auth error:', error.message)
      // Continue with null user on error
    }

    // Determine route type
    const isAuthRoute = Array.from(AUTH_ROUTES).some(route => pathname.startsWith(route))
    const isProtectedRoute = Array.from(PROTECTED_ROUTES).some(route => pathname.startsWith(route))

    // If no user and accessing protected route, redirect to auth
    if (!user && isProtectedRoute && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth'
      return NextResponse.redirect(url)
    }

    // If user authenticated and accessing auth route, redirect to chat
    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/chat'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error instanceof Error ? error.message : error)
    // Allow request through on unexpected error
    return supabaseResponse
  }
}


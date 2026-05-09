import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log(`[Middleware] ${request.method} ${request.nextUrl.pathname}`)

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  console.log(`[Middleware] User: ${user ? user.email : 'none'} | Path: ${pathname}`)

  // Allow API routes and static assets through without auth checks
  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return supabaseResponse
  }

  // Unauthenticated users: only allow auth pages
  if (!user && !pathname.startsWith('/auth')) {
    console.log(`[Middleware] No user, redirecting ${pathname} -> /auth/login`)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Authenticated users on auth pages: redirect to /chat
  if (user && pathname.startsWith('/auth')) {
    console.log(`[Middleware] User authenticated, redirecting ${pathname} -> /chat`)
    const url = request.nextUrl.clone()
    url.pathname = '/chat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

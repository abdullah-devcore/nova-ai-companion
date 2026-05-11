# Authentication Troubleshooting & Debugging Guide

## Common Issues & Solutions

### Issue 1: "Unexpected response from server" Error

**Symptoms:**
- Login/signup fails with generic error message
- Network tab shows failed requests
- Console shows malformed responses

**Root Causes:**
1. **Missing/Invalid Environment Variables**
2. **Supabase Auth Not Enabled**
3. **Redirect URLs Not Configured**
4. **CORS Issues**

**Solutions:**

#### Step 1: Verify Environment Variables
```bash
# Check local environment
cat .env.local | grep SUPABASE

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

If missing:
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy Project URL and Anon Key
5. Paste into .env.local

#### Step 2: Verify Supabase Auth Configuration
1. Open Supabase Dashboard
2. Go to Authentication > Providers
3. Ensure "Email" provider is enabled
4. Check email provider is configured
5. Go to URL Configuration:
   - Site URL: `http://localhost:3000` (local) or your domain (production)
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

#### Step 3: Check CORS Settings
In Supabase:
1. Settings > API
2. Scroll to "CORS allowed origins"
3. Add your development and production URLs

---

### Issue 2: Sessions Don't Persist After Refresh

**Symptoms:**
- User logs in, gets redirected to /chat
- Refreshes page, gets redirected to /login
- Session not saved

**Root Cause:**
- Browser cookies not being set/persisted
- Middleware not properly reading session cookies

**Solutions:**

#### Check Middleware
```typescript
// lib/supabase/middleware.ts - should handle cookies properly
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        // Cookies must be set here
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
```

#### Verify Browser Cookies
1. Open DevTools > Application > Cookies
2. Should see `sb-` prefixed cookies for Supabase
3. Cookies should have domain matching your URL
4. Expiration should be far in future

If cookies missing:
- Check if browser allows third-party cookies
- Verify domain/sameSite settings
- Check Supabase URL matches exactly

---

### Issue 3: Redirect Loops (User Gets Stuck)

**Symptoms:**
- Infinite redirect: login → chat → login → chat
- Browser shows many redirects in Network tab
- User can't access either page

**Root Cause:**
- Middleware logic has conflicting rules
- Session state not syncing between client and server
- Race condition in redirect logic

**Solutions:**

#### Check Middleware Logic
```typescript
// Bad: Causes loops
if (!user && !pathname.startsWith('/auth')) redirect('/login')
if (user && pathname.startsWith('/auth')) redirect('/chat')

// If auth state changes during redirect, users get looped
```

#### Current Fix Applied
The fixed middleware:
1. Uses fast-path for public routes (no auth check)
2. Separates auth route from protected routes
3. Sets cookies properly to sync state
4. Uses 2-second timeout for session detection

---

### Issue 4: Session Detection Times Out

**Symptoms:**
- Successful login but redirect takes 2+ seconds
- User sees loading spinner for extended time
- Eventually redirects to /chat (via timeout)

**Root Cause:**
- Supabase auth event not firing immediately
- Network latency
- Session not fully propagated to client

**Solution (Already Applied):**
```typescript
// Listen for session, but also have timeout fallback
let unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
  if (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
    router.push("/chat")
  }
})

// Fallback: redirect anyway after 2 seconds
const timeout = setTimeout(() => {
  router.push("/chat")
}, 2000)
```

---

## Debugging Steps

### Enable Verbose Logging

All auth files now have console logging:
- `[Auth]` - auth actions
- `[LoginPage]` - login page flow
- `[RegisterPage]` - register page flow
- `[Middleware]` - middleware execution
- `[DB]` - database queries

### Check Browser Console
```javascript
// Look for logs like:
[LoginPage] Submitting signin for user@example.com
[Auth] signIn: Starting for user@example.com
[Auth] signIn: Success for user@example.com
[LoginPage] Auth state change: SIGNED_IN Session: true
[LoginPage] Session detected, redirecting to /chat
```

### Check Network Tab
1. Open DevTools > Network
2. Filter by XHR/Fetch
3. Look for `/auth/signin` request to Supabase
4. Should return 200 with session data
5. Response should include `access_token` and `refresh_token`

### Check Supabase Logs
1. Go to Supabase Dashboard
2. Auth > User management
3. Check if user was created
4. Look at "Recently active" tab

---

## Production Deployment Checklist

### Before Deploying to Vercel:

- [ ] Update NEXT_PUBLIC_APP_URL to production domain
- [ ] Add production Supabase URL to env vars
- [ ] Add production anon key to env vars
- [ ] Configure Site URL in Supabase Auth settings
- [ ] Add production redirect URLs
- [ ] Verify domain DNS is set up
- [ ] Test login/signup flow in staging
- [ ] Check cookies are set with `secure: true` in production

### Vercel Settings

Go to Project Settings > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL = your-production-url
NEXT_PUBLIC_SUPABASE_ANON_KEY = production-key
NEXT_PUBLIC_APP_URL = https://your-domain.com
OPENROUTER_API_KEY = your-key
```

---

## Quick Test Flow

### Test 1: Signup Flow
1. Go to `/auth/register`
2. Enter email, password (6+ chars), name
3. Click "Create account"
4. Should redirect to `/chat` within 2 seconds
5. Refresh page - should stay on `/chat`
6. Check DevTools > Application > Cookies for `sb-` cookies

### Test 2: Login Flow
1. Go to `/auth/login`
2. Enter email and password
3. Click "Sign in"
4. Should redirect to `/chat` within 2 seconds
5. Refresh page - should stay on `/chat`

### Test 3: Protected Routes
1. While logged in, manually navigate to `/auth/login`
2. Should immediately redirect back to `/chat`
3. Log out (click gear icon > Sign out)
4. Try accessing `/chat`
5. Should redirect to `/auth/login`

### Test 4: Error Handling
1. Go to login
2. Enter wrong password
3. Should show error message
4. Try again with correct password
5. Should work

---

## Environment Variables Reference

### Development (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENROUTER_API_KEY=sk-...
```

### Production (Vercel Dashboard)
Same variables but with production values:
- Production Supabase project URL
- Production anon key
- Production domain for APP_URL
- Same OpenRouter key or new one

---

## Support & Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Auth Guide](https://nextjs.org/docs/app/building-your-application/authentication)
- [Supabase Forum](https://github.com/supabase/supabase/discussions)
- Check `/vercel/share/v0-project/PRODUCTION_CONFIG.md` for deployment guide

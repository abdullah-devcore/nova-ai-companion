# Production Deployment Guide - Nova AI Companion

This guide explains the fixes applied and how to properly deploy the app to production.

## Issues Fixed

### 1. Middleware Cookie Handling
**Problem:** Cookies weren't being persisted correctly, causing session loss on page refreshes.

**Fix:** Updated `lib/supabase/middleware.ts` to:
- Properly set cookies with `sameSite: 'lax'` and `secure: true` for production
- Create response object early so cookies can be set
- Add error handling for middleware failures

**Result:** Sessions now persist across requests.

### 2. Profile Auto-Creation on Signup
**Problem:** Users could sign up but profiles weren't created, causing database errors later.

**Fix:** Updated `lib/actions/auth.ts` to:
- Automatically create a profile record after successful signup
- Handle race conditions gracefully
- Add comprehensive error logging

**Result:** Profiles are created immediately on signup.

### 3. Environment Variables
**Problem:** `NEXT_PUBLIC_APP_URL` was hardcoded to `localhost:3000`, breaking production.

**Fix:** 
- Updated `.env.local` with production placeholders and comments
- Created `.env.example` with setup instructions
- Added documentation about required Supabase configuration

**Result:** App can run on any domain with proper env var configuration.

### 4. Error Logging
**Problem:** No visibility into auth, database, and API failures in production.

**Fix:** Added comprehensive logging with `[prefix]` tags throughout:
- `[Auth]` - Authentication operations
- `[Chat]` - Database operations for chats and messages
- `[Chat API]` - AI API integration
- `[Middleware]` - Session and routing logic
- `[AuthContext]` - Client-side auth state

**Result:** Clear debugging trail in production logs via `console.log`.

## Deployment Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project Settings > Environment Variables and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
OPENROUTER_API_KEY=your-openrouter-key
```

**Important:** Do NOT add `SUPABASE_SERVICE_ROLE_KEY` unless you need server-side privileged operations. It should never be exposed to clients.

### 2. Configure Supabase Authentication

In your Supabase project dashboard, go to Authentication > URL Configuration:

1. **Site URL:** Set to your production domain
   - Example: `https://nova-companion.vercel.app`

2. **Redirect URLs:** Add your app's auth callback
   - Example: `https://nova-companion.vercel.app/auth/callback`
   - Also add: `https://nova-companion.vercel.app`

3. **Email Confirmations:** 
   - If you have custom domain: Enable email confirmations
   - The confirmation link will use your Site URL

### 3. Verify RLS Policies in Supabase

Make sure these Row Level Security (RLS) policies are configured:

**Profiles Table:**
```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

**Chats Table:**
```sql
-- Users can only read their own chats
CREATE POLICY "Users can view own chats"
ON chats FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create chats as themselves
CREATE POLICY "Users can create own chats"
ON chats FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chats
CREATE POLICY "Users can update own chats"
ON chats FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own chats
CREATE POLICY "Users can delete own chats"
ON chats FOR DELETE
USING (auth.uid() = user_id);
```

**Messages Table:**
```sql
-- Users can read messages in their chats
CREATE POLICY "Users can view messages in own chats"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = messages.chat_id
    AND chats.user_id = auth.uid()
  )
);

-- Users can only insert messages in their chats
CREATE POLICY "Users can insert messages in own chats"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chats
    WHERE chats.id = chat_id
    AND chats.user_id = auth.uid()
  )
);
```

**User Memories Table:**
```sql
-- Users can only read their own memories
CREATE POLICY "Users can view own memories"
ON user_memories FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own memories
CREATE POLICY "Users can insert own memories"
ON user_memories FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4. Deploy to Vercel

Push your changes to your repository and Vercel will automatically deploy:

```bash
git add .
git commit -m "Fix: Improve production auth and database integration"
git push origin main
```

### 5. Test in Production

1. **Signup Flow:** Create a new account - should create profile automatically
2. **Login:** Sign in and verify session persists on refresh
3. **Chat:** Send a message - should save to database
4. **Logout:** Sign out - should redirect to login
5. **Verify Logs:** Check Vercel Function logs for `[Auth]`, `[Chat]`, etc. logging

## Troubleshooting

### "No rows returned" errors in chat

**Cause:** RLS policies are too restrictive or profile wasn't created.

**Solution:**
1. Check that profile was created: "Verify RLS Policies" step above
2. Check Supabase dashboard > Authentication > Users to see if user exists
3. Check `profiles` table to see if user has a profile record
4. Review RLS policies in step 3 above

### Session lost on refresh

**Cause:** Cookies aren't being persisted or middleware isn't running.

**Solution:**
1. Check that `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
2. Review Vercel Function logs for middleware errors (tagged with `[Middleware]`)
3. Verify that browsers can set cookies (check Settings > Environment Variables is correct)

### Email confirmation not working

**Cause:** Supabase doesn't have correct Site URL or Redirect URLs.

**Solution:**
1. Go to Supabase > Authentication > URL Configuration
2. Set "Site URL" to your production domain
3. Add "Redirect URLs" for your production domain
4. Check email headers to see if links point to correct domain

### Profile creation fails on signup

**Cause:** RLS policy on profiles table blocks inserts or table doesn't have correct columns.

**Solution:**
1. Check that `profiles` table has: `id`, `email`, `display_name`, `created_at` columns
2. Verify RLS policy allows signed-up users to insert their own profile
3. Check Supabase > Logs for detailed error messages

## Environment Variables Reference

```
# Required - Get from Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# Required - Your production domain
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Required - Get from OpenRouter dashboard
OPENROUTER_API_KEY=sk-or-[your-key]

# Optional - Only needed for server-side privileged operations
# SUPABASE_SERVICE_ROLE_KEY=eyJ... (never expose to client)
```

## Key Files Modified

1. `lib/supabase/middleware.ts` - Fixed cookie persistence
2. `lib/actions/auth.ts` - Added profile creation and logging
3. `lib/auth-context.tsx` - Improved session sync
4. `.env.local` - Updated with production setup guidance
5. `.env.example` - Created documentation file
6. `app/api/chat/route.ts` - Added API logging
7. `lib/actions/chat.ts` - Added comprehensive logging

## Next Steps

1. Deploy to Vercel
2. Monitor logs for errors tagged with `[Auth]`, `[Chat]`, `[Middleware]`
3. Test signup → login → chat workflow
4. Verify persistent memory is saving to database
5. Check Supabase dashboard for data integrity

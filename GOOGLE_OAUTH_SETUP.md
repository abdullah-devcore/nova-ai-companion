# Google OAuth Setup Guide

This application now uses **Google OAuth** for secure, reliable authentication. No more password management complexity.

## Why Google OAuth?

✅ **Secure** - Enterprise-grade security with Google  
✅ **Reliable** - No more password errors or validation issues  
✅ **User-Friendly** - One-click authentication  
✅ **Zero Friction** - No manual account creation needed  
✅ **Production-Ready** - Industry standard authentication  

## Quick Setup (5 minutes)

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing one)
3. Enable the **Google+ API**
4. Go to **Credentials** > **Create OAuth Client ID**
5. Select **Web Application**
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
7. Copy your **Client ID** and **Client Secret**

### Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** > **Providers**
4. Enable **Google**
5. Paste your Google OAuth credentials:
   - Client ID
   - Client Secret
6. Click **Save**

### Step 3: Update Site URLs in Supabase

1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### Step 4: Test It

1. Start the dev server: `npm run dev`
2. Go to `http://localhost:3000/auth`
3. Click "Continue with Google"
4. You should be redirected to `/chat`
5. Done!

## Environment Variables

These are automatically configured in Supabase. No additional env vars needed.

```bash
# These should be in Supabase (no need to set locally)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Production Deployment

### On Vercel

1. Go to Vercel Project > Settings > Environment Variables
2. Ensure these are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In Supabase, update redirect URLs:
   - Add your Vercel deployment URL (e.g., `https://my-app.vercel.app/auth/callback`)
4. Deploy: `git push` or use Vercel dashboard
5. Test the live app

### On Custom Domain

1. Update Supabase Site URL: `https://your-custom-domain.com`
2. Update Redirect URL: `https://your-custom-domain.com/auth/callback`
3. Deploy your app to your domain
4. Test authentication

## How It Works

### User Flow

```
1. User clicks "Continue with Google"
   ↓
2. Browser redirects to Google login
   ↓
3. User logs in with Google account
   ↓
4. Google redirects to /auth/callback
   ↓
5. Backend verifies session and creates/updates profile
   ↓
6. User is redirected to /chat
   ↓
7. User starts chatting with Nova
```

### Code Flow

1. **Auth Page** (`/app/auth/page.tsx`)
   - Shows Google sign-in button
   - Calls Supabase OAuth with Google provider
   - Redirects to Google login

2. **Callback Handler** (`/app/auth/callback/page.tsx`)
   - Verifies OAuth session
   - Creates profile if needed
   - Redirects to chat

3. **Profile Creation**
   - Automatically creates user profile from Google metadata
   - Uses Google name as display name
   - No manual user data collection needed

## Troubleshooting

### Error: "Redirect URI mismatch"

**Cause**: Callback URL doesn't match Google OAuth settings  
**Fix**: 
1. Check your Supabase redirect URL matches exactly
2. For development, use `http://localhost:3000/auth/callback` (lowercase, no trailing slash)
3. For production, use `https://your-domain.com/auth/callback`

### Error: "No session found after callback"

**Cause**: Supabase Google provider not enabled  
**Fix**:
1. Go to Supabase > Authentication > Providers
2. Check that Google is enabled
3. Verify Client ID and Secret are correct
4. Save and retry

### Error: "User blocked by browser extension"

**Cause**: Browser blocking cookies or localStorage  
**Fix**:
1. Disable browser extensions (especially privacy ones)
2. Try in incognito mode
3. Check browser privacy settings

### Still not working?

Check the browser console:
```javascript
// Open DevTools (F12)
// Go to Console tab
// Try signing in again
// Look for error messages
```

## Security Best Practices

✅ **Client ID**: Safe to expose (it's public)  
❌ **Client Secret**: Never expose in client code  
✅ **Session Tokens**: Securely stored in HTTP-only cookies  
✅ **User Data**: Encrypted in Supabase database  

## Customization

### Change Google Scopes

To request additional Google profile data, edit `/app/auth/page.tsx`:

```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    scopes: 'profile email openid',  // Add more scopes here
  },
});
```

### Access Google Profile Data

In the callback handler, you can access Google metadata:

```typescript
const googleName = session.user.user_metadata?.full_name;
const googleEmail = session.user.user_metadata?.email;
const googleAvatar = session.user.user_metadata?.picture;
```

## Support

For issues:
1. Check [Supabase OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)
2. Check [Google OAuth Documentation](https://developers.google.com/identity)
3. Review troubleshooting section above
4. Check browser console for detailed error messages

## Next Steps

1. Set up Google OAuth credentials (5 minutes)
2. Configure Supabase (2 minutes)
3. Deploy to production (5 minutes)
4. Share your app with users (∞ happy users)

Your Nova AI Companion is now production-ready with enterprise-grade authentication!

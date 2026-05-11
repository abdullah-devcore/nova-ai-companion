# Deployment Checklist - Nova AI Companion

## Pre-Deployment

### Code Quality
- [ ] All tests passing
- [ ] No console errors in development
- [ ] No TypeScript errors
- [ ] Build succeeds: `npm run build`
- [ ] No unused imports or variables

### Database
- [ ] Migrations reviewed and tested
- [ ] RLS policies configured and tested
- [ ] Indexes created for performance
- [ ] Backup configured in Supabase
- [ ] Schema matches TypeScript types

### Authentication
- [ ] Signup flow tested end-to-end
- [ ] Login flow tested end-to-end
- [ ] Session persistence verified
- [ ] Logout works correctly
- [ ] Password reset flow verified (if implemented)
- [ ] Middleware redirects working

### Features
- [ ] Chat creation works
- [ ] Messages save to database
- [ ] Memory extraction working
- [ ] Profile editing works
- [ ] Settings persistence works
- [ ] All API routes tested

### Security
- [ ] No sensitive data in console logs
- [ ] No API keys in frontend code
- [ ] RLS policies prevent unauthorized access
- [ ] Password hashing working
- [ ] CORS configured properly
- [ ] Cookie flags set correctly

### Performance
- [ ] Page load time < 2 seconds
- [ ] Chat rendering smooth
- [ ] No memory leaks detected
- [ ] Database queries optimized
- [ ] Middleware response time < 100ms

## Supabase Setup

### Project Creation
- [ ] Supabase project created
- [ ] Project region selected (closest to users)
- [ ] Database initialized

### Authentication Configuration
- [ ] Site URL configured
- [ ] Redirect URLs configured:
  - Development: http://localhost:3000/auth/callback
  - Production: https://yourdomain.com/auth/callback
- [ ] Email provider enabled (if needed)
- [ ] OAuth providers configured (if needed)

### Database Schema
- [ ] SQL migration file created: `supabase/migrations/001_initial_schema.sql`
- [ ] Migration applied to production database
- [ ] Tables created:
  - [ ] profiles
  - [ ] chat_sessions
  - [ ] messages
  - [ ] ai_memories
  - [ ] user_settings
- [ ] Indexes created for all foreign keys and query columns
- [ ] RLS enabled on all tables
- [ ] Triggers configured (auto-profile creation)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` saved
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` saved
- [ ] Service role key stored securely (not in code)

## Vercel Deployment

### Repository
- [ ] Repository created on GitHub
- [ ] `.env.local` is in `.gitignore`
- [ ] `node_modules/` is in `.gitignore`
- [ ] No sensitive data committed

### Project Setup
- [ ] New Vercel project created
- [ ] GitHub repo connected to Vercel
- [ ] Build settings configured:
  - Framework: Next.js
  - Build command: `npm run build`
  - Output directory: `.next`
- [ ] Node version configured (14+ recommended)

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `OPENROUTER_API_KEY` set (as secret)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] Any other required variables configured

### Custom Domain (Optional)
- [ ] Domain registered
- [ ] DNS records configured in Vercel
- [ ] SSL certificate provisioned
- [ ] Domain verified

## Testing in Production

### Authentication
- [ ] Signup creates account and logs in
- [ ] Session persists after page refresh
- [ ] Login works with existing account
- [ ] Logout clears session
- [ ] Redirect logic works correctly
- [ ] Error messages display properly

### Chat Functionality
- [ ] Can create new chat
- [ ] Messages send and receive
- [ ] Chat history loads correctly
- [ ] Old messages don't disappear
- [ ] Chat deletion works

### Memories
- [ ] Memories extracted from messages
- [ ] Memories retrieved correctly
- [ ] Memory scoring works
- [ ] Memory injection into prompts works

### Profile & Settings
- [ ] Profile loads correctly
- [ ] Profile updates persist
- [ ] Settings save and load
- [ ] Preferences apply correctly

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Database errors show user-friendly messages
- [ ] Auth errors redirect properly
- [ ] 404 pages work
- [ ] Error logging works (if configured)

### Performance
- [ ] Page loads quickly
- [ ] Chat is responsive
- [ ] No unnecessary API calls
- [ ] Images/assets load efficiently
- [ ] Mobile responsive design works

## Monitoring & Maintenance

### Monitoring Setup
- [ ] Vercel Analytics enabled
- [ ] Error tracking configured (Sentry or similar)
- [ ] Database monitoring set up
- [ ] Alerts configured for errors
- [ ] Performance monitoring enabled

### Backup & Recovery
- [ ] Supabase backups enabled
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] Git repository backed up

### Maintenance Schedule
- [ ] Weekly: Check error logs
- [ ] Weekly: Verify backups
- [ ] Monthly: Review performance metrics
- [ ] Monthly: Check dependency updates
- [ ] Quarterly: Security audit
- [ ] As-needed: Memory cleanup (see memory-system.ts)

## Post-Deployment

### Documentation
- [ ] README updated with production URL
- [ ] API documentation complete
- [ ] Deployment process documented
- [ ] Troubleshooting guide created

### User Communication
- [ ] Launch announcement prepared
- [ ] Support channels set up
- [ ] Feedback mechanism implemented
- [ ] Status page created (optional)

### Analytics
- [ ] User signups tracked
- [ ] Feature usage monitored
- [ ] Error rates tracked
- [ ] Performance metrics reviewed

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Rollback Vercel deployment (one click)
2. **Database Issues**: Restore from Supabase backup
3. **Code Issues**: Revert to previous Git commit
4. **Partial Issues**: Use feature flags to disable problematic features

## Production Contacts & Resources

- Supabase Support: https://supabase.com/support
- Vercel Support: https://vercel.com/support
- GitHub Issues: [Your repo issues]
- Emergency Contact: [Your contact info]

## Sign-Off

- [ ] Product Owner approved deployment
- [ ] QA team verified all features
- [ ] DevOps/Tech Lead approved infrastructure
- [ ] Security review completed

**Deployment Date**: _______________
**Deployed By**: _______________
**Verified By**: _______________

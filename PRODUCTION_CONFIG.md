# Production Configuration Guide for Nova AI Companion

## Environment Variables

### Required for Development and Production

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Provider (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-key
NEXT_PUBLIC_AI_MODEL=openai/gpt-4-turbo

# Authentication Callbacks
NEXT_PUBLIC_APP_URL=https://yourdomain.com (or http://localhost:3000 for dev)
```

### Optional Environment Variables

```bash
# Analytics (if enabled)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Database
DATABASE_URL=postgresql://user:password@host/database (for migrations)
```

## Supabase Setup

### Authentication

1. Go to Supabase Dashboard → Authentication → Providers
2. Configure OAuth providers if needed (Google, GitHub, etc.)
3. Set redirect URLs:
   - Development: http://localhost:3000/auth/callback
   - Production: https://yourdomain.com/auth/callback

### Database Schema

Run the SQL migration:

```bash
# The migration file is at: supabase/migrations/001_initial_schema.sql
# Apply via Supabase Dashboard or CLI:
supabase db push
```

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to view/edit only their own data
- Prevent unauthorized access
- Auto-create profiles and settings on signup

### API Keys

- **Anon Key** (public): Use in browser, limited to public data and RLS policies
- **Service Role Key** (private): Use in server actions only, bypasses RLS

## Vercel Deployment

### 1. Connect Repository

```bash
vercel --prod
```

### 2. Environment Variables

Add to Vercel Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENROUTER_API_KEY
NEXT_PUBLIC_APP_URL
```

### 3. Build Settings

- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### 4. Deployment

```bash
# Deploy to production
vercel --prod

# View deployment
vercel ls
vercel open
```

## Security Checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to your production domain
- [ ] Configure CORS on Supabase
- [ ] Set secure cookie flags (done in middleware)
- [ ] Enable HTTPS (automatic on Vercel)
- [ ] Use Service Role Key only on server
- [ ] Never commit API keys to git
- [ ] Enable Supabase backups
- [ ] Set up monitoring/alerting

## Performance Optimizations

### Already Implemented

- Query caching with TTL (2-20 minutes based on resource)
- Lazy loading for off-screen content
- Middleware optimization with fast-path routing
- Request deduplication to prevent duplicate API calls
- Prefetching for critical resources
- Optimized database indexes
- Message pagination support

### Additional Recommendations

- Enable Vercel Analytics
- Set up Sentry for error tracking
- Use CDN for static assets
- Enable compression (automatic)
- Set cache headers appropriately

## Monitoring & Analytics

### Vercel Analytics

Automatically tracks:
- Core Web Vitals
- Page performance
- Error rates

### Database Monitoring

Monitor via Supabase Dashboard:
- Query performance
- Storage usage
- Realtime connections
- Auth events

## Troubleshooting

### "Failed to find Server Action"

- Ensure `NEXT_PUBLIC_APP_URL` matches deployment domain
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run build`

### Auth not working on deployment

- Verify Supabase auth callback URLs
- Check CORS settings
- Ensure cookies are being persisted
- Check browser console for detailed errors

### Slow database queries

- Check indexes are created
- Review RLS policies complexity
- Use query cache for frequently accessed data
- Consider pagination for large datasets

## Scaling Considerations

1. **Database**: Supabase handles scaling automatically
2. **API Rate Limiting**: Implement in production if needed
3. **Message Archive**: Consider archiving old messages to improve query speed
4. **Memory Cleanup**: Prune old memories periodically (see memory-system.ts)
5. **Caching**: Increase TTL for stable data

## Backup & Recovery

### Database Backups

Supabase provides:
- Automatic backups every 24 hours
- Manual backup options
- Point-in-time recovery

### Code Recovery

- GitHub repository as primary backup
- Vercel deployment history available
- Use `git` for version control

## Support Resources

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- OpenRouter Docs: https://openrouter.ai/docs

## Production Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Authentication tested end-to-end
- [ ] API routes tested
- [ ] Performance optimized
- [ ] Error handling verified
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Security checklist passed

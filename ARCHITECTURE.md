# Nova AI Companion - System Architecture

## Overview

Nova AI Companion is a production-grade AI chatbot application with a sophisticated backend system designed for reliability, security, and performance. The system is built with a clear separation of concerns and follows best practices for scalability.

```
┌─────────────────────────────────────────────────────────────────┐
│                      React Frontend                             │
│                    (Chat Interface)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                    HTTP/HTTPS
                          │
        ┌─────────────────▼─────────────────┐
        │      Next.js Server (Vercel)      │
        │   • Request handling              │
        │   • Authentication middleware     │
        │   • API routes                    │
        │   • Server-side rendering         │
        └────────┬──────────────┬───────────┘
                 │              │
        ┌────────▼──────┐  ┌───▼─────────────┐
        │   Supabase    │  │   OpenRouter    │
        │  • Database   │  │   • AI Models   │
        │  • Auth       │  │   • LLM API     │
        │  • Storage    │  │   • Streaming   │
        └───────────────┘  └─────────────────┘
```

## Core Components

### 1. **Authentication System** (`lib/supabase/auth.ts`)
- Email-based authentication
- Session management with HTTP-only cookies
- Middleware-based protection
- User profile auto-creation

### 2. **Database Layer** (`lib/database/queries.ts`)
- Centralized query operations
- Type-safe database access
- Transaction support
- Error handling and retries

### 3. **AI Memory System** (`lib/ai/memory-system.ts`)
- Memory extraction from conversations
- 5 memory types (interests, goals, emotions, preferences, context)
- Importance scoring (0-10)
- Memory-aware prompt injection

### 4. **Caching System** (`lib/cache/query-cache.ts`)
- In-memory cache with TTL
- Scope-based invalidation
- Request deduplication
- Automatic cleanup

### 5. **Performance Layer** (`lib/performance/`)
- Lazy loading utilities
- Request deduplication
- Intersection Observer hooks
- Streaming response handling

### 6. **Error Handling** (`lib/errors/`)
- Custom error classes
- Automatic retries with exponential backoff
- User-friendly error messages
- Comprehensive error logging

## Data Flow

### Chat Message Flow
```
User Input
    ↓
Validation
    ↓
Cache Check
    ↓
Send to OpenRouter
    ↓
Stream Response
    ↓
Extract Memories
    ↓
Save to Database
    ↓
Update UI
```

### Memory Extraction Flow
```
User/Assistant Message
    ↓
Analyze Content
    ↓
Extract Memories
    ↓
Score Importance
    ↓
Save to ai_memories
    ↓
Available for Next Prompt
```

## Database Schema

### Key Tables

**profiles** (User Profiles)
- id (PK, FK to auth.users)
- created_at, updated_at
- bio, avatar_url
- RLS: Users can only read/write own profile

**chat_sessions** (Conversations)
- id (PK)
- user_id (FK)
- title
- created_at, updated_at
- RLS: Users can only access own sessions

**messages** (Chat Messages)
- id (PK)
- session_id (FK)
- content
- role (user/assistant/system)
- created_at
- RLS: Users can only access messages in their sessions

**ai_memories** (Extracted Memories)
- id (PK)
- user_id (FK)
- session_id (FK)
- type (interest/goal/emotion/preference/context)
- content
- importance (0-10)
- created_at
- RLS: Users can only read/write own memories

**user_settings** (User Preferences)
- id (PK, FK to profiles)
- theme
- ai_personality
- voice_enabled
- notifications_enabled
- updated_at
- RLS: Users can only read/write own settings

## API Routes

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/session` - Check session status

### Profile Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/profile/avatar` - Get avatar URL

### Chat Management
- `GET /api/chat/sessions` - List user sessions
- `POST /api/chat/sessions` - Create new session
- `GET /api/chat/sessions/[id]` - Get session details
- `DELETE /api/chat/sessions/[id]` - Delete session

### Messages
- `GET /api/chat/sessions/[id]/messages` - Get session messages
- `POST /api/chat/sessions/[id]/messages` - Send message
- `GET /api/chat/sessions/[id]/messages/[msgId]` - Get specific message

### Memories
- `GET /api/memories` - Get user memories
- `GET /api/memories?type=interest` - Get memories by type
- `POST /api/memories` - Create memory
- `DELETE /api/memories/[id]` - Delete memory

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

## Security Architecture

### Layer 1: Network Security
- HTTPS/TLS encryption (automatic on Vercel)
- CORS configured for specific origins
- Rate limiting (optional)

### Layer 2: Authentication
- Email verification
- Secure password hashing (bcrypt)
- Session-based authentication
- HTTP-only secure cookies

### Layer 3: API Security
- Server-side input validation
- Type checking with TypeScript
- Automatic parameterized queries
- CSRF protection (cookies)

### Layer 4: Database Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Service role key for admin operations
- Audit logging available

### Layer 5: Application Security
- No sensitive data in logs
- No API keys in frontend code
- Environment variables for secrets
- Error messages don't expose internals

## Performance Architecture

### Frontend Performance
- Server-side rendering for fast initial load
- Lazy loading for chat history
- Request deduplication
- Streaming responses for AI output
- Optimized Tailwind CSS

### Backend Performance
- In-memory query caching
- Request deduplication
- Database connection pooling
- Efficient indexing
- Query optimization

### Infrastructure Performance
- Serverless (Vercel) for automatic scaling
- CDN for static assets
- Edge middleware for fast routing
- Automatic caching headers

### Targets
- Page load: < 2 seconds
- Chat response: < 1 second
- Database query: < 100ms
- Memory extraction: < 2 seconds

## Error Handling Strategy

### Error Prevention
- Input validation at every layer
- Type checking with TypeScript
- RLS policies prevent unauthorized access

### Error Detection
- Try-catch blocks for all async operations
- Centralized error logging
- User-friendly error messages

### Error Recovery
- Automatic retries with exponential backoff
- Fallback values when possible
- Clear error messages for troubleshooting
- Rollback support for transactions

### Error Classes
```
AppError (base)
├── AuthError (Authentication failures)
├── DatabaseError (Database operation failures)
├── ValidationError (Input validation failures)
├── NotFoundError (Resource not found)
├── RateLimitError (Rate limit exceeded)
└── AIError (AI provider failures)
```

## Deployment Architecture

### Local Development
```
npm run dev
├── Next.js dev server on port 3000
├── Hot Module Replacement enabled
├── .env.local loaded automatically
└── Console logs in browser & terminal
```

### Production (Vercel)
```
git push origin main
├── GitHub webhook triggers build
├── npm run build
├── Build uploaded to Vercel
├── Automatic HTTPS provisioning
├── Global CDN distribution
└── Zero-downtime deployment
```

### Database (Supabase)
```
PostgreSQL Database
├── Real-time subscriptions
├── Automatic backups
├── Point-in-time recovery
├── Monitoring & alerts
└── Connection pooling
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API design (Vercel handles auto-scaling)
- Database connection pooling
- No session storage on servers

### Vertical Scaling
- Caching layer reduces database load
- Request deduplication reduces API calls
- Lazy loading reduces initial payload

### Future Enhancements
- Add Redis for distributed caching
- Implement job queues for memory extraction
- Add search capabilities with Elasticsearch
- Multi-region deployment with Vercel
- Real-time updates with WebSockets

## Monitoring & Observability

### Available Metrics
- Vercel Analytics (automatic)
- Supabase dashboard metrics
- Error logs and tracing
- Performance timings

### Recommended Additions
- Sentry for error tracking
- DataDog or similar for APM
- Custom dashboards in Supabase
- Alert rules for critical errors

## Development Workflow

1. **Local Development**
   - Clone repository
   - `npm install`
   - Set up `.env.local`
   - `npm run dev`

2. **Making Changes**
   - Create feature branch
   - Make code changes
   - Test locally
   - Commit with clear messages

3. **Code Review**
   - Create pull request
   - GitHub checks run automatically
   - Code review process
   - Merge when approved

4. **Deployment**
   - Changes automatically deployed to preview
   - Merge to main for production
   - Automatic Vercel deployment
   - Production checks pass

## Repository Structure

```
nova-ai-companion/
├── app/
│   ├── api/              # API route handlers
│   ├── auth/             # Auth pages
│   ├── chat/             # Chat interface
│   ├── layout.tsx        # Root layout
│   └── middleware.ts     # Request middleware
├── lib/
│   ├── supabase/         # Supabase configuration
│   ├── database/         # Database queries
│   ├── ai/               # AI memory system
│   ├── actions/          # Server actions
│   ├── cache/            # Caching utilities
│   ├── errors/           # Error handling
│   └── types/            # TypeScript types
├── components/           # React components
├── supabase/
│   └── migrations/       # Database migrations
├── public/               # Static assets
├── .env.example          # Environment template
├── PRODUCTION_CONFIG.md  # Production setup
├── DEPLOYMENT_CHECKLIST.md  # Deployment guide
└── README_BACKEND.md     # Backend documentation
```

## Next Steps for Production

1. **Configure Supabase**
   - Create project
   - Run migrations
   - Set up authentication
   - Enable RLS policies

2. **Configure OpenRouter**
   - Create account
   - Generate API key
   - Select AI model
   - Set rate limits

3. **Deploy to Vercel**
   - Connect GitHub repository
   - Configure environment variables
   - Deploy main branch
   - Verify deployment

4. **Set Up Monitoring**
   - Enable Vercel Analytics
   - Configure error tracking
   - Set up alerts
   - Create dashboards

5. **Post-Deployment**
   - Test all features
   - Monitor error logs
   - Collect user feedback
   - Plan future enhancements

See [PRODUCTION_CONFIG.md](PRODUCTION_CONFIG.md) and [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed instructions.

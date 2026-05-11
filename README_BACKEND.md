# Nova AI Companion - Complete Backend System

A production-grade AI companion application built with Next.js, Supabase, and OpenRouter. Features persistent chat history, advanced AI memory system, secure authentication, and optimized performance.

## Architecture Overview

### Frontend
- Next.js 15 with App Router
- React for UI components
- TailwindCSS for styling
- Real-time chat interface with streaming responses

### Backend
- Supabase PostgreSQL database with Row Level Security
- Secure authentication with session management
- RESTful API routes for all operations
- Server-side actions for sensitive operations

### AI Integration
- OpenRouter for LLM inference
- Advanced memory extraction from conversations
- Memory injection into prompts for personalization
- Support for multiple AI models

### Deployment
- Vercel for serverless hosting
- Automatic CI/CD on git push
- Production-grade monitoring and logging

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenRouter account

### Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd nova-ai-companion
npm install
```

2. **Configure environment variables**
```bash
cp .env.example .env.local
# Fill in your credentials:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENROUTER_API_KEY
```

3. **Set up database**
```bash
# Run migrations in Supabase dashboard
# Or use CLI: supabase db push
```

4. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
nova-ai-companion/
├── app/
│   ├── api/                    # API routes
│   │   ├── profile/           # User profile endpoints
│   │   ├── chat/              # Chat and messages
│   │   ├── memories/          # Memory management
│   │   └── settings/          # User settings
│   ├── auth/                  # Auth pages (login, register)
│   ├── chat/                  # Main chat interface
│   ├── layout.tsx             # Root layout
│   └── middleware.ts          # Request middleware
│
├── lib/
│   ├── supabase/             # Supabase clients and config
│   ├── database/
│   │   └── queries.ts        # Centralized DB operations
│   ├── actions/              # Server actions
│   ├── ai/
│   │   └── memory-system.ts # AI memory extraction/retrieval
│   ├── errors/               # Error handling utilities
│   ├── cache/                # Query caching system
│   ├── performance/          # Performance hooks
│   └── types/
│       └── schema.types.ts   # TypeScript types
│
├── components/
│   ├── chat-interface.tsx    # Main chat component
│   └── ...other components
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Database schema
│
├── public/                   # Static assets
│
├── .env.example              # Environment variables template
├── PRODUCTION_CONFIG.md      # Production setup guide
├── DEPLOYMENT_CHECKLIST.md   # Deployment checklist
└── package.json
```

## Database Schema

### Tables

**profiles**
- User profile information
- Linked to Supabase auth.users via id (foreign key)

**chat_sessions**
- Chat conversations
- Stores session metadata and last message

**messages**
- Individual messages in conversations
- Contains role (user/assistant/system) and content

**ai_memories**
- Extracted memories from conversations
- Types: interest, goal, emotion, preference, context
- Importance scoring (0-10) for ranking

**user_settings**
- User preferences
- Theme, AI personality, voice/notification settings

All tables have:
- Row Level Security (RLS) policies
- Optimized indexes
- Cascading deletes for referential integrity

## Authentication Flow

1. User signs up/logs in on auth page
2. Supabase validates credentials
3. Session cookies set in response
4. Client waits for session establishment
5. Middleware authenticates requests
6. Authenticated users can access /chat
7. Unauthenticated users redirected to /auth/login

## API Routes

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Chat Sessions
- `GET /api/chat/sessions` - List all sessions
- `POST /api/chat/sessions` - Create new session

### Messages
- `GET /api/chat/sessions/[id]/messages` - Get messages for session
- `POST /api/chat/sessions/[id]/messages` - Save message

### Memories
- `GET /api/memories` - Retrieve memories
- `POST /api/memories` - Create memory

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

## AI Memory System

### Memory Extraction
Automatically extracts from user messages:
- **Interests**: "I like/love/enjoy..."
- **Goals**: "I want to/planning to..."
- **Emotions**: Emotional state indicators
- **Preferences**: "I prefer/don't like..."
- **Context**: General context about user

### Memory Retrieval
- Fetches by importance score (0-10)
- Returns top N memories by type
- Formats for prompt injection

### Memory Injection
Memories injected into system prompt to:
- Personalize responses
- Show conversation continuity
- Adapt AI personality to user
- Improve context understanding

## Performance Optimizations

### Query Caching
- In-memory cache with TTL (2-20 minutes by resource type)
- Automatic expiration and cleanup
- Scope-based invalidation

### Request Deduplication
- Prevents duplicate concurrent API calls
- Reuses in-flight requests
- Reduces server load

### Lazy Loading
- Intersection Observer for off-screen content
- Deferred rendering for non-critical UI
- Efficient memory usage

### Middleware Optimization
- Fast path routing for public routes
- Route categorization for efficient checks
- Early return patterns

## Error Handling

### Custom Error Classes
- `AppError`: Base error class
- `AuthError`: Authentication failures
- `DatabaseError`: Database operation failures
- `ValidationError`: Input validation failures
- `NotFoundError`: Resource not found
- `RateLimitError`: Rate limit exceeded

### Error Features
- Automatic retry with exponential backoff
- Graceful fallbacks
- User-friendly error messages
- Comprehensive logging

## Security Features

### Authentication
- Secure password hashing (bcrypt)
- Session-based authentication
- HTTP-only secure cookies
- CORS protection

### Database Security
- Row Level Security (RLS) on all tables
- Users can only access their own data
- Parameterized queries (Supabase handles)
- No SQL injection vulnerabilities

### API Security
- Server-side validation
- Rate limiting (implement if needed)
- CORS configured
- Environment variables for secrets

## Deployment

### To Vercel
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Configure build settings (Next.js defaults work)
4. Deploy with `git push` or manual deploy

### To Custom Server
1. Build: `npm run build`
2. Start: `npm start`
3. Configure environment variables
4. Use process manager (PM2, systemd, etc.)

See [PRODUCTION_CONFIG.md](PRODUCTION_CONFIG.md) for detailed setup.

## Monitoring

### Available Metrics
- Vercel Analytics (automatic)
- Database query performance (Supabase dashboard)
- Auth events (Supabase dashboard)
- Error logging (optional: Sentry)

### Performance Targets
- Page load: < 2 seconds
- Chat response: < 1 second
- Database query: < 100ms
- Middleware: < 50ms

## Contributing

1. Create feature branch
2. Make changes
3. Run tests and build
4. Submit pull request

## Documentation

- [Production Configuration Guide](PRODUCTION_CONFIG.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Database Schema](supabase/migrations/001_initial_schema.sql)
- [API Documentation](lib/database/queries.ts)

## Support

- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Next.js: https://nextjs.org/docs
- OpenRouter: https://openrouter.ai/docs

## License

MIT

## Project Status

✅ Phase 1-9 Complete
- SQL Schema & RLS Policies
- TypeScript Types
- Database Utilities
- AI Memory System
- Error Handling Framework
- API Routes
- Authentication System
- Performance Optimization
- Production Configuration

🚀 Ready for Production Deployment

# Nova AI Companion 🤖

A premium, production-ready ChatGPT-style AI companion built with Next.js, Supabase, and OpenRouter. Features real-time streaming, file uploads, persistent memory, and a stunning futuristic UI.

[![Vercel Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-org%2Fnova-ai-companion&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,OPENROUTER_API_KEY)

## ✨ Features

- 🎨 **Beautiful ChatGPT-like Interface** - Glassmorphism design with Framer Motion animations
- 💬 **Real-time Streaming** - See AI responses appear instantly as they're generated
- 📁 **File Uploads** - Drag-and-drop images, PDFs, and documents
- 🧠 **AI Memory System** - Nova remembers your interests and preferences
- ⚙️ **Settings & Customization** - Theme, personality, notifications, and more
- 🔐 **Secure Authentication** - Supabase Auth with JWT sessions
- 📱 **Mobile Responsive** - Beautiful on desktop, tablet, and mobile
- 💾 **Persistent History** - All chats saved automatically
- ⚡ **Production Optimized** - Fast, scalable, deployment-ready
- 📊 **Full-Stack Ready** - Backend APIs for all features

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (free)
- OpenRouter API key

### 1. Clone Repository
```bash
git clone https://github.com/your-org/nova-ai-companion.git
cd nova-ai-companion
npm install
```

### 2. Set Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENROUTER_API_KEY=sk-or-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test the App
1. Go to `/auth/register` and create an account
2. Should auto-redirect to `/chat`
3. Start chatting and upload files
4. Check settings for memory and preferences

## 📚 Documentation

- **[STATUS_AND_DEPLOYMENT.md](./STATUS_AND_DEPLOYMENT.md)** - Project status and quick deployment guide
- **[FINAL_IMPLEMENTATION_GUIDE.md](./FINAL_IMPLEMENTATION_GUIDE.md)** - Complete feature list and API docs
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design and data flow
- **[PRODUCTION_CONFIG.md](./PRODUCTION_CONFIG.md)** - Production deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment

## 🏗️ Architecture

```
┌──────────────────────────────────────┐
│         Frontend (Next.js)           │
│  ├─ Chat Interface                   │
│  ├─ File Uploads                     │
│  ├─ Settings Modal                   │
│  └─ Authentication Pages             │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│         Backend API Routes           │
│  ├─ /api/chat (Streaming)            │
│  ├─ /api/upload (Files)              │
│  ├─ /api/profile (User)              │
│  ├─ /api/memories (AI Memory)        │
│  └─ /api/settings                    │
└──────────────────┬───────────────────┘
                   │
┌──────────────────▼───────────────────┐
│    Supabase (Auth, DB, Storage)      │
│  ├─ PostgreSQL (5 Tables)            │
│  ├─ Auth & Sessions                  │
│  ├─ File Storage                     │
│  └─ RLS Policies                     │
└──────────────────────────────────────┘
```

## 🔧 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19 | App framework |
| Styling | Tailwind CSS | Component styling |
| Animation | Framer Motion | UI animations |
| UI Components | shadcn/ui | Pre-built components |
| Auth | Supabase Auth | User authentication |
| Database | PostgreSQL (Supabase) | Data storage |
| Storage | Supabase Storage | File uploads |
| AI | OpenRouter | LLM access |
| Deployment | Vercel | Serverless hosting |

## 📋 API Routes

### Chat Streaming
```bash
POST /api/chat
Content-Type: application/json

{
  "messages": [{"role": "user", "content": "..."}],
  "memories": ["..."],
  "userName": "User"
}
```
Returns: Server-Sent Events (SSE) stream

### File Upload
```bash
POST /api/upload
Content-Type: multipart/form-data

files: [file1, file2, ...]
```
Returns: File metadata and URLs

### User Profile
```bash
GET /api/profile
PUT /api/profile
```

### Chat Sessions
```bash
GET /api/chat/sessions
POST /api/chat/sessions
```

### Messages
```bash
GET /api/chat/sessions/[id]/messages
POST /api/chat/sessions/[id]/messages
```

### Memory Management
```bash
GET /api/memories
POST /api/memories
```

### User Settings
```bash
GET /api/settings
PUT /api/settings
```

## 🗂️ Project Structure

```
nova-ai-companion/
├── app/
│   ├── api/                 # Backend API routes (11 total)
│   ├── auth/                # Authentication pages
│   ├── chat/                # Main chat interface
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── chat-interface.tsx   # Main chat
│   ├── chat-sidebar.tsx     # Sidebar
│   ├── chat-input.tsx       # Input with uploads
│   ├── settings-modal.tsx   # Settings
│   └── ui/                  # shadcn components
├── lib/                     # Utilities
│   ├── actions/             # Server actions
│   ├── database/            # DB queries
│   ├── ai/                  # Memory system
│   ├── errors/              # Error handling
│   ├── types/               # TypeScript types
│   └── supabase/            # Supabase config
├── supabase/
│   └── migrations/          # Database schema
└── Documentation files
    ├── STATUS_AND_DEPLOYMENT.md
    ├── FINAL_IMPLEMENTATION_GUIDE.md
    ├── ARCHITECTURE.md
    ├── PRODUCTION_CONFIG.md
    └── DEPLOYMENT_CHECKLIST.md
```

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select GitHub repo
   - Click "Deploy"

3. **Add Environment Variables**
   - In Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.example`
   - Redeploy

4. **Configure Supabase**
   - Go to Supabase → Authentication → URL Configuration
   - Set Site URL: `https://your-vercel-domain.com`
   - Set Redirect URLs: `https://your-vercel-domain.com/auth/callback`

5. **Done!** Your app is live 🎉

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for detailed steps.

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Row Level Security (RLS) policies
- ✅ HTTPS/TLS encryption
- ✅ Secure session cookies
- ✅ Input validation & sanitization
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ CSRF tokens

## ⚡ Performance

- **Initial Load**: ~230KB JavaScript
- **Streaming**: Real-time responses
- **Caching**: Query-level caching
- **Database**: Optimized indexes
- **Middleware**: <50ms route auth
- **Mobile**: Mobile-first responsive

## 🐛 Troubleshooting

### Authentication Loop
**Problem**: Redirect between login and chat  
**Solution**: Check Supabase auth URLs. Verify `.env.local` is correct.

### File Upload Fails
**Problem**: Upload doesn't work  
**Solution**: Check storage bucket permissions. Verify 10MB file size limit.

### No AI Responses
**Problem**: Chat returns empty  
**Solution**: Check OpenRouter API key. Verify network connection.

### Sessions Don't Persist
**Problem**: Page refresh loses session  
**Solution**: Check cookie settings. Verify session storage in Supabase.

## 📖 Documentation Roadmap

Start with these in order:
1. **STATUS_AND_DEPLOYMENT.md** - What's working, quick start
2. **FINAL_IMPLEMENTATION_GUIDE.md** - Feature list and usage
3. **ARCHITECTURE.md** - How it all works
4. **PRODUCTION_CONFIG.md** - Production setup
5. **DEPLOYMENT_CHECKLIST.md** - Deployment steps

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

## 🎯 Roadmap

- [ ] Voice input/output
- [ ] Conversation export (PDF)
- [ ] Share conversations
- [ ] Rate limiting
- [ ] Analytics dashboard
- [ ] Subscription tiers
- [ ] Team collaboration
- [ ] WebSocket real-time sync
- [ ] Mobile native app
- [ ] Conversation branching

## 🙋 Support

- 📖 [Check Documentation](./STATUS_AND_DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/your-org/nova-ai-companion/issues)
- 💬 [Join Discussion](https://github.com/your-org/nova-ai-companion/discussions)

## ⭐ Show Your Support

If you find this project helpful, please star it on GitHub! ⭐

---

**Built with ❤️ for AI enthusiasts and developers**

Ready to deploy? Start with [STATUS_AND_DEPLOYMENT.md](./STATUS_AND_DEPLOYMENT.md)

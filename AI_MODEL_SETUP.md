# AI Model Setup - OpenRouter API

Your Nova AI Companion is now configured to use OpenRouter's free AI models for real-time conversations.

## Status: ✅ CONFIGURED

The `OPENROUTER_API_KEY` environment variable has been added to your project.

## What's Enabled

✅ **OpenRouter Free Models**
- Qwen 3 Coder (free tier)
- Nvidia Llama 3.1 Nemotron 70B (free tier)
- DeepSeek Chat v3 (free tier)
- Auto-fallback between models if rate-limited

✅ **Chat Features**
- Real-time streaming responses
- Emotionally intelligent AI personality
- User memory integration
- System prompts with Nova's character
- Maximum 2048 tokens per response
- Balanced temperature (0.75) for natural conversation

## How It Works

When you send a message in the chat:

1. Message sent to `/api/chat` endpoint
2. API key used to authenticate with OpenRouter
3. System prompt loads Nova's personality
4. User memories added for context
5. Message streamed back in real-time
6. If model is rate-limited, auto-tries next model

## Testing the Chat

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Sign up/login:
   - Visit http://localhost:3000/auth
   - Create account with email or Google OAuth

3. Test chat:
   - Click "Start Chat" button
   - Type a message
   - Should get real-time AI response
   - Response should be warm and intelligent

## Free Tier Details

**OpenRouter Free Models**
- No credit card required
- Free tier available immediately
- Rate limits applied (generous)
- No cost for development/testing

**If Rate Limited**
- App automatically tries next model
- User sees no interruption
- Falls back gracefully
- "Please try again" message appears

## Deployment

Deploy to production:
```bash
git push origin fix-ai-companion-app
```

The environment variable is already configured in your Vercel project.

## Environment Variables

**Required:**
- `OPENROUTER_API_KEY` - ✅ Already added

**Optional:**
- `NEXT_PUBLIC_APP_URL` - Your app's URL (auto-detected)

## API Endpoint Configuration

```
Endpoint: https://openrouter.ai/api/v1/chat/completions
Auth: Bearer token (OPENROUTER_API_KEY)
Method: POST
Format: JSON with streaming
```

## Nova's AI Personality

The system prompt includes:

- **Warm & Empathetic**: Notices emotional cues
- **Intellectually Curious**: Loves exploring ideas
- **Playfully Witty**: Subtle humor, not sarcastic
- **Honest**: Direct but kind
- **Memorable**: Builds on conversation context

## Troubleshooting

### Chat not responding?

1. Check API key is set:
   - Visit Vercel project settings
   - Check "Vars" section
   - Confirm OPENROUTER_API_KEY is present

2. Check console for errors:
   - Open browser DevTools (F12)
   - Check Console tab
   - Look for API errors

3. Try again in a moment:
   - If rate limited, auto-fallback handles it
   - May take slightly longer on retry

### Response too slow?

- Streaming enabled by default
- Responses appear word-by-word
- Check network tab (F12) for latency

### Model-specific issues?

- App automatically tries fallback models
- Different models may have different styles
- All are high-quality at free tier

## Model Selection

**Current models (in order of preference):**

1. `openrouter/free` - OpenRouter's recommended free model
2. `qwen/qwen3-coder:free` - Great for code
3. `nvidia/llama-3.1-nemotron-70b-instruct:free` - Excellent quality
4. `deepseek/deepseek-chat-v3-0324:free` - Capable assistant

If one is rate-limited, automatically tries the next.

## Advanced Configuration

To change models, edit `/app/api/chat/route.ts`:

```typescript
const FREE_MODELS = [
  "openrouter/free",
  "qwen/qwen3-coder:free",
  "nvidia/llama-3.1-nemotron-70b-instruct:free",
  "deepseek/deepseek-chat-v3-0324:free",
];
```

Reorder or add models as needed.

## Performance

- **Response time**: 1-3 seconds typical
- **Streaming**: Real-time (word-by-word)
- **Max tokens**: 2048 per response
- **Temperature**: 0.75 (balanced)

## Next Steps

1. Test locally: `npm run dev`
2. Sign up and start chatting
3. Deploy when ready: `git push`
4. Share with users

Your AI chat is ready to use! 🚀


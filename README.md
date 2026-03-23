# Cloudflare AI Chat Agent Template

A production-ready full-stack AI chat application built on Cloudflare Workers using the Agents SDK. Features multi-session conversations, streaming responses, tool calling (weather, web search, MCP integration), model switching, and a modern React UI with Tailwind CSS and shadcn/ui.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/achanda/sketchmyspace-ai-zillow-redesigner)

## ✨ Key Features

- **Multi-Session Chat**: Persistent conversations with session management, titles, and activity tracking.
- **AI-Powered**: Integrated with Cloudflare AI Gateway supporting Gemini models (Flash, Pro).
- **Tool Calling**: Built-in tools for weather, web search (SerpAPI), URL fetching, and extensible MCP (Model Context Protocol) tools.
- **Streaming Responses**: Real-time streaming for natural chat experience.
- **Modern UI**: Responsive React app with dark/light themes, sidebar, sessions list, and smooth animations.
- **Durable Objects**: State persistence for chats and sessions using Cloudflare Agents.
- **Type-Safe**: Full TypeScript with Workers types and Zod validation.
- **Production-Ready**: CORS, error handling, logging, health checks, and client error reporting.

## 🛠️ Tech Stack

- **Backend**: Cloudflare Workers, Hono, Agents SDK, OpenAI SDK, Durable Objects.
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, React Router.
- **AI/ML**: Cloudflare AI Gateway, Gemini models, SerpAPI, MCP SDK.
- **Utils**: Immer, Framer Motion, Lucide Icons, Sonner (toasts).
- **Dev Tools**: Bun, Wrangler, ESLint, TypeScript.

## 🚀 Quick Start

1. **Clone & Install**:
   ```bash
   git clone <your-repo>
   cd <project>
   bun install
   ```

2. **Configure Environment** (see [Environment Variables](#-environment-variables)):
   Update `wrangler.jsonc` with your keys.

3. **Run Locally**:
   ```bash
   bun dev
   ```
   Open `http://localhost:3000` (or `${PORT:-3000}`).

4. **Deploy**:
   ```bash
   bun deploy
   ```

## 📋 Installation

### Prerequisites
- [Bun](https://bun.sh/) v1.1+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Cloudflare Account with Workers enabled.
- Cloudflare AI Gateway (for `@cloudflare/ai` proxy to OpenAI-compatible models).

### Steps
1. Fork/clone the repo.
2. ```bash
   bun install
   ```
3. Generate types: ```bash
   bun cf-typegen
   ```
4. Configure secrets in `wrangler.jsonc`.

## 🧪 Development

- **Local Dev**: `bun dev` (Workers + Vite dev server).
- **Type Generation**: `bun cf-typegen` (updates `worker/index.ts` types).
- **Build**: `bun build` (produces `dist/`).
- **Preview**: `bun preview`.
- **Lint**: `bun lint`.
- **Hot Reload**: Auto-reloads on file changes.

**File Structure**:
```
├── src/          # React frontend
├── worker/       # Cloudflare Worker backend + Agents
├── tailwind.config.js  # Styling
├── wrangler.jsonc     # Deployment config
└── package.json
```

**Extending**:
- Add routes: `worker/userRoutes.ts`.
- Custom tools: `worker/tools.ts`.
- UI components: `src/components/ui/`.
- Chat logic: `worker/chat.ts` or `worker/agent.ts`.

## ☁️ Deployment

Deploy to Cloudflare Workers in one command:

```bash
bun deploy
```

Or use Wrangler directly:
```bash
npx wrangler deploy
```

**Custom Domain**: Update `wrangler.toml` or Dashboard.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/achanda/sketchmyspace-ai-zillow-redesigner)

**Assets SPA**: Static assets served via Workers Sites (SPA fallback).

## 🔧 Environment Variables

Required in `wrangler.jsonc` or Wrangler secrets:

| Variable | Description | Example |
|----------|-------------|---------|
| `CF_AI_BASE_URL` | AI Gateway endpoint | `https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/openai` |
| `CF_AI_API_KEY` | Cloudflare API Token | `your-cf-token` |
| `SERPAPI_KEY` | SerpAPI key (optional, web search) | `your-serpapi-key` |
| `OPENROUTER_API_KEY` | OpenRouter key (optional) | `your-openrouter-key` |

Set secrets:
```bash
wrangler secret put SERPAPI_KEY
```

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List sessions |
| `POST` | `/api/sessions` | Create session |
| `DELETE` | `/api/sessions/:id` | Delete session |
| `GET/POST/DELETE` | `/api/chat/:sessionId/*` | Chat operations (messages, clear, model) |
| `GET` | `/api/health` | Health check |

See `worker/userRoutes.ts` and `worker/agent.ts`.

## 🤝 Contributing

1. Fork & PR.
2. Follow TypeScript + ESLint rules.
3. Add tests for new features.
4. Update README for changes.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.
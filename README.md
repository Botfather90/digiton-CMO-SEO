# 🤖 GravityClaw — AI Agent Orchestrator

> Your autonomous AI operations centre. CMO, CTO, Designer, DevOps — all managed by a single orchestrator that runs heartbeat-driven agent swarms.

**Powered by [Antigravity AI Ultra](https://antigravity.ai) for token-optimized agentic execution.**

Inspired by [Okara.ai](https://okara.ai) — built for teams who want an AI CMO, SEO engine, and full operational swarm without enterprise pricing.

---

## ⚡ One-Click Install

```bash
# 1. Clone
git clone https://github.com/Botfather90/digiton-jarvis.git gravityclaw
cd gravityclaw

# 2. Set up environment
cp env.example .env
# Edit .env with YOUR API keys (see below)

# 3. Install Paperclip orchestrator
cd paperclip && npm install && cd ..

# 4. Start the agent swarm
npm run dev --prefix paperclip
# Dashboard: http://localhost:3100
```

That's it. Open `http://localhost:3100` in your browser.

---

## 🏢 Onboarding — Your Company

When you first launch, the orchestrator will guide you through onboarding:

1. **Enter your company name** and business address
2. **Set your industry** (dental/healthcare, construction, e-commerce, SaaS, etc.)
3. **Configure your team** — choose which agents to activate:
   - 📈 **CMO** — SEO, content, social media, email campaigns
   - 💻 **CTO** — Technical architecture, code reviews, deployments
   - 🎨 **Designer** — UI/UX, brand identity, mockups
   - 🧪 **QA** — Testing, quality assurance, bug tracking
   - 🚀 **DevOps** — CI/CD, infrastructure, monitoring
4. **Connect your services** — fill in `.env` with your API keys
5. The CMO begins its heartbeat cycle automatically — SEO audits, content generation, social scheduling

> [!IMPORTANT]
> The orchestrator ships blank — no pre-loaded company data. You onboard YOUR business, and the AI adapts to YOUR brand, tone, and market.

---

## 🔑 Environment Variables

Copy `env.example` → `.env` and fill in your keys:

```bash
cp env.example .env
```

| Variable | Purpose | Where to get it |
|----------|---------|-----------------|
| `GOOGLE_AI_API_KEY` | Gemini / Nano Banana AI | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GITHUB_PAT` | Repo management, CI/CD | [GitHub Settings → Tokens](https://github.com/settings/tokens) |
| `VERCEL_API_KEY` | Deployment & hosting | [Vercel Settings](https://vercel.com/account/tokens) |
| `OPENROUTER_API_KEY` | Multi-model LLM routing | [OpenRouter](https://openrouter.ai/keys) |
| `FAL_KEY` | Video generation (Veo 3.1) | [fal.ai](https://fal.ai/dashboard/keys) |
| `SUPABASE_ACCESS_TOKEN` | Database | [Supabase](https://supabase.com/dashboard/account/tokens) |
| `N8N_API_KEY` | Workflow automation | Your n8n instance |
| `TELEGRAM_BOT_TOKEN` | Mobile notifications | [@BotFather](https://t.me/botfather) |

> [!CAUTION]
> **Never commit `.env` to git.** It is already in `.gitignore`. Each team member creates their own `.env` locally.

---

## 📁 Project Structure

```
gravityclaw/
├── paperclip/               # Agent orchestrator (Paperclip)
│   ├── server/              # Backend — agent runtime, heartbeats, API
│   ├── packages/            # Shared types, constants, SDK
│   └── package.json
├── agent-skills/            # Custom agent skills
│   ├── money-runner/        # Autonomous freelance bidding agent
│   └── seo-smo-agent/       # SEO/SMO CMO engine (Okara-inspired)
├── .agents/
│   └── workflows/
│       └── jarvis-start.md  # Startup workflow
├── SOUL.md                  # Master AI personality / system prompt
├── CTO-SOUL.md              # CTO agent personality
├── OPENCLAW.md              # Architecture docs
├── prompt.md                # Base prompt template
├── mcp_config.json          # MCP server connections template
├── env.example              # API keys template
└── .gitignore               # Excludes .env, credentials, node_modules
```

---

## 🚀 Running the Agent Swarm

### Local (Recommended)

```bash
cd paperclip && npm run dev
```

Dashboard: `http://localhost:3100`

This runs with **Antigravity AI Ultra** for token-optimized execution — your agents use your own API keys, no external billing.

### Railway (Cloud)

```bash
# Install Railway CLI: https://docs.railway.app/guides/cli
railway login
railway init --name my-company-agents
railway up --detach
```

Set your env vars in Railway dashboard after deploying.

---

## 🔒 Google Workspace Integration (Optional)

For Gmail, Calendar, Drive, Docs, Sheets:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project
3. Enable: Gmail API, Calendar API, Drive API, Docs API, Sheets API
4. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Desktop App)
5. Download `client_secret.json` → move to `~/.google_workspace_mcp/client_secret.json`

---

## 🤖 Agents

| Agent | Role | Heartbeat |
|-------|------|-----------|
| **CEO** | Strategic decisions, project prioritization | On-demand |
| **CMO** | SEO, content marketing, social media, email | Every 3h |
| **CTO** | Architecture, code review, technical decisions | On-demand |
| **Developer** | Code writing, bug fixes, feature implementation | On-demand |
| **Designer** | UI/UX, brand design, mockups | On-demand |
| **QA** | Testing, quality gates, regression checks | Every 6h |
| **DevOps** | CI/CD, infra, monitoring, deployments | Every 4h |

---

## ⚠️ Requirements

- **Node.js** 22+ (`nvm install 22`)
- **pnpm** (`npm install -g pnpm`)
- **Antigravity** or any AI coding assistant (for agentic execution)
- API keys for the services you want to use (see env.example)

---

## 📄 License

Private. Do not distribute without authorization.

**Built with GravityClaw 🦾 — Powered by Antigravity AI Ultra**

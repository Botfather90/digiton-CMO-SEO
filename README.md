# GravityClaw CMO/SEO — Multi-Agent Orchestrator

A multi-agent AI orchestrator for SEO, content marketing, lead generation, and dev operations. Built on a forked [Paperclip](https://github.com/paperclipai/paperclip) orchestration framework with a custom Next.js dashboard.

## What This Is

GravityClaw coordinates 7 autonomous AI agents (CEO, CMO, CTO, Developer, Designer, QA, DevOps) through a unified dashboard. Each agent has specific capabilities:

| Agent | Role | Key Capabilities |
|-------|------|-------------------|
| **CEO** | Strategy & Lead Gen | Money Runner multi-platform scraper, business strategy |
| **CMO** | SEO & Content | Blog generation, keyword tracking, backlink outreach, IndexNow, Lighthouse audits |
| **CTO** | Architecture | Code reviews, technical strategy, deployment management |
| **Developer** | Code & Features | Full-stack dev (React, Next.js, TypeScript, n8n, Flutter) |
| **Designer** | UI/UX & Brand | Premium design, Three.js, GSAP, glassmorphism |
| **QA** | Testing | Quality gates, Lighthouse 90+ enforcement, automated tests |
| **DevOps** | Infrastructure | CI/CD, Vercel/Railway deployments, GitHub Actions |

## What's Working (Live APIs)

The dashboard connects to **real APIs** — not mock data:

- **Lighthouse Audits** → Google PageSpeed Insights API (enter any URL, get real scores)
- **Vercel Apps** → Lists all your Vercel deployments with status
- **GitHub Repos** → Lists all your repos via GitHub API
- **AI Chat** → Gemini-powered conversational agent
- **File Browser** → Browses the local workspace or falls back to GitHub API
- **Activity Logs** → Real GitHub commits and events
- **Skills Inventory** → Scans local skill files or fetches from GitHub
- **Config Status** → Shows which API keys are configured vs missing

## Quickstart

```bash
# 1. Clone
git clone https://github.com/Botfather90/digiton-jarvis.git
cd digiton-jarvis

# 2. Set up the dashboard
cd gravityclaw-ui
cp .env.example .env.local

# 3. Add your API keys to .env.local
#    At minimum you need GOOGLE_AI_API_KEY for chat and Lighthouse
#    Add GITHUB_PAT for file browser, logs, SEO stats
#    Add VERCEL_API_TOKEN for Vercel app listing

# 4. Install & run
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — password is `L3!`

## Environment Variables

Copy `env.example` to `.env` (root) and `gravityclaw-ui/.env.example` to `gravityclaw-ui/.env.local`.

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_AI_API_KEY` | Yes | Gemini chat + PageSpeed Insights |
| `GITHUB_PAT` | Yes | File browser, logs, SEO stats, skills |
| `GITHUB_OWNER` | No | Your GitHub username (default: Botfather90) |
| `GITHUB_REPO` | No | Your agent config repo (default: digiton-jarvis) |
| `WEBSITE_REPO` | No | Website repo for blog publishing (default: Digiton.ai) |
| `TARGET_WEBSITE_URL` | No | URL to audit (default: https://www.digiton.ai) |
| `VERCEL_API_TOKEN` | No | Vercel deployment listing |
| `VERCEL_TEAM_ID` | No | Vercel team scope |
| `OPENROUTER_API_KEY` | No | Multi-model LLM routing |
| `X_API_KEY` | No | Twitter/X social posting |

> **⚠️ SECURITY:** Never commit `.env` files. The `.gitignore` already excludes them. Each developer must create their own `.env.local` with their own keys.

## Architecture

```
GRAVITYCLAW/
├── gravityclaw-ui/          # Next.js 16 dashboard (THE PRODUCT)
│   ├── src/app/
│   │   ├── page.tsx         # Dashboard UI (all tabs)
│   │   └── api/             # 8 real API routes
│   │       ├── agents/      # Agent roster (local SOUL.md or fallback)
│   │       ├── apps/        # Vercel + GitHub integrations
│   │       ├── chat/        # Gemini AI conversational agent
│   │       ├── config/      # Environment config status
│   │       ├── files/       # Workspace file browser
│   │       ├── lighthouse/  # PageSpeed Insights audit
│   │       ├── logs/        # GitHub activity logs
│   │       ├── seo-stats/   # SEO rank + outreach + blog stats
│   │       └── skills/      # Skill inventory scanner
│   └── .env.example
├── paperclip/               # Forked orchestration framework
├── agent-swarm/             # Agent coordination engine
├── agent-skills/            # Custom agent skill definitions
│   ├── money-runner/        # CEO lead gen skill
│   ├── seo-smo-agent/       # CMO SEO/SMO skill
│   └── skills/              # Skill library
├── money-runner/            # CEO lead generation engine (Playwright)
├── SOUL.md                  # Main agent personality config
├── CTO-SOUL.md              # CTO agent config
└── env.example              # Environment variable template
```

## Agent Skills

Skills are stored in `agent-skills/skills/` and follow this structure:

```
skills/
├── super-seo-aso-agent/
│   └── SKILL.md             # Frontmatter + instructions
├── web-design-guidelines/
│   └── SKILL.md
└── ...
```

## License

Private — Digiton Dynamics

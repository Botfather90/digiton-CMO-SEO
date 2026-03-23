# GravityClaw — Control Center

Internal multi-agent dashboard for monitoring deployments, SEO performance, Lighthouse audits, and AI agent coordination.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/Botfather90/gravityclaw-control-center.git
cd gravityclaw-control-center

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Run
npm run dev
# Open http://localhost:3000
# Password: L3!
```

## Required API Keys

| Key | Where to get it | What it powers |
|-----|----------------|----------------|
| `GITHUB_PAT` | [GitHub Settings → Developer → PAT](https://github.com/settings/tokens) | Files, Logs, Skills, SEO stats |
| `VERCEL_API_TOKEN` | [Vercel Settings → Tokens](https://vercel.com/account/tokens) | Apps tab (deployment monitoring) |
| `GOOGLE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) | Chat (AI assistant), Lighthouse audits, SEO intelligence |

## Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | Active agents, Vercel apps, Lighthouse scores, SEO intelligence, top keywords |
| **Apps** | Vercel deployments + GitHub repos with search & filtering |
| **Agents** | AI agent roster — JARVIS, CMO, CTO, Developer, Designer, QA, DevOps |
| **Skills** | Loaded skills with privacy audit scores |
| **Files** | Browse workspace files (local or GitHub repo) |
| **Logs** | Activity logs — commits, events, SEO outreach |
| **Config** | Environment variable status — which APIs are connected |
| **Chat** | AI assistant powered by Gemini |

## Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Auth**: Cookie-based password gate (`gc-auth`)
- **APIs**: GitHub, Vercel, Google AI (Gemini), PageSpeed Insights
- **Styling**: Tailwind CSS 4 + custom dark theme

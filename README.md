# JARVIS — Digiton Dynamics AI Operations Agent

Private repository for the JARVIS autonomous AI agent configuration, running on OpenClaw + Google Antigravity.

## Quick Start

1. Clone this repo
2. Copy `.env.example` to `.env` and fill in all API keys
3. Copy `mcp_config.json` to your Antigravity MCP config location:
   - **Antigravity:** Agent Session → `...` → MCP Servers → Manage MCP Servers → View raw config → paste contents
   - **OpenClaw:** `~/.openclaw/mcp_config.json`
4. Set up Google Workspace OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create/select a project
   - Enable: Gmail API, Calendar API, Drive API, Docs API, Sheets API, Slides API
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID (Desktop App)
   - Download `client_secret.json` → move to `~/.google_workspace_mcp/client_secret.json`
5. Load `SOUL.md` as the system prompt / agent personality

## File Structure

```
jarvis-openclaw/
├── SOUL.md              # Master LLM system prompt
├── mcp_config.json      # MCP server connections template
├── .env.example         # Required API keys template
├── .gitignore           # Security: excludes .env and credentials
├── skills/              # Custom Digiton skills (auto-populated)
└── README.md
```

## Connected Services

| Service | Purpose | Config |
|---------|---------|--------|
| Google Workspace | Gmail, Calendar, Drive, Docs | OAuth 2.0 via MCP |
| GitHub | Repo management, CI/CD | Fine-grained PAT |
| Vercel | Deployment & hosting | API Key via MCP |
| Nano Banana / Gemini | Image generation | Google AI API Key |
| Flow / Veo 3.1 | Video generation | Google AI / fal.ai |
| n8n | Workflow automation | HTTP MCP endpoint |
| OpenRouter | Multi-model LLM routing | API Key |
| Telegram | Mobile interface (V2) | Bot Token |
| Supabase | Database | Access Token via MCP |

## Security Notes

- All secrets in `.env` — never hardcode
- `.gitignore` excludes all credential files
- Google OAuth tokens stored at `~/.google_workspace_mcp/`
- Review all ClawHub skills before installing (see ClawHavoc advisory)
- Keep active MCP tool count under 25 for Antigravity stability

## Digiton Dynamics OÜ

**Registry Code:** 17385234 (Estonia)
**Web:** www.digiton.ai
**Contact:** contact@digiton.ai

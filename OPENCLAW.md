# 🦞 OpenClaw — Architecture & Integration Reference

> **OpenClaw** is a local-first personal AI assistant with a multi-channel inbox, multi-agent routing, voice/canvas capabilities, and skills system. This doc covers how it integrates with GRAVITYCLAW.

---

## How It Works

```
WhatsApp / Telegram / Slack / Discord / Signal / iMessage / WebChat / ...
      │
      ▼
┌─────────────────────────────────┐
│          Gateway                │
│     (WS control plane)         │
│   ws://127.0.0.1:18789         │
└──────────┬──────────────────────┘
           │
           ├── Pi agent (RPC)       ← LLM calls via model config
           ├── CLI (openclaw ...)   ← terminal commands
           ├── WebChat UI           ← browser-based chat
           ├── macOS app            ← menu bar companion
           └── iOS / Android nodes  ← mobile companions
```

**Gateway** is the single control plane for sessions, channels, tools, events, cron, and webhooks. Everything connects through it.

---

## Key Concepts

| Concept | Description |
|---|---|
| **Gateway** | WS control plane at `ws://127.0.0.1:18789`. Manages sessions, channels, tools, events. |
| **Workspace** | `~/.openclaw/workspace` — agent files, skills, prompt injections. |
| **Config** | `~/.openclaw/openclaw.json` — model selection, channel config, defaults. |
| **Channels** | WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, IRC, Teams, Matrix, WebChat, + more. |
| **Skills** | `~/.openclaw/workspace/skills/<name>/SKILL.md` — bundled, managed, or workspace-level. |
| **Prompt Files** | `SOUL.md`, `AGENTS.md`, `TOOLS.md` — injected into agent context. |
| **Sessions** | `main` for direct chats, isolated sessions for groups. |
| **Canvas** | Agent-driven visual workspace (A2UI) on macOS. |
| **Voice** | Wake words (macOS/iOS) + continuous talk mode (Android). |
| **Sandbox** | Docker isolation for non-main sessions via `agents.defaults.sandbox.mode: "non-main"`. |

---

## Installation

```bash
# Requires Node ≥ 22
npm install -g openclaw@latest

# Run the onboarding wizard (recommended)
openclaw onboard --install-daemon

# Health check
openclaw doctor
```

---

## Configuration (`~/.openclaw/openclaw.json`)

```jsonc
{
  "agent": {
    "model": "anthropic/claude-opus-4-6"  // or google/gemini-2.5-pro, etc.
  },
  "channels": {
    "telegram": {
      "botToken": "${TELEGRAM_BOT_TOKEN}",
      "dmPolicy": "pairing"              // "pairing" | "open"
    }
  },
  "gateway": {
    "port": 18789,
    "tailscale": {
      "mode": "off"                       // "off" | "serve" | "funnel"
    }
  }
}
```

---

## GRAVITYCLAW Integration Map

| GRAVITYCLAW Component | OpenClaw Equivalent | Status |
|---|---|---|
| `SOUL.md` (system prompt) | `~/.openclaw/workspace/SOUL.md` | → Copy or symlink |
| `mcp_config.json` (MCP servers) | Gateway tool config | → Wire into gateway |
| `.env` → `TELEGRAM_BOT_TOKEN` | `channels.telegram.botToken` | → Configure |
| `.env` → `GITHUB_PAT` | MCP server env var | → Already in mcp_config |
| `antigravity-swarm/SKILL.md` | `~/.openclaw/workspace/skills/antigravity-swarm/SKILL.md` | → Copy or symlink |
| Vercel MCP | Gateway MCP tool | → Wire into gateway |
| Google Workspace MCP | Gateway MCP tool | → Wire into gateway |
| n8n MCP | Gateway MCP tool | → Wire into gateway |

---

## CLI Quick Reference

```bash
# Start gateway (foreground, verbose)
openclaw gateway --port 18789 --verbose

# Send a message
openclaw message send --to +1234567890 --message "Hello"

# Run agent with thinking
openclaw agent --message "Ship checklist" --thinking high

# Pairing approval (for unknown DM senders)
openclaw pairing approve <channel> <code>

# Update OpenClaw
openclaw update --channel stable

# Health check
openclaw doctor
```

---

## Security Defaults

- **DM Pairing** — unknown senders get a pairing code; must approve via `openclaw pairing approve`.
- **Open DMs** — requires explicit `dmPolicy="open"` + `"*"` in allowlist.
- **Sandbox** — set `agents.defaults.sandbox.mode: "non-main"` to Docker-isolate group sessions.
- **Tools allowlist** — `bash, process, read, write, edit, sessions_*`.
- **Tools denylist** — `browser, canvas, nodes, cron, discord, gateway`.

---

## Development Channels

| Channel | Tag Format | npm dist-tag |
|---|---|---|
| **stable** | `vYYYY.M.D` | `latest` |
| **beta** | `vYYYY.M.D-beta.N` | `beta` |
| **dev** | `main` HEAD | `dev` |

Switch: `openclaw update --channel stable|beta|dev`

---

## Links

- [Website](https://openclaw.ai)
- [Docs](https://docs.openclaw.ai)
- [Getting Started](https://docs.openclaw.ai/start/getting-started)
- [Configuration Reference](https://docs.openclaw.ai/gateway/configuration)
- [Security Guide](https://docs.openclaw.ai/gateway/security)
- [DeepWiki](https://deepwiki.com/openclaw/openclaw)
- [Discord](https://discord.gg/clawd)

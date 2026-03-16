/**
 * Agent Configuration Registry — defines each bot in the swarm.
 *
 * Each agent gets its own Telegram token, SOUL file (system prompt),
 * persona prefix, and identity. They all run in the same Node.js process,
 * sharing the Gemini AI engine.
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Agent config type
// ---------------------------------------------------------------------------
export interface AgentConfig {
  /** Unique agent identifier (used for history keys, logging) */
  id: string;
  /** Display name */
  name: string;
  /** Environment variable name holding the Telegram bot token */
  tokenEnvVar: string;
  /** Path to the agent's SOUL markdown (system prompt), relative to project root */
  soulFile: string;
  /** Emoji prefix for all responses */
  prefix: string;
  /** /start welcome message */
  welcomeMessage: string;
  /** /help command listing */
  helpMessage: string;
}

// ---------------------------------------------------------------------------
// Agent definitions
// ---------------------------------------------------------------------------
export const AGENTS: AgentConfig[] = [
  {
    id: "jarvis",
    name: "JARVIS",
    tokenEnvVar: "TELEGRAM_BOT_TOKEN",
    soulFile: "SOUL.md",
    prefix: "⚡",
    welcomeMessage: `⚡ *JARVIS Online*

Digiton Dynamics AI Operations Agent — reporting for duty.

I know everything about the business — clients, services, repos, operations. Talk to me like you would a senior team member.

Quick commands: /ping /status /skills /reset /help

Or just talk to me. What do you need, boss?`,
    helpMessage: `⚡ *JARVIS Commands*

/start — Initialize JARVIS
/ping — Health check + uptime
/status — System stats
/skills — Installed Antigravity skills
/reset — Clear conversation memory
/chatid — Get your chat ID
/help — This message

💬 *Or just talk to me naturally.* I have full context on Digiton Dynamics, all clients, services, and operations.`,
  },
  {
    id: "cto",
    name: "CTO",
    tokenEnvVar: "TELEGRAM_CTO_BOT_TOKEN",
    soulFile: "CTO-SOUL.md",
    prefix: "🏗️",
    welcomeMessage: `🏗️ *CTO Agent Online*

Digiton Dynamics Chief Technology Officer — architecture, systems, code.

I evaluate tech stacks, review system designs, plan infrastructure, and assess technical debt. Think of me as your fractional CTO on demand.

Quick commands: /ping /status /skills /reset /help

Or describe a technical challenge. I'll architect a solution.`,
    helpMessage: `🏗️ *CTO Agent Commands*

/start — Initialize CTO Agent
/ping — Health check + uptime
/status — System stats
/skills — Installed Antigravity skills
/reset — Clear conversation memory
/chatid — Get your chat ID
/help — This message

💬 *Or just talk to me naturally.* I handle architecture, system design, code review, infrastructure, and technical strategy.`,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Resolve a SOUL file path relative to project root */
export function resolveSoulPath(agent: AgentConfig): string {
  const paths = [
    path.resolve(__dirname, "../../", agent.soulFile),
    path.resolve(__dirname, "../../../", agent.soulFile),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }

  return paths[0]; // fallback — will be handled gracefully downstream
}

/** Get an agent config by ID */
export function getAgent(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id);
}

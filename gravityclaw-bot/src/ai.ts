/**
 * AI Brain — Claude CLI (Antigravity Subscription)
 *
 * Uses the `claude` CLI directly — powered by your Antigravity AI Ultra
 * subscription. NO API keys needed. The bot shells out to `claude -p`
 * for each message, passing the agent's SOUL as the system prompt.
 *
 * Agent-aware: each agent has its own SOUL and per-chat history.
 */

import { execFile } from "child_process";
import * as fs from "fs";
import { AgentConfig, resolveSoulPath } from "./agents";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CLAUDE_CLI = process.env.CLAUDE_CLI_PATH || "/Users/brandonwilliam/.local/bin/claude";
const MAX_HISTORY = 20; // pairs — kept shorter since we pass full context each call
const TIMEOUT_MS = 60_000; // 60s timeout per response

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const systemPrompts = new Map<string, string>();

type Turn = { role: "user" | "assistant"; content: string };
const histories = new Map<string, Turn[]>();

function historyKey(agentId: string, chatId: number): string {
  return `${agentId}:${chatId}`;
}

// ---------------------------------------------------------------------------
// Load system prompt for a specific agent
// ---------------------------------------------------------------------------
function loadSystemPrompt(agent: AgentConfig): string {
  const soulPath = resolveSoulPath(agent);
  let soul = "";

  if (fs.existsSync(soulPath)) {
    soul = fs.readFileSync(soulPath, "utf-8");
    console.log(`[${agent.name} AI] Loaded ${agent.soulFile} (${soul.length} chars)`);
  } else {
    console.warn(`[${agent.name} AI] ${agent.soulFile} not found — minimal system prompt.`);
  }

  const telegramOverlay = `
## Telegram Bot Behavior

You are responding via Telegram as **${agent.name}**. Rules:

1. Be concise — this is mobile chat, not a document.
2. Telegram formatting only: *bold*, _italic_, \`code\`, \`\`\`code blocks\`\`\`. NO # headers.
3. Be conversational and match Brandon's direct energy.
4. Action-oriented — confirm what you'll do, don't over-explain.
5. When you don't know real-time data, say so and suggest how to find out.
6. No sign-offs. No "let me know if you need anything." Just answer.
7. ${agent.prefix} is your signature emoji. Use sparingly.
8. Never expose API keys, tokens, or credentials.
`;

  return soul
    ? `${soul}\n\n${telegramOverlay}`
    : `You are ${agent.name}, an AI agent for Digiton Dynamics.\n\n${telegramOverlay}`;
}

// ---------------------------------------------------------------------------
// Initialize — just verify the CLI exists
// ---------------------------------------------------------------------------
let cliReady = false;

export function initAI(): void {
  if (fs.existsSync(CLAUDE_CLI)) {
    cliReady = true;
    console.log(`[AI] ✅ Claude CLI found — using Antigravity subscription (no API keys)`);
  } else {
    console.warn(`[AI] ⚠️  Claude CLI not found at ${CLAUDE_CLI} — AI brain offline.`);
  }
}

/** Load an agent's SOUL and register its system prompt */
export function loadAgentPrompt(agent: AgentConfig): void {
  systemPrompts.set(agent.id, loadSystemPrompt(agent));
}

export function isAIReady(): boolean {
  return cliReady;
}

// ---------------------------------------------------------------------------
// Shell out to claude CLI
// ---------------------------------------------------------------------------
function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = [
      "-p",                       // print mode (non-interactive)
      "--output-format", "text",  // plain text output
      "--system-prompt", systemPrompt,
      "--allowedTools", "",       // no tools — pure chat
      userMessage,
    ];

    execFile(CLAUDE_CLI, args, { timeout: TIMEOUT_MS, maxBuffer: 1024 * 512 }, (err, stdout, stderr) => {
      if (err) {
        // Check for common issues
        const msg = (err.message || "") + (stderr || "");
        if (msg.includes("expired") || msg.includes("401") || msg.includes("OAuth")) {
          reject(new Error("AUTH_EXPIRED"));
        } else if (msg.includes("rate") || msg.includes("429")) {
          reject(new Error("RATE_LIMITED"));
        } else if (err.killed) {
          reject(new Error("TIMEOUT"));
        } else {
          reject(new Error(msg || "CLI_ERROR"));
        }
        return;
      }
      resolve(stdout.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Chat — agent-aware
// ---------------------------------------------------------------------------
export async function chat(
  agentId: string,
  chatId: number,
  userMessage: string
): Promise<string> {
  if (!cliReady) return "AI brain offline — Claude CLI not found.";

  const systemPrompt = systemPrompts.get(agentId);
  if (!systemPrompt) return "Agent system prompt not loaded.";

  const key = historyKey(agentId, chatId);
  if (!histories.has(key)) {
    histories.set(key, []);
  }
  const history = histories.get(key)!;

  try {
    // Build context: system prompt + conversation history + new message
    // We bake history into the prompt since CLI is stateless per call
    let fullPrompt = userMessage;

    if (history.length > 0) {
      const contextLines = history.map((t) =>
        t.role === "user" ? `User: ${t.content}` : `Assistant: ${t.content}`
      );
      fullPrompt = `Previous conversation:\n${contextLines.join("\n")}\n\nUser: ${userMessage}`;
    }

    const reply = await callClaude(systemPrompt, fullPrompt);

    // Append to history
    history.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: reply }
    );

    // Trim history
    while (history.length > MAX_HISTORY * 2) {
      history.shift();
    }

    return reply;
  } catch (err: any) {
    console.error(`[${agentId} AI] Claude CLI error:`, err.message);

    if (err.message === "AUTH_EXPIRED") {
      return "⚠️ Antigravity OAuth token expired — refresh your login in the IDE, then the bot will work automatically.";
    }
    if (err.message === "RATE_LIMITED") {
      return "Rate limited — try again in a moment.";
    }
    if (err.message === "TIMEOUT") {
      return "Response timed out — try a shorter question.";
    }
    return "Processing error. Try again.";
  }
}

// ---------------------------------------------------------------------------
// History management
// ---------------------------------------------------------------------------
export function clearHistory(agentId: string, chatId: number): void {
  histories.delete(historyKey(agentId, chatId));
}

export function getHistorySize(agentId: string, chatId: number): number {
  return histories.get(historyKey(agentId, chatId))?.length || 0;
}

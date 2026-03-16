/**
 * Command and Message Handlers — agent-parameterized.
 *
 * All handlers receive the AgentConfig so responses use the correct
 * persona, prefix, and identity.
 */

import TelegramBot from "node-telegram-bot-api";
import { AgentConfig } from "./agents";
import { agentMsg, agentBlock, formatUptime, formatBytes } from "./persona";
import { chat, clearHistory, getHistorySize, isAIReady } from "./ai";
import * as fs from "fs";
import * as path from "path";

const startTime = Date.now();

// ---------------------------------------------------------------------------
// Register all handlers for a specific agent
// ---------------------------------------------------------------------------
export function registerHandlers(bot: TelegramBot, agent: AgentConfig): void {
  const p = agent.prefix;

  // /start
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, agent.welcomeMessage, { parse_mode: "Markdown" });
  });

  // /ping
  bot.onText(/\/ping/, (msg) => {
    const uptime = formatUptime(Date.now() - startTime);
    bot.sendMessage(
      msg.chat.id,
      agentMsg(p, `*${agent.name} Online* — Latency check passed.\n⏱ Uptime: \`${uptime}\``),
      { parse_mode: "Markdown" }
    );
  });

  // /status
  bot.onText(/\/status/, (msg) => {
    const uptime = formatUptime(Date.now() - startTime);
    const mem = process.memoryUsage();

    const statusLines = [
      `*Agent:* ${agent.name} (\`${agent.id}\`)`,
      `*Uptime:* \`${uptime}\``,
      `*Memory:* ${formatBytes(mem.rss)} RSS / ${formatBytes(mem.heapUsed)} heap`,
      `*Node:* ${process.version}`,
      `*AI Brain:* ${isAIReady() ? "✅ Online" : "❌ Offline"}`,
      `*Chat History:* ${getHistorySize(agent.id, msg.chat.id)} turns`,
    ];

    bot.sendMessage(
      msg.chat.id,
      agentBlock(p, `${agent.name} Status`, statusLines.join("\n")),
      { parse_mode: "Markdown" }
    );
  });

  // /skills
  bot.onText(/\/skills/, (msg) => {
    const skillsDir = path.resolve(__dirname, "../../../.gemini/antigravity/skills");
    let skillCount = 0;

    try {
      if (fs.existsSync(skillsDir)) {
        skillCount = fs.readdirSync(skillsDir).filter((f) => {
          const full = path.join(skillsDir, f);
          return fs.statSync(full).isDirectory();
        }).length;
      }
    } catch { /* permissions or missing dir */ }

    bot.sendMessage(
      msg.chat.id,
      agentBlock(p, "Skills Registry", `*${skillCount}* Antigravity skills installed.`),
      { parse_mode: "Markdown" }
    );
  });

  // /reset — clear conversation memory
  bot.onText(/\/reset/, (msg) => {
    clearHistory(agent.id, msg.chat.id);
    bot.sendMessage(
      msg.chat.id,
      agentMsg(p, `Conversation memory cleared. Fresh context for ${agent.name}.`),
      { parse_mode: "Markdown" }
    );
  });

  // /chatid — utility
  bot.onText(/\/chatid/, (msg) => {
    bot.sendMessage(
      msg.chat.id,
      agentMsg(p, `Chat ID: \`${msg.chat.id}\``),
      { parse_mode: "Markdown" }
    );
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, agent.helpMessage, { parse_mode: "Markdown" });
  });

  // -------------------------------------------
  // Catch-all: NLP via Gemini
  // -------------------------------------------
  bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;

    if (!isAIReady()) {
      bot.sendMessage(
        msg.chat.id,
        agentMsg(p, "AI brain offline — GOOGLE_AI_API_KEY not configured."),
        { parse_mode: "Markdown" }
      );
      return;
    }

    // Typing indicator
    bot.sendChatAction(msg.chat.id, "typing");

    try {
      const reply = await chat(agent.id, msg.chat.id, msg.text);

      // Split long responses (Telegram 4096 char limit)
      const chunks = splitMessage(reply, 4000);
      for (const chunk of chunks) {
        await bot.sendMessage(msg.chat.id, chunk, { parse_mode: "Markdown" }).catch(() => {
          // Fallback without Markdown if formatting breaks
          bot.sendMessage(msg.chat.id, chunk);
        });
      }
    } catch (err: any) {
      console.error(`[${agent.name} Handler] Message error:`, err.message);
      bot.sendMessage(
        msg.chat.id,
        agentMsg(p, "Processing error. Try again."),
        { parse_mode: "Markdown" }
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    let splitIdx = remaining.lastIndexOf("\n", maxLen);
    if (splitIdx === -1 || splitIdx < maxLen * 0.3) {
      splitIdx = remaining.lastIndexOf(" ", maxLen);
    }
    if (splitIdx === -1) {
      splitIdx = maxLen;
    }

    chunks.push(remaining.slice(0, splitIdx));
    remaining = remaining.slice(splitIdx).trimStart();
  }

  return chunks;
}

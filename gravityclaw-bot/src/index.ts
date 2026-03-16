/**
 * Gravityclaw Bot — Multi-Agent Telegram Swarm
 *
 * Boots all configured agents in a single Node.js process.
 * Each agent gets its own Telegram bot instance, SOUL system prompt,
 * and persona — but they share one Gemini AI engine.
 *
 * Usage:
 *   npm run dev    # tsx watch mode
 *   npm start      # production
 */

import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { AGENTS, AgentConfig } from "./agents";
import { initAI, loadAgentPrompt } from "./ai";
import { registerHandlers } from "./handlers";

// ---------------------------------------------------------------------------
// Boot the swarm
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  GRAVITYCLAW SWARM — Multi-Agent Startup  ");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Initialize shared AI engine
  initAI();

  // Boot each agent that has a valid token
  const activeBots: { agent: AgentConfig; bot: TelegramBot }[] = [];

  for (const agent of AGENTS) {
    const token = process.env[agent.tokenEnvVar];

    if (!token || token === "XXXXXXXXXXXXXXXXXXXX") {
      console.warn(`[${agent.name}] ⏭  Skipped — ${agent.tokenEnvVar} not set.`);
      continue;
    }

    try {
      console.log(`[${agent.name}] 🚀 Booting...`);

      // Load agent-specific system prompt
      loadAgentPrompt(agent);

      // Create Telegram bot instance
      const bot = new TelegramBot(token, { polling: true });

      // Register handlers with agent context
      registerHandlers(bot, agent);

      // Verify connection
      const me = await bot.getMe();
      console.log(`[${agent.name}] ✅ Online as @${me.username} (id: ${me.id})`);

      activeBots.push({ agent, bot });
    } catch (err: any) {
      console.error(`[${agent.name}] ❌ Failed to start: ${err.message}`);

      if (err.message?.includes("401") || err.message?.includes("Unauthorized")) {
        console.error(`  → Token is invalid or expired. Refresh in BotFather.`);
      }
    }
  }

  // Summary
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (activeBots.length === 0) {
    console.error("❌ No agents started. Check your .env for valid bot tokens.");
    process.exit(1);
  }

  console.log(`✅ ${activeBots.length}/${AGENTS.length} agents active:`);
  for (const { agent } of activeBots) {
    console.log(`   ${agent.prefix} ${agent.name} (${agent.tokenEnvVar})`);
  }
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n🛑 Shutting down swarm...");
    for (const { agent, bot } of activeBots) {
      console.log(`   Stopping ${agent.name}...`);
      bot.stopPolling();
    }
    console.log("✅ All agents stopped. Goodbye.");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

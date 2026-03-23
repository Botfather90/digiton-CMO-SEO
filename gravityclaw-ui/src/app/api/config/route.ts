import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");

/* ── Build config status from environment variables ── */
function buildEnvConfig() {
  const envVars = [
    { key: "GITHUB_PAT", label: "GitHub Personal Access Token", category: "Source Control" },
    { key: "GITHUB_OWNER", label: "GitHub Owner / Org", category: "Source Control" },
    { key: "GITHUB_REPO", label: "GitHub Repo (agent config)", category: "Source Control" },
    { key: "WEBSITE_REPO", label: "Website Repo (blog target)", category: "Source Control" },
    { key: "TARGET_WEBSITE_URL", label: "Target Website URL", category: "Source Control" },
    { key: "VERCEL_API_TOKEN", label: "Vercel API Token", category: "Deployment" },
    { key: "VERCEL_TEAM_ID", label: "Vercel Team ID", category: "Deployment" },
    { key: "GOOGLE_AI_API_KEY", label: "Google AI / Gemini API Key", category: "AI Models" },
    { key: "GOOGLE_CLIENT_ID", label: "Google OAuth Client ID", category: "Authentication" },
    { key: "GOOGLE_CLIENT_SECRET", label: "Google OAuth Client Secret", category: "Authentication" },
    { key: "OPENROUTER_API_KEY", label: "OpenRouter API Key", category: "AI Models" },
    { key: "SUPABASE_ACCESS_TOKEN", label: "Supabase Access Token", category: "Database" },
    { key: "SUPABASE_URL", label: "Supabase Project URL", category: "Database" },
    { key: "TELEGRAM_BOT_TOKEN", label: "Telegram Bot Token", category: "Notifications" },
    { key: "TELEGRAM_CHAT_ID", label: "Telegram Chat ID", category: "Notifications" },
    { key: "X_API_KEY", label: "X / Twitter API Key", category: "Social Media" },
    { key: "N8N_MCP_URL", label: "n8n MCP Server URL", category: "Automation" },
    { key: "FAL_KEY", label: "fal.ai Video Generation Key", category: "AI Models" },
  ];

  const config: Record<string, Record<string, { status: string; masked: string }>> = {};

  for (const v of envVars) {
    if (!config[v.category]) config[v.category] = {};

    const val = process.env[v.key];
    if (val && val.length > 8 && !val.startsWith("XXXX")) {
      config[v.category][v.label] = {
        status: "configured",
        masked: val.slice(0, 4) + "••••" + val.slice(-4),
      };
    } else if (val) {
      config[v.category][v.label] = {
        status: "placeholder",
        masked: "Not configured (placeholder value)",
      };
    } else {
      config[v.category][v.label] = {
        status: "missing",
        masked: "Not set",
      };
    }
  }

  return {
    system: {
      name: "GravityClaw CMO/SEO",
      version: "1.0.0",
      runtime: "Next.js / Turbopack",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    },
    agents: {
      total: 7,
      roles: ["CEO", "CMO", "CTO", "Developer", "Designer", "QA", "DevOps"],
      modelProvider: process.env.GOOGLE_AI_API_KEY ? "Gemini (Google AI)" : "Not configured",
    },
    integrations: config,
  };
}

export async function GET() {
  try {
    // Try local config file first
    const configPath = join(OPENCLAW_DIR, "openclaw.json");
    if (existsSync(configPath)) {
      const content = await readFile(configPath, "utf-8");
      const config = JSON.parse(content);

      // Mask sensitive values
      const masked = JSON.parse(JSON.stringify(config));
      const maskKeys = ["token", "key", "secret", "password", "apiKey"];

      function maskObject(obj: Record<string, unknown>) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === "string" && maskKeys.some((k) => key.toLowerCase().includes(k))) {
            obj[key] = value.slice(0, 4) + "••••" + value.slice(-4);
          } else if (typeof value === "object" && value !== null) {
            maskObject(value as Record<string, unknown>);
          }
        }
      }

      maskObject(masked);
      return NextResponse.json({ config: masked });
    }

    // Production fallback: build config from env vars
    const config = buildEnvConfig();
    return NextResponse.json({ config });
  } catch (error) {
    // Even if everything fails, return env config
    const config = buildEnvConfig();
    return NextResponse.json({ config });
  }
}

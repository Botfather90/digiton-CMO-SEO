import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");
const WORKSPACE_DIR = join(OPENCLAW_DIR, "workspace");
const AGENTS_DIR = join(OPENCLAW_DIR, "agents");

interface AgentInfo {
  name: string;
  role: string;
  description: string;
  soulPreview: string;
  status: "online" | "idle" | "offline";
  hasIdentity: boolean;
  hasHeartbeat: boolean;
  hasSessions: boolean;
  lastActivity?: string;
}

async function readFileContent(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch {
    return null;
  }
}

function extractTitle(md: string): string {
  const match = md.match(/^#\s+(.+)/m);
  return match ? match[1].replace(/[*_]/g, "") : "Unknown Agent";
}

function extractRole(md: string): string {
  const identityMatch = md.match(/You are \*\*(.+?)\*\*/);
  return identityMatch ? identityMatch[1] : "Agent";
}

function extractDescription(md: string): string {
  const lines = md.split("\n").filter((l) => l.trim().length > 0);
  for (const line of lines) {
    if (line.startsWith("## Mission") || line.startsWith("## Core Resp")) {
      const idx = lines.indexOf(line);
      if (lines[idx + 1]) return lines[idx + 1].replace(/^[-*]\s*/, "").replace(/\*\*/g, "");
    }
  }
  const desc = lines.find(
    (l) => !l.startsWith("#") && l.length > 30 && !l.startsWith(">")
  );
  return desc?.slice(0, 120) || "No description available.";
}

export async function GET() {
  try {
    const agents: AgentInfo[] = [];

    // Main agent
    const mainSoul = await readFileContent(join(WORKSPACE_DIR, "SOUL.md"));
    if (mainSoul) {
      const mainIdentity = await readFileContent(join(WORKSPACE_DIR, "IDENTITY.md"));
      const mainHeartbeat = await readFileContent(join(WORKSPACE_DIR, "HEARTBEAT.md"));
      const mainSessions = existsSync(join(AGENTS_DIR, "main", "sessions"));

      agents.push({
        name: "main",
        role: extractRole(mainSoul),
        description: extractDescription(mainSoul),
        soulPreview: mainSoul.slice(0, 500),
        status: "online",
        hasIdentity: !!mainIdentity && mainIdentity.includes("Name:"),
        hasHeartbeat: !!mainHeartbeat && mainHeartbeat.trim().split("\n").length > 5,
        hasSessions: mainSessions,
      });
    }

    // Sub-agents
    const subAgentsDir = join(WORKSPACE_DIR, "agents");
    if (existsSync(subAgentsDir)) {
      const subAgents = await readdir(subAgentsDir);
      for (const agentName of subAgents) {
        if (agentName.startsWith(".")) continue;
        const agentDir = join(subAgentsDir, agentName);
        const agentStat = await stat(agentDir);
        if (!agentStat.isDirectory()) continue;

        const soul = await readFileContent(join(agentDir, "SOUL.md"));
        if (!soul) continue;

        const identity = await readFileContent(join(agentDir, "IDENTITY.md"));
        const heartbeat = await readFileContent(join(agentDir, "HEARTBEAT.md"));
        const sessions = existsSync(join(AGENTS_DIR, agentName, "sessions"));

        agents.push({
          name: agentName,
          role: extractRole(soul),
          description: extractDescription(soul),
          soulPreview: soul.slice(0, 500),
          status: "idle",
          hasIdentity: !!identity && identity.includes("Name:"),
          hasHeartbeat: !!heartbeat && heartbeat.trim().split("\n").length > 5,
          hasSessions: sessions,
          lastActivity: agentStat.mtime.toISOString(),
        });
      }
    }

    return NextResponse.json({ agents });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read agents", details: String(error) },
      { status: 500 }
    );
  }
}

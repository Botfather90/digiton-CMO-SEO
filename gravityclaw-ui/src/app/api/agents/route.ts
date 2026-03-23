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

// Agent roster — shown when local SOUL.md files are not available
const PRODUCTION_AGENTS: AgentInfo[] = [
  {
    name: "ceo",
    role: "CEO — Strategy & Lead Generation",
    description: "Autonomous operations agent. Runs Money Runner for multi-platform lead generation, manages business strategy, and coordinates agent swarm objectives.",
    soulPreview: "CEO agent orchestrating business operations, lead generation, and strategic decision-making across the agent swarm.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "cmo",
    role: "CMO — SEO & Content Engine",
    description: "SEO cron jobs: blog generation via Gemini, keyword rank tracking, backlink outreach, IndexNow submissions, Lighthouse audits. Pushes content to connected website repos.",
    soulPreview: "CMO agent powered by Paperclip orchestration. Manages SEO, content marketing, social media optimization.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "cto",
    role: "CTO — Technical Architecture",
    description: "Architecture decisions, code reviews, technical strategy, deployment management. Monitors repos and CI/CD pipelines.",
    soulPreview: "CTO agent responsible for technical architecture and code quality across all projects.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "developer",
    role: "Developer — Code & Features",
    description: "Code writing, bug fixes, feature implementation. Works with React, Next.js, TypeScript, n8n, Flutter. Executes tasks assigned by CTO.",
    soulPreview: "Full-stack developer agent. Builds production-grade code for engagements.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "designer",
    role: "Designer — UI/UX & Brand",
    description: "Premium UI/UX design, brand identity, mockups. Award-winning design standards with Three.js, GSAP, glassmorphism.",
    soulPreview: "Design agent. Produces premium visuals. No generic templates, no cookie-cutter layouts.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "qa",
    role: "QA — Testing & Quality",
    description: "Testing, quality gates, regression checks. Lighthouse 90+ enforcement, TypeScript strict mode, automated test suites.",
    soulPreview: "QA agent. Ensures production-grade quality across all codebases and deployments.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
  {
    name: "devops",
    role: "DevOps — Infrastructure",
    description: "CI/CD, infrastructure monitoring, deployments to Vercel/Railway. Manages GitHub Actions, env vars, DNS configuration.",
    soulPreview: "DevOps agent. Manages deployment pipelines, infrastructure health, and monitoring.",
    status: "idle",
    hasIdentity: true,
    hasHeartbeat: false,
    hasSessions: false,
  },
];

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
    // Try local filesystem first (for local dev)
    if (existsSync(WORKSPACE_DIR)) {
      const agents: AgentInfo[] = [];

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

      if (agents.length > 0) {
        return NextResponse.json({ agents });
      }
    }

    // Fallback: return production agent roster
    return NextResponse.json({ agents: PRODUCTION_AGENTS });
  } catch {
    // On any error, return production roster
    return NextResponse.json({ agents: PRODUCTION_AGENTS });
  }
}

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");
const GITHUB_PAT = process.env.GITHUB_PAT || "";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "Botfather90";
const GITHUB_REPO = process.env.GITHUB_REPO || "digiton-jarvis";

/* ── Fetch activity logs from GitHub repo data ── */
async function fetchGitHubActivityLogs(): Promise<string> {
  if (!GITHUB_PAT) return "⚠️  No GITHUB_PAT configured. Set it in environment variables.\n\nTo configure:\n  1. Go to github.com → Settings → Developer Settings → Personal Access Tokens\n  2. Generate a token with 'repo' scope\n  3. Add GITHUB_PAT=your_token to .env.local";

  const lines: string[] = [];
  lines.push(`════════════════════════════════════════════════════════`);
  lines.push(`  GRAVITYCLAW — Activity Log`);
  lines.push(`  Generated: ${new Date().toISOString()}`);
  lines.push(`════════════════════════════════════════════════════════\n`);

  // Fetch recent commits from the main repo
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=15`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (r.ok) {
      const commits = await r.json();
      lines.push(`── Recent Commits (${GITHUB_OWNER}/${GITHUB_REPO}) ──\n`);
      for (const c of commits) {
        const date = new Date(c.commit.author.date).toLocaleString("en-US", { timeZone: "Europe/Lisbon" });
        const msg = c.commit.message.split("\n")[0].slice(0, 80);
        const author = c.commit.author.name;
        lines.push(`  [${date}] ${author}: ${msg}`);
      }
    }
  } catch { lines.push("  ⚠️  Could not fetch commits"); }

  // Fetch recent events (push, create, etc)
  try {
    const r = await fetch(
      `https://api.github.com/users/${GITHUB_OWNER}/events?per_page=20`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (r.ok) {
      const events = await r.json();
      lines.push(`\n── Recent Activity ──\n`);
      for (const e of events.slice(0, 15)) {
        const date = new Date(e.created_at).toLocaleString("en-US", { timeZone: "Europe/Lisbon" });
        const repo = e.repo?.name || "unknown";
        let action = e.type.replace("Event", "");
        if (e.type === "PushEvent") {
          const count = e.payload?.commits?.length || 0;
          action = `Push (${count} commits)`;
        } else if (e.type === "CreateEvent") {
          action = `Create ${e.payload?.ref_type || ""}`;
        }
        lines.push(`  [${date}] ${action} → ${repo}`);
      }
    }
  } catch { lines.push("  ⚠️  Could not fetch events"); }

  // Check SEO cron log from repo
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/money-runner/seo-outreach-log.json`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3.raw" } }
    );
    if (r.ok) {
      const logData = JSON.parse(await r.text());
      if (Array.isArray(logData) && logData.length > 0) {
        lines.push(`\n── SEO Outreach Log (${logData.length} entries) ──\n`);
        const recent = logData.slice(-10);
        for (const entry of recent) {
          lines.push(`  [${entry.date}] ${entry.type} → ${entry.target} (${entry.status})`);
        }
      }
    }
  } catch { /* no outreach log available */ }

  return lines.join("\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logType = searchParams.get("type") || "gateway";
  const lineCount = parseInt(searchParams.get("lines") || "200");

  // Try local first
  try {
    let logPath: string;
    switch (logType) {
      case "error":
        logPath = join(OPENCLAW_DIR, "logs", "gateway.err.log");
        break;
      case "config-audit":
        logPath = join(OPENCLAW_DIR, "logs", "config-audit.jsonl");
        break;
      default:
        logPath = join(OPENCLAW_DIR, "logs", "gateway.log");
    }

    if (existsSync(logPath)) {
      const content = await readFile(logPath, "utf-8");
      const allLines = content.split("\n").filter((l) => l.trim());
      const tail = allLines.slice(-lineCount);
      return NextResponse.json({
        content: tail.join("\n"),
        totalLines: allLines.length,
        showing: tail.length,
        type: logType,
      });
    }
  } catch { /* fall through */ }

  // Production fallback: GitHub activity logs
  const activityLog = await fetchGitHubActivityLogs();
  return NextResponse.json({
    content: activityLog,
    totalLines: activityLog.split("\n").length,
    showing: activityLog.split("\n").length,
    type: "activity",
  });
}

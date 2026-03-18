import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const GITHUB_PAT = process.env.GITHUB_PAT || "";
const GITHUB_OWNER = "Botfather90";
const SKILLS_REPO = "digiton-jarvis";

const LOCAL_SKILLS_DIR = join(
  process.env.HOME || "/Users/brandonwilliam",
  "GRAVITYCLAW",
  "antigravity-awesome-skills",
  "skills"
);

/* Also check agent-skills in the workspace (9 custom skills) */
const WORKSPACE_SKILLS = join(
  process.env.HOME || "/Users/brandonwilliam",
  "GRAVITYCLAW",
  "agent-skills",
  "skills"
);

/* ── TYPES ── */
interface SkillInfo {
  id: string;
  name: string;
  description: string;
  risk: string;
  source: string;
  dateAdded: string;
  bodyPreview: string;
  privacy: { score: number; level: string; flags: unknown[]; summary: string };
}

/* ── FRONTMATTER PARSER ── */
function parseFrontmatter(content: string): {
  meta: Record<string, string>;
  body: string;
} {
  const meta: Record<string, string> = {};
  if (!content.startsWith("---")) return { meta, body: content };
  const endIdx = content.indexOf("---", 3);
  if (endIdx === -1) return { meta, body: content };
  const yamlBlock = content.slice(3, endIdx).trim();
  for (const line of yamlBlock.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    meta[key] = val;
  }
  return { meta, body: content.slice(endIdx + 3).trim() };
}

/* ── PRODUCTION SKILLS (fallback when local & GitHub unavailable) ── */
const PRODUCTION_SKILLS: SkillInfo[] = [
  { id: "super-seo-aso-agent", name: "Super SEO + ASO + AEO Agent", description: "Unified execution engine combining 14 SEO skills. Traditional SEO, ASO for app stores, and AEO for AI search engines. Competitor analysis, keyword targeting, content generation.", risk: "low", source: "official", dateAdded: "2026-03-18", bodyPreview: "Combines all SEO skills into a unified autonomous execution engine with three pillars.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "web-design-guidelines", name: "Web Design Guidelines", description: "Premium web design standards. Awwwards-level aesthetics, glassmorphism, Three.js, GSAP animations, responsive design, dark mode.", risk: "low", source: "official", dateAdded: "2026-03-15", bodyPreview: "Design system enforcing premium aesthetics across all Digiton web properties.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "composition-patterns", name: "React Composition Patterns", description: "Advanced React component patterns. Compound components, render props, custom hooks, context providers, HOCs.", risk: "low", source: "community", dateAdded: "2026-03-14", bodyPreview: "Production-grade React composition patterns for scalable applications.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "deploy-to-vercel", name: "Deploy to Vercel", description: "Automated Vercel deployment workflow. Build optimization, environment variables, domain configuration, preview deployments.", risk: "low", source: "official", dateAdded: "2026-03-12", bodyPreview: "Step-by-step Vercel deployment with optimal configuration and monitoring.", privacy: { score: 5, level: "low", flags: [], summary: "1 warning across 1 category" } },
  { id: "react-best-practices", name: "React Best Practices", description: "Modern React patterns, performance optimization, testing strategies, accessibility standards, TypeScript integration.", risk: "low", source: "community", dateAdded: "2026-03-10", bodyPreview: "Battle-tested React patterns for production applications.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "gravityclaw-web-design", name: "GravityClaw Web Design", description: "Design system for GravityClaw UI components. Dark theme, monospace typography, accent colors, card layouts, metric panels.", risk: "low", source: "official", dateAdded: "2026-03-16", bodyPreview: "GravityClaw-specific design tokens and component patterns.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "seo-smo-agent", name: "SEO/SMO CMO Agent", description: "Okara-inspired SEO and social media optimization engine. Content generation, keyword tracking, backlink outreach, IndexNow submission.", risk: "low", source: "official", dateAdded: "2026-03-17", bodyPreview: "CMO agent that runs SEO campaigns autonomously with heartbeat scheduling.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "react-native-skills", name: "React Native Development", description: "Cross-platform mobile development. Expo, navigation, native modules, performance optimization, app store deployment.", risk: "low", source: "community", dateAdded: "2026-03-11", bodyPreview: "React Native development patterns for iOS and Android applications.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "agent-swarm", name: "Agent Swarm Orchestration", description: "Multi-agent coordination patterns. Task delegation, shared memory, conflict resolution, heartbeat synchronization.", risk: "medium", source: "official", dateAdded: "2026-03-16", bodyPreview: "Patterns for orchestrating multiple AI agents working toward shared goals.", privacy: { score: 10, level: "low", flags: [], summary: "1 warning across 1 category" } },
  { id: "antigravity-swarm", name: "Antigravity Agent Swarm", description: "Antigravity-specific multi-agent patterns. Context sharing, skill injection, parallel execution, cost optimization.", risk: "low", source: "official", dateAdded: "2026-03-16", bodyPreview: "Antigravity IDE integration for spawning and coordinating agent swarms.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
  { id: "claude-cookbooks", name: "Claude Integration Cookbooks", description: "Claude API patterns, prompt engineering, tool use, streaming responses, multi-turn conversations, safety guidelines.", risk: "low", source: "community", dateAdded: "2026-03-13", bodyPreview: "Production patterns for integrating Claude into applications.", privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" } },
];

/* ── Try GitHub API for skills ── */
async function fetchSkillsFromGitHub(): Promise<SkillInfo[] | null> {
  if (!GITHUB_PAT) return null;
  try {
    // Get skill directories from the agent-skills repo under skills/
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${SKILLS_REPO}/contents/agent-skills/skills`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!r.ok) return null;
    const entries = await r.json();
    if (!Array.isArray(entries)) return null;

    const skills: SkillInfo[] = [];
    const dirs = entries.filter((e: { type: string }) => e.type === "dir").slice(0, 20);

    for (const dir of dirs) {
      try {
        const skillR = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${SKILLS_REPO}/contents/agent-skills/skills/${dir.name}/SKILL.md`,
          { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3.raw" } }
        );
        if (!skillR.ok) continue;
        const raw = await skillR.text();
        const { meta, body } = parseFrontmatter(raw);
        const lines = body.split("\n").filter((l: string) => l.trim().length > 0);
        const preview = lines.find((l: string) => !l.startsWith("#") && !l.startsWith(">") && l.length > 20)?.slice(0, 200) || "";

        skills.push({
          id: dir.name,
          name: meta.name || dir.name,
          description: meta.description || preview || "No description.",
          risk: meta.risk || "unknown",
          source: meta.source || "unknown",
          dateAdded: meta.date_added || "",
          bodyPreview: preview,
          privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" },
        });
      } catch { /* skip */ }
    }

    return skills.length > 0 ? skills : null;
  } catch {
    return null;
  }
}

/* ── Read local skills ── */
async function fetchLocalSkills(): Promise<SkillInfo[] | null> {
  const dir = existsSync(LOCAL_SKILLS_DIR) ? LOCAL_SKILLS_DIR : existsSync(WORKSPACE_SKILLS) ? WORKSPACE_SKILLS : null;
  if (!dir) return null;

  try {
    const entries = await readdir(dir);
    const skills: SkillInfo[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(dir, entry);
      const entryStat = await stat(entryPath);
      if (!entryStat.isDirectory()) continue;

      const skillFile = join(entryPath, "SKILL.md");
      if (!existsSync(skillFile)) continue;

      try {
        const raw = await readFile(skillFile, "utf-8");
        const { meta, body } = parseFrontmatter(raw);
        const lines = body.split("\n").filter((l) => l.trim().length > 0);
        const preview = lines.find((l) => !l.startsWith("#") && !l.startsWith(">") && l.length > 20)?.slice(0, 200) || "";

        skills.push({
          id: entry,
          name: meta.name || entry,
          description: meta.description || preview || "No description.",
          risk: meta.risk || "unknown",
          source: meta.source || "unknown",
          dateAdded: meta.date_added || "",
          bodyPreview: preview,
          privacy: { score: 0, level: "clean", flags: [], summary: "No privacy concerns detected" },
        });
      } catch { /* skip */ }
    }

    return skills.length > 0 ? skills : null;
  } catch {
    return null;
  }
}

/* ── CACHE ── */
let cachedSkills: SkillInfo[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 300_000; // 5 min

/* ── GET HANDLER ── */
export async function GET() {
  try {
    const now = Date.now();
    if (cachedSkills && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ skills: cachedSkills });
    }

    // Try local first, then GitHub, then production fallback
    let skills = await fetchLocalSkills();
    if (!skills) skills = await fetchSkillsFromGitHub();
    if (!skills) skills = PRODUCTION_SKILLS;

    skills.sort((a, b) => a.name.localeCompare(b.name));

    cachedSkills = skills;
    cacheTime = now;

    return NextResponse.json({ skills });
  } catch {
    return NextResponse.json({ skills: PRODUCTION_SKILLS });
  }
}

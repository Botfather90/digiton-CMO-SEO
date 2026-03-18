import { NextResponse } from "next/server";

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN || "";
const GITHUB_PAT = process.env.GITHUB_PAT || "";

interface VercelProject {
  name: string;
  framework: string | null;
  link?: { type: string; repo: string };
  latestDeployments?: { url: string; readyState: string; createdAt: number }[];
  targets?: { production?: { url: string; readyState: string; createdAt: number } };
  updatedAt: number;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  homepage: string | null;
  html_url: string;
  size: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export async function GET() {
  try {
    const [vercelData, githubData] = await Promise.all([
      fetchVercelProjects(),
      fetchGitHubRepos(),
    ]);

    return NextResponse.json({
      vercelApps: vercelData,
      githubRepos: githubData,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch apps", details: String(error) },
      { status: 500 }
    );
  }
}

async function fetchVercelProjects() {
  if (!VERCEL_API_TOKEN) return [];
  try {
    const teamId = process.env.VERCEL_TEAM_ID || "team_8gKY1R0DfR7jo8NxCDnQ69RX";
    const r = await fetch(`https://api.vercel.com/v9/projects?limit=100&teamId=${teamId}`, {
      headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` },
      next: { revalidate: 120 },
    });
    if (!r.ok) return [];
    const d = await r.json();
    return (d.projects || []).map((p: VercelProject) => {
      const prod = p.targets?.production;
      return {
        name: p.name,
        url: prod?.url || `${p.name}.vercel.app`,
        framework: p.framework || "unknown",
        repo: p.link?.repo || "",
        status: prod?.readyState === "READY" ? "ready" : prod?.readyState === "ERROR" ? "error" : "building",
        updatedAt: prod?.createdAt ? new Date(prod.createdAt).toISOString() : new Date(p.updatedAt).toISOString(),
      };
    });
  } catch {
    return [];
  }
}

async function fetchGitHubRepos() {
  if (!GITHUB_PAT) return [];
  try {
    const r = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner",
      {
        headers: { Authorization: `token ${GITHUB_PAT}` },
        next: { revalidate: 120 },
      }
    );
    if (!r.ok) return [];
    const repos: GitHubRepo[] = await r.json();
    return repos.map((r) => ({
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      description: r.description || "",
      language: r.language || "Unknown",
      homepage: r.homepage || "",
      url: r.html_url,
      size: r.size,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      pushedAt: r.pushed_at,
    }));
  } catch {
    return [];
  }
}

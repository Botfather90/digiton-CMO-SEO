import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const GITHUB_PAT = process.env.GITHUB_PAT || "";
const GITHUB_OWNER = "Botfather90";
const GITHUB_REPO = "digiton-jarvis";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");
const WORKSPACE_DIR = join(OPENCLAW_DIR, "workspace");
const GRAVITYCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", "GRAVITYCLAW");

async function fetchFromGitHub(path: string) {
  if (!GITHUB_PAT) return null;
  try {
    const apiPath = path ? `contents/${path}` : "contents";
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/${apiPath}`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";

  // Try local first
  const localDir = existsSync(WORKSPACE_DIR) ? WORKSPACE_DIR : existsSync(GRAVITYCLAW_DIR) ? GRAVITYCLAW_DIR : null;

  if (localDir) {
    try {
      const targetDir = path ? join(localDir, path) : localDir;

      if (!targetDir.startsWith(localDir)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      if (!existsSync(targetDir)) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const targetStat = await stat(targetDir);

      if (targetStat.isFile()) {
        const content = await readFile(targetDir, "utf-8");
        return NextResponse.json({
          type: "file",
          name: path.split("/").pop(),
          content: content.slice(0, 50000),
          size: targetStat.size,
          modified: targetStat.mtime.toISOString(),
        });
      }

      const entries = await readdir(targetDir);
      const items = [];

      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules") continue;
        try {
          const entryStat = await stat(join(targetDir, entry));
          items.push({
            name: entry,
            isDir: entryStat.isDirectory(),
            size: entryStat.size,
            modified: entryStat.mtime.toISOString(),
          });
        } catch { /* skip */ }
      }

      return NextResponse.json({
        type: "directory",
        path: path || "/",
        items: items.sort((a, b) => {
          if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      });
    } catch { /* fall through to GitHub */ }
  }

  // Fallback to GitHub API
  const ghData = await fetchFromGitHub(path);
  if (ghData) {
    if (Array.isArray(ghData)) {
      // Directory listing
      const items = ghData
        .filter((e: { name: string }) => !e.name.startsWith(".") && e.name !== "node_modules")
        .map((e: { name: string; type: string; size: number }) => ({
          name: e.name,
          isDir: e.type === "dir",
          size: e.size || 0,
          modified: new Date().toISOString(),
        }));

      return NextResponse.json({
        type: "directory",
        path: path || "/",
        items: items.sort((a: { isDir: boolean; name: string }, b: { isDir: boolean; name: string }) => {
          if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
      });
    } else if (ghData.content) {
      // File content (base64 encoded from GitHub)
      const content = Buffer.from(ghData.content, "base64").toString("utf-8");
      return NextResponse.json({
        type: "file",
        name: path.split("/").pop(),
        content: content.slice(0, 50000),
        size: ghData.size || 0,
        modified: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json({ error: "Workspace not available", type: "directory", path: "/", items: [] });
}

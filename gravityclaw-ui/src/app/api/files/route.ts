import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");
const WORKSPACE_DIR = join(OPENCLAW_DIR, "workspace");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";

  try {
    const targetDir = path
      ? join(WORKSPACE_DIR, path)
      : WORKSPACE_DIR;

    // Security: prevent path traversal
    if (!targetDir.startsWith(WORKSPACE_DIR)) {
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
        content,
        size: targetStat.size,
        modified: targetStat.mtime.toISOString(),
      });
    }

    const entries = await readdir(targetDir);
    const items = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(targetDir, entry);
      try {
        const entryStat = await stat(entryPath);
        items.push({
          name: entry,
          isDir: entryStat.isDirectory(),
          size: entryStat.size,
          modified: entryStat.mtime.toISOString(),
        });
      } catch {
        // skip inaccessible entries
      }
    }

    return NextResponse.json({
      type: "directory",
      path: path || "/",
      items: items.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read files", details: String(error) },
      { status: 500 }
    );
  }
}

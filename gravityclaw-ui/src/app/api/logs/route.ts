import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logType = searchParams.get("type") || "gateway";
  const lines = parseInt(searchParams.get("lines") || "200");

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

    if (!existsSync(logPath)) {
      return NextResponse.json({ content: "No log file found.", lines: 0 });
    }

    const content = await readFile(logPath, "utf-8");
    const allLines = content.split("\n").filter((l) => l.trim());
    const tail = allLines.slice(-lines);

    return NextResponse.json({
      content: tail.join("\n"),
      totalLines: allLines.length,
      showing: tail.length,
      type: logType,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read logs", details: String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const OPENCLAW_DIR = join(process.env.HOME || "/Users/brandonwilliam", ".openclaw");

export async function GET() {
  try {
    const configPath = join(OPENCLAW_DIR, "openclaw.json");

    if (!existsSync(configPath)) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 });
    }

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
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read config", details: String(error) },
      { status: 500 }
    );
  }
}

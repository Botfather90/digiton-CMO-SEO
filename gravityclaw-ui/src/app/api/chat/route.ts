import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || "";

const SYSTEM_PROMPT = `You are the GravityClaw AI operations agent — a multi-agent platform for digital businesses.

Your capabilities:
- Manage and coordinate AI agents (CEO, CMO, CTO, Developer, Designer, QA, DevOps)
- Run SEO campaigns (blog generation, backlink outreach, rank monitoring)
- Run lead generation via Money Runner (multi-platform freelance engine)
- Monitor Vercel deployments and GitHub repositories
- Execute cron jobs for automated tasks
- Analyze website performance via Lighthouse/PageSpeed

You speak concisely and professionally. You reference real capabilities of the GravityClaw platform.
When asked about status, reference the dashboard tabs (Overview, Apps, Agents, Skills, Files, Logs, Config).
When asked to run something, explain what would happen and confirm readiness.`;

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        response: "⚠️ GOOGLE_AI_API_KEY not configured. Add it to your environment variables to enable chat.\n\nTo configure:\n1. Go to https://aistudio.google.com/apikey\n2. Generate a key\n3. Add GOOGLE_AI_API_KEY=your_key to .env.local",
      });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "model", parts: [{ text: "Understood. I am the GravityClaw agent, ready to assist with operations. How can I help?" }] },
            { role: "user", parts: [{ text: message }] },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return NextResponse.json({
        response: `⚠️ Gemini API error (${res.status}). Check your GOOGLE_AI_API_KEY.`,
      });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";

    return NextResponse.json({ response: text });
  } catch (error) {
    return NextResponse.json(
      { error: "Chat processing failed", response: `Error: ${String(error)}` },
      { status: 500 }
    );
  }
}

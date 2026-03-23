import { NextResponse } from "next/server";

const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY || "";

interface LighthouseCategory {
  score: number;
  title: string;
}

interface LighthouseResult {
  categories: {
    performance: LighthouseCategory;
    accessibility: LighthouseCategory;
    "best-practices": LighthouseCategory;
    seo: LighthouseCategory;
  };
  audits: Record<string, { score: number; title: string; displayValue?: string }>;
  fetchTime: string;
  finalUrl: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const strategy = searchParams.get("strategy") || "desktop";

  if (!url) {
    return NextResponse.json({ error: "url parameter is required" }, { status: 400 });
  }

  // PageSpeed Insights API works with or without an API key
  // With key: higher rate limits. Without: 1 req/100s
  const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("strategy", strategy);
  apiUrl.searchParams.set("category", "PERFORMANCE");
  apiUrl.searchParams.append("category", "ACCESSIBILITY");
  apiUrl.searchParams.append("category", "BEST_PRACTICES");
  apiUrl.searchParams.append("category", "SEO");

  if (GOOGLE_API_KEY) {
    apiUrl.searchParams.set("key", GOOGLE_API_KEY);
  }

  try {
    const res = await fetch(apiUrl.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `PageSpeed API error: ${res.status}`, details: errText.slice(0, 200) },
        { status: res.status }
      );
    }

    const data = await res.json();
    const lighthouse = data.lighthouseResult as LighthouseResult;

    if (!lighthouse) {
      return NextResponse.json({ error: "No Lighthouse data returned" }, { status: 500 });
    }

    // Extract key metrics
    const scores = {
      performance: Math.round((lighthouse.categories.performance?.score || 0) * 100),
      accessibility: Math.round((lighthouse.categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((lighthouse.categories["best-practices"]?.score || 0) * 100),
      seo: Math.round((lighthouse.categories.seo?.score || 0) * 100),
    };

    // Extract key audits
    const audits: Record<string, { score: number; value: string }> = {};
    const auditKeys = [
      "first-contentful-paint",
      "largest-contentful-paint",
      "total-blocking-time",
      "cumulative-layout-shift",
      "speed-index",
      "interactive",
    ];

    for (const key of auditKeys) {
      if (lighthouse.audits[key]) {
        audits[key] = {
          score: lighthouse.audits[key].score,
          value: lighthouse.audits[key].displayValue || "",
        };
      }
    }

    return NextResponse.json({
      url: lighthouse.finalUrl,
      fetchTime: lighthouse.fetchTime,
      strategy,
      scores,
      audits,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Lighthouse check failed", details: String(error) },
      { status: 500 }
    );
  }
}

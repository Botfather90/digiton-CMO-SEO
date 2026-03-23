import { NextResponse } from "next/server";

const GITHUB_PAT = process.env.GITHUB_PAT || "";
const GITHUB_OWNER = process.env.GITHUB_OWNER || "Botfather90";
const GITHUB_REPO = process.env.GITHUB_REPO || "digiton-jarvis";
const WEBSITE_REPO = process.env.WEBSITE_REPO || "Digiton.ai";
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY || "";
const TARGET_URL = process.env.TARGET_WEBSITE_URL || "https://www.digiton.ai";

interface RankEntry {
  date: string;
  results: {
    keyword: string;
    position: number | null;
    url: string | null;
    target: number;
    change: number | null;
  }[];
}

interface OutreachEntry {
  date: string;
  type: string;
  target: string;
  email?: string;
  status: string;
}

/* ── Fetch rank history from repo ── */
async function fetchRankHistory(): Promise<RankEntry[]> {
  if (!GITHUB_PAT) return [];
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/money-runner/seo-rank-history.json`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3.raw" } }
    );
    if (!r.ok) return [];
    return JSON.parse(await r.text());
  } catch {
    return [];
  }
}

/* ── Fetch outreach log from repo ── */
async function fetchOutreachLog(): Promise<OutreachEntry[]> {
  if (!GITHUB_PAT) return [];
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/money-runner/seo-outreach-log.json`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3.raw" } }
    );
    if (!r.ok) return [];
    return JSON.parse(await r.text());
  } catch {
    return [];
  }
}

/* ── Fetch blog count from repo ── */
async function fetchBlogCount(): Promise<number> {
  if (!GITHUB_PAT) return 0;
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${WEBSITE_REPO}/contents/public/blog`,
      { headers: { Authorization: `token ${GITHUB_PAT}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (!r.ok) return 0;
    const files = await r.json();
    return Array.isArray(files) ? files.filter((f: { name: string }) => f.name.endsWith(".json")).length : 0;
  } catch {
    return 0;
  }
}

/* ── Quick Lighthouse score ── */
async function fetchLighthouseScore(): Promise<{ performance: number; seo: number } | null> {
  try {
    const apiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    apiUrl.searchParams.set("url", TARGET_URL);
    apiUrl.searchParams.set("strategy", "desktop");
    apiUrl.searchParams.set("category", "PERFORMANCE");
    apiUrl.searchParams.append("category", "SEO");
    if (GOOGLE_API_KEY) apiUrl.searchParams.set("key", GOOGLE_API_KEY);

    const r = await fetch(apiUrl.toString(), { next: { revalidate: 3600 } });
    if (!r.ok) return null;
    const data = await r.json();
    const lh = data.lighthouseResult;
    return {
      performance: Math.round((lh?.categories?.performance?.score || 0) * 100),
      seo: Math.round((lh?.categories?.seo?.score || 0) * 100),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const [rankHistory, outreachLog, blogCount, lighthouse] = await Promise.all([
      fetchRankHistory(),
      fetchOutreachLog(),
      fetchBlogCount(),
      fetchLighthouseScore(),
    ]);

    // Calculate rank stats
    const latestRanks = rankHistory.length > 0 ? rankHistory[rankHistory.length - 1] : null;
    const rankedKeywords = latestRanks?.results.filter((r) => r.position !== null) || [];
    const page1Keywords = rankedKeywords.filter((r) => r.position! <= 10);
    const quickWins = rankedKeywords.filter((r) => r.position! >= 5 && r.position! <= 15);

    // Outreach stats
    const sentOutreach = outreachLog.filter((e) => e.status === "sent");
    const pendingOutreach = outreachLog.filter((e) => e.status === "pending");
    const guestPosts = sentOutreach.filter((e) => e.type === "guest_post");
    const directoryListings = sentOutreach.filter((e) => e.type === "directory_listing" || e.type === "directory");
    const resourcePages = sentOutreach.filter((e) => e.type === "resource_page");

    return NextResponse.json({
      seo: {
        lighthousePerformance: lighthouse?.performance ?? null,
        lighthouseSeo: lighthouse?.seo ?? null,
        totalKeywordsTracked: latestRanks?.results.length || 0,
        keywordsRanking: rankedKeywords.length,
        page1Keywords: page1Keywords.length,
        quickWins: quickWins.length,
        topKeywords: rankedKeywords
          .sort((a, b) => (a.position || 100) - (b.position || 100))
          .slice(0, 5)
          .map((r) => ({ keyword: r.keyword, position: r.position })),
      },
      content: {
        publishedBlogs: blogCount,
        rankChecks: rankHistory.length,
        lastRankCheck: latestRanks ? rankHistory[rankHistory.length - 1].date : null,
      },
      outreach: {
        totalSent: sentOutreach.length,
        pending: pendingOutreach.length,
        guestPosts: guestPosts.length,
        directoryListings: directoryListings.length,
        resourcePages: resourcePages.length,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch SEO stats", details: String(error) },
      { status: 500 }
    );
  }
}

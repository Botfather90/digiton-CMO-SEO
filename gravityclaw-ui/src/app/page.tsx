"use client";

import { useState, useEffect, useCallback } from "react";

/* ── AUTH ── */
const AUTH_COOKIE = "gc-auth";
const AUTH_PASSWORD = "L3!";

function getCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name: string, value: string, days = 30) {
  const d = new Date();
  d.setTime(d.getTime() + days * 86400000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/* ── TYPES ── */
type Tab = "overview" | "apps" | "agents" | "skills" | "files" | "logs" | "config" | "chat";

interface VercelApp {
  name: string;
  url: string;
  framework: string;
  repo: string;
  status: "ready" | "error" | "building";
  updatedAt?: string;
}

interface GitHubRepo {
  name: string;
  fullName: string;
  private: boolean;
  description: string;
  language: string;
  homepage: string;
  url: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

interface Agent {
  name: string;
  role: string;
  description: string;
  soulPreview: string;
  status: "online" | "idle" | "offline";
  hasIdentity: boolean;
  hasHeartbeat: boolean;
  hasSessions: boolean;
  lastActivity?: string;
}

interface FileEntry {
  name: string;
  isDir: boolean;
  size: number;
  modified: string;
}

interface PrivacyFlag {
  category: string;
  severity: "info" | "warning" | "danger";
  pattern: string;
  context: string;
}

interface PrivacyAudit {
  score: number;
  level: "clean" | "low" | "medium" | "high" | "critical";
  flags: PrivacyFlag[];
  summary: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  risk: string;
  source: string;
  dateAdded: string;
  bodyPreview: string;
  privacy: PrivacyAudit;
}

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  ts: number;
}

/* ── VERCEL APPS (fetched live from API) ── */

const FRAMEWORK_COLORS: Record<string, string> = {
  nextjs: "#0070f3",
  vite: "#646cff",
  static: "#888",
  unknown: "#555",
};

const FRAMEWORK_LABELS: Record<string, string> = {
  nextjs: "Next.js",
  vite: "Vite",
  static: "Static",
  unknown: "Other",
};

/* ── SVG ICONS (no emojis) ── */
const Icons = {
  grid: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5" />
      <rect x="9" y="1" width="6" height="6" rx="1.5" />
      <rect x="1" y="9" width="6" height="6" rx="1.5" />
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
    </svg>
  ),
  agents: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  folder: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4v8a1.5 1.5 0 001.5 1.5h9A1.5 1.5 0 0014 12V6.5A1.5 1.5 0 0012.5 5H8L6.5 3H3.5A1.5 1.5 0 002 4z" />
    </svg>
  ),
  terminal: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 5l3 3-3 3" />
      <path d="M9 11h4" />
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  ),
  skills: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1l2 3h4l-3 3 1.5 4L8 9l-4.5 2L5 7 2 4h4z" />
    </svg>
  ),
  chat: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 3V4a1 1 0 011-1z" />
    </svg>
  ),
  rocket: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.5 13.5l-2-2M6.5 10.5l-2-2M12 4c-1.5 0-4 .5-5.5 3l-3 1 4.5 4.5 1-3C12 8 12.5 5.5 12 4z" />
      <circle cx="9.5" cy="6.5" r="1" />
      <path d="M4 12l-1.5 1.5" />
    </svg>
  ),
  externalLink: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 3H3v10h10v-3M9 2h5v5M14 2L7 9" />
    </svg>
  ),
  file: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 1.5h5.5L13 5v9.5a1 1 0 01-1 1H4a1 1 0 01-1-1v-13a1 1 0 011-1z" />
      <path d="M9.5 1.5V5H13" />
    </svg>
  ),
  folderSmall: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M2 4.5v7a1 1 0 001 1h10a1 1 0 001-1V6.5a1 1 0 00-1-1H8.5l-1.5-1.5H3a1 1 0 00-1 1z" />
    </svg>
  ),
  back: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 3L5 8l5 5" />
    </svg>
  ),
  send: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2L7 9M14 2l-4 12-3-5-5-3z" />
    </svg>
  ),
};

/* ── NAV CONFIG ── */
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: Icons.grid },
  { id: "apps", label: "Apps", icon: Icons.rocket },
  { id: "agents", label: "Agents", icon: Icons.agents },
  { id: "skills", label: "Skills", icon: Icons.skills },
  { id: "files", label: "Files", icon: Icons.folder },
  { id: "logs", label: "Logs", icon: Icons.terminal },
  { id: "config", label: "Config", icon: Icons.settings },
  { id: "chat", label: "Chat", icon: Icons.chat },
];

/* ── HELPERS ── */
function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function timeAgo(iso: string): string {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function syntaxHighlight(json: string): string {
  return json
    .replace(/("[\w./-]+")\s*:/g, '<span class="config-key">$1</span>:')
    .replace(/:\s*(".*?")/g, ': <span class="config-string">$1</span>')
    .replace(/:\s*(\d+)/g, ': <span class="config-number">$1</span>')
    .replace(/:\s*(true|false)/g, ': <span class="config-number">$1</span>');
}

function agentInitials(name: string): string {
  return name
    .split("-")
    .map((s) => s[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 3);
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════ */
export default function GravityClaw() {
  /* ── AUTH STATE ── */
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState("");
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (getCookie(AUTH_COOKIE) === AUTH_PASSWORD) setAuthed(true);
  }, []);

  const handleLogin = () => {
    if (passInput === AUTH_PASSWORD) {
      setCookie(AUTH_COOKIE, AUTH_PASSWORD);
      setAuthed(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPassInput("");
    }
  };

  const handleLogout = () => {
    deleteCookie(AUTH_COOKIE);
    setAuthed(false);
    setPassInput("");
  };

  const [tab, setTab] = useState<Tab>("overview");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [filePath, setFilePath] = useState<string[]>([]);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [logType, setLogType] = useState("gateway");
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  /* Live apps & repos */
  const [liveApps, setLiveApps] = useState<VercelApp[]>([]);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [appsLastFetched, setAppsLastFetched] = useState<string>("");

  /* Skills state */
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [skillSource, setSkillSource] = useState<"all" | "community" | "official">("all");
  const [privacyFilter, setPrivacyFilter] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  /* SEO + Lighthouse state */
  const [seoStats, setSeoStats] = useState<Record<string, any> | null>(null);
  const [lighthouseScores, setLighthouseScores] = useState<{ performance: number; accessibility: number; bestPractices: number; seo: number } | null>(null);
  const [lighthouseLoading, setLighthouseLoading] = useState(false);
  const [lighthouseUrl, setLighthouseUrl] = useState("https://www.digiton.ai");

  /* ── DATA FETCHERS ── */
  const fetchAgents = useCallback(async () => {
    try {
      const r = await fetch("/api/agents");
      const d = await r.json();
      if (d.agents) setAgents(d.agents);
    } catch { /* silent */ }
  }, []);

  const fetchFiles = useCallback(async (path: string) => {
    try {
      setFileContent(null);
      const r = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const d = await r.json();
      if (d.type === "directory") {
        setFiles(d.items || []);
      } else if (d.type === "file") {
        setFileContent(d.content);
      }
    } catch { /* silent */ }
  }, []);

  const fetchLogs = useCallback(async (type: string) => {
    try {
      const r = await fetch(`/api/logs?type=${type}&lines=300`);
      const d = await r.json();
      setLogs(d.content || "No logs available.");
    } catch { /* silent */ }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const r = await fetch("/api/config");
      const d = await r.json();
      if (d.config) setConfig(d.config);
    } catch { /* silent */ }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const r = await fetch("/api/skills");
      const d = await r.json();
      if (d.skills) setSkills(d.skills);
    } catch { /* silent */ }
  }, []);

  /* ── LIVE APPS FETCHER ── */
  const fetchLiveApps = useCallback(async () => {
    try {
      const r = await fetch("/api/apps");
      const d = await r.json();
      if (d.vercelApps) setLiveApps(d.vercelApps);
      if (d.githubRepos) setGithubRepos(d.githubRepos);
      if (d.fetchedAt) setAppsLastFetched(d.fetchedAt);
    } catch { /* silent */ }
  }, []);

  /* ── SEO STATS FETCHER ── */
  const fetchSeoStats = useCallback(async () => {
    try {
      const r = await fetch("/api/seo-stats");
      const d = await r.json();
      if (!d.error) setSeoStats(d);
    } catch { /* silent */ }
  }, []);

  /* ── LIGHTHOUSE FETCHER ── */
  const runLighthouse = useCallback(async (url?: string) => {
    setLighthouseLoading(true);
    try {
      const targetUrl = url || lighthouseUrl;
      const r = await fetch(`/api/lighthouse?url=${encodeURIComponent(targetUrl)}`);
      const d = await r.json();
      if (d.scores) setLighthouseScores(d.scores);
    } catch { /* silent */ }
    setLighthouseLoading(false);
  }, [lighthouseUrl]);

  /* ── EFFECTS ── */
  useEffect(() => {
    if (!authed) return; // Don't fetch until authenticated
    fetchAgents();
    fetchLiveApps();
    fetchSeoStats();
    fetchSkills();
    const iv = setInterval(fetchAgents, 15000);
    const iv2 = setInterval(fetchLiveApps, 60000);
    const iv3 = setInterval(fetchSeoStats, 300000); // every 5 min
    return () => { clearInterval(iv); clearInterval(iv2); clearInterval(iv3); };
  }, [authed, fetchAgents, fetchLiveApps, fetchSeoStats, fetchSkills]);

  useEffect(() => {
    if (authed && tab === "files") fetchFiles(filePath.join("/"));
  }, [authed, tab, filePath, fetchFiles]);

  useEffect(() => {
    if (authed && tab === "logs") fetchLogs(logType);
  }, [authed, tab, logType, fetchLogs]);

  useEffect(() => {
    if (authed && tab === "config") fetchConfig();
  }, [authed, tab, fetchConfig]);

  useEffect(() => {
    if (authed && tab === "skills" && skills.length === 0) fetchSkills();
  }, [authed, tab, skills.length, fetchSkills]);

  /* ── FILE NAVIGATION ── */
  const navigateFile = (name: string, isDir: boolean) => {
    if (isDir) {
      setFilePath((p) => [...p, name]);
    } else {
      fetchFiles([...filePath, name].join("/"));
    }
  };

  const navigateUp = () => {
    setFilePath((p) => p.slice(0, -1));
    setFileContent(null);
  };

  const navigateTo = (idx: number) => {
    setFilePath((p) => p.slice(0, idx));
    setFileContent(null);
  };

  /* ── CHAT ── */
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput("");
    setChatMessages((m) => [...m, { role: "user", content: msg, ts: Date.now() }]);
    setChatLoading(true);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const d = await r.json();
      setChatMessages((m) => [
        ...m,
        { role: "agent", content: d.response || d.error || "No response.", ts: Date.now() },
      ]);
    } catch {
      setChatMessages((m) => [
        ...m,
        { role: "agent", content: "Gateway unreachable.", ts: Date.now() },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ══════════════════════════════════════════════════
     RENDER: OVERVIEW
     ══════════════════════════════════════════════════ */
  const renderOverview = () => {
    const onlineCount = agents.filter((a) => a.status === "online").length;
    const heartbeats = agents.filter((a) => a.hasHeartbeat).length;
    const VERCEL_APPS = liveApps;

    const scoreColor = (score: number) => {
      if (score >= 90) return "#22c55e";
      if (score >= 50) return "#f59e0b";
      return "#ef4444";
    };

    return (
      <div className="tab-content" key="overview">
        {/* Metric strip */}
        <div className="bento bento-4" style={{ marginBottom: 24 }}>
          <div className="card card-compact metric">
            <div className="label">Active Agents</div>
            <div className="value accent">{onlineCount}/{agents.length}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">Vercel Apps</div>
            <div className="value accent">{liveApps.length}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">GitHub Repos</div>
            <div className="value">{githubRepos.length}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">Skills Loaded</div>
            <div className="value">{skills.length || "—"}</div>
          </div>
        </div>

        {/* Lighthouse Scores */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Lighthouse Audit</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="text"
                value={lighthouseUrl}
                onChange={(e) => setLighthouseUrl(e.target.value)}
                placeholder="https://your-site.com"
                style={{
                  padding: "6px 12px", fontSize: 12, fontFamily: "var(--font-mono)",
                  background: "var(--surface-2)", border: "1px solid var(--border-subtle)",
                  borderRadius: 8, color: "var(--text-secondary)", outline: "none", width: 240,
                }}
              />
              <button
                onClick={() => runLighthouse()}
                disabled={lighthouseLoading}
                style={{
                  background: lighthouseLoading ? "var(--surface-2)" : "var(--accent)",
                  border: "none", color: lighthouseLoading ? "var(--text-tertiary)" : "#000",
                  fontSize: 11, fontWeight: 600, padding: "7px 16px",
                  borderRadius: 999, cursor: lighthouseLoading ? "wait" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {lighthouseLoading ? "Running..." : "Run Audit"}
              </button>
            </div>
          </div>
          <div className="bento bento-4">
            {(["performance", "accessibility", "bestPractices", "seo"] as const).map((key) => {
              const labels: Record<string, string> = { performance: "Performance", accessibility: "Accessibility", bestPractices: "Best Practices", seo: "SEO" };
              const score = lighthouseScores?.[key];
              return (
                <div className="card card-compact metric" key={key}>
                  <div className="label">{labels[key]}</div>
                  <div className="value" style={{ color: score != null ? scoreColor(score) : "var(--text-tertiary)" }}>
                    {score != null ? score : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SEO Intelligence */}
        {seoStats && (
          <div style={{ marginBottom: 24 }}>
            <div className="section-label">SEO Intelligence</div>
            <div className="bento bento-4" style={{ marginBottom: 12 }}>
              <div className="card card-compact metric">
                <div className="label">Keywords Tracked</div>
                <div className="value">{seoStats.seo?.totalKeywordsTracked || 0}</div>
              </div>
              <div className="card card-compact metric">
                <div className="label">Page 1 Keywords</div>
                <div className="value accent">{seoStats.seo?.page1Keywords || 0}</div>
              </div>
              <div className="card card-compact metric">
                <div className="label">Blogs Published</div>
                <div className="value">{seoStats.content?.publishedBlogs || 0}</div>
              </div>
              <div className="card card-compact metric">
                <div className="label">Outreach Sent</div>
                <div className="value">{seoStats.outreach?.totalSent || 0}</div>
              </div>
            </div>
            {seoStats.seo?.topKeywords?.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Top Ranking Keywords
                </div>
                {seoStats.seo.topKeywords.map((kw: { keyword: string; position: number }, i: number) => (
                  <div key={kw.keyword} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: i < seoStats.seo.topKeywords.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{kw.keyword}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: kw.position <= 3 ? "#22c55e" : kw.position <= 10 ? "var(--accent)" : "var(--text-tertiary)" }}>#{kw.position}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Agent cards + Intel */}
        <div className="bento bento-2-1">
          <div>
            <div className="section-label">Agent Roster</div>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              {agents.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>
                  No agents detected
                </div>
              ) : (
                agents.map((a) => (
                  <div className="agent-row" key={a.name}>
                    <div className="agent-avatar">{agentInitials(a.name)}</div>
                    <div className="agent-info">
                      <div className="agent-name">{a.name.toUpperCase()}</div>
                      <div className="agent-role">{a.role}</div>
                    </div>
                    <div className="agent-status">
                      <span className={`status-dot ${a.status === "online" ? "" : a.status === "idle" ? "idle" : "offline"}`} />
                      {a.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="section-label">System Intel</div>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Platform</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>GravityClaw v1.0</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Agents</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{agents.length} registered ({onlineCount} online)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Deployments</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{liveApps.length} Vercel apps</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Runtime</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>Next.js / Turbopack</div>
              </div>
            </div>
          </div>
        </div>

        {/* Deployed Apps Quick Access */}
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Deployed Apps</div>
            <button
              onClick={() => setTab("apps")}
              style={{
                background: "none", border: "1px solid var(--border-subtle)", color: "var(--accent)",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", padding: "6px 14px",
                borderRadius: 999, cursor: "pointer", transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-dim)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "none"; }}
            >
              View all {VERCEL_APPS.length} →
            </button>
          </div>
          <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {VERCEL_APPS.slice(0, 8).map((app) => (
              <a
                key={app.url}
                href={`https://${app.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-compact vercel-app-mini"
                style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="status-dot" style={{ width: 6, height: 6 }} />
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                    color: FRAMEWORK_COLORS[app.framework] || FRAMEWORK_COLORS.unknown,
                  }}>
                    {FRAMEWORK_LABELS[app.framework] || app.framework}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{app.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {app.url.replace("-brandons-projects-e64ccab1.vercel.app", ".vercel.app")}
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ══════════════════════════════════════════════════
     RENDER: AGENTS
     ══════════════════════════════════════════════════ */
  const renderAgents = () => (
    <div className="tab-content" key="agents">
      <div className="section-label">All Agents</div>
      <div className="bento bento-2" style={{ marginBottom: 24 }}>
        {agents.map((a) => (
          <div
            className={`card ${selectedAgent?.name === a.name ? "card-accent" : ""}`}
            key={a.name}
            style={{ cursor: "pointer" }}
            onClick={() => setSelectedAgent(selectedAgent?.name === a.name ? null : a)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <div className="agent-avatar">{agentInitials(a.name)}</div>
              <div>
                <div className="agent-name">{a.name.toUpperCase()}</div>
                <div className="agent-role">{a.role}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <span className={`status-dot ${a.status === "online" ? "" : a.status === "idle" ? "idle" : "offline"}`} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12 }}>
              {a.description}
            </div>
            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              <span>Identity: {a.hasIdentity ? "set" : "none"}</span>
              <span>Heartbeat: {a.hasHeartbeat ? "active" : "none"}</span>
              <span>Sessions: {a.hasSessions ? "yes" : "no"}</span>
            </div>
            {selectedAgent?.name === a.name && a.soulPreview && (
              <div className="soul-preview">{a.soulPreview}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER: FILES
     ══════════════════════════════════════════════════ */
  const renderFiles = () => (
    <div className="tab-content" key="files">
      <div className="section-label">Workspace Files</div>

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <button onClick={() => navigateTo(0)}>/workspace</button>
        {filePath.map((seg, i) => (
          <span key={i}>
            <span className="sep">/</span>
            <button onClick={() => navigateTo(i + 1)}>{seg}</button>
          </span>
        ))}
      </div>

      <div className="card" style={{ padding: 8 }}>
        {fileContent !== null ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 8 }}>
              <button
                onClick={() => { setFileContent(null); fetchFiles(filePath.join("/")); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "var(--font-mono)" }}
              >
                {Icons.back} back
              </button>
            </div>
            <div className="file-content-viewer">{fileContent}</div>
          </>
        ) : (
          <>
            {filePath.length > 0 && (
              <div className="file-row" onClick={navigateUp} style={{ color: "var(--text-tertiary)" }}>
                <span className="file-icon">{Icons.back}</span>
                <span className="file-name">..</span>
              </div>
            )}
            {files.map((f) => (
              <div className="file-row" key={f.name} onClick={() => navigateFile(f.name, f.isDir)}>
                <span className="file-icon">{f.isDir ? Icons.folderSmall : Icons.file}</span>
                <span className="file-name">{f.name}</span>
                <span className="file-meta">
                  {f.isDir ? "" : formatBytes(f.size)}
                </span>
                <span className="file-meta">{timeAgo(f.modified)}</span>
              </div>
            ))}
            {files.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
                Empty directory
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER: LOGS
     ══════════════════════════════════════════════════ */
  const renderLogs = () => (
    <div className="tab-content" key="logs">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div className="section-label" style={{ marginBottom: 0 }}>Gateway Logs</div>
        <button
          onClick={() => fetchLogs(logType)}
          style={{
            background: "none",
            border: "1px solid var(--border-subtle)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 11,
            fontWeight: 500,
            color: "var(--text-secondary)",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      <div className="filter-row">
        {["gateway", "error", "config-audit"].map((t) => (
          <button
            key={t}
            className={`filter-pill ${logType === t ? "active" : ""}`}
            onClick={() => setLogType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="log-viewer">{logs || "Loading..."}</div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER: CONFIG
     ══════════════════════════════════════════════════ */
  const renderConfig = () => (
    <div className="tab-content" key="config">
      <div className="section-label">System Configuration</div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {config ? (
          <div
            className="config-viewer"
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(JSON.stringify(config, null, 2)),
            }}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)", fontSize: 13 }}>
            Loading configuration...
          </div>
        )}
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER: CHAT
     ══════════════════════════════════════════════════ */
  const renderChat = () => (
    <div className="tab-content" key="chat">
      <div className="section-label">Agent Communication</div>
      <div className="chat-container">
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="empty-state">
              <div className="icon">{Icons.chat}</div>
              <h3>Start a conversation</h3>
              <p>Send a message to the GravityClaw agent via the AI gateway</p>
            </div>
          )}
          {chatMessages.map((m, i) => (
            <div className={`chat-bubble ${m.role}`} key={i}>
              {m.content}
            </div>
          ))}
          {chatLoading && (
            <div className="chat-bubble agent" style={{ opacity: 0.5 }}>
              Processing...
            </div>
          )}
        </div>
        <div className="chat-input-bar">
          <input
            className="chat-input"
            placeholder="Type a command or message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendChat()}
          />
          <button className="chat-send-btn" onClick={sendChat} disabled={!chatInput.trim() || chatLoading}>
            Send
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════
     RENDER: SKILLS
     ══════════════════════════════════════════════════ */
  const renderSkills = () => {
    const q = skillSearch.toLowerCase();
    const filtered = skills.filter((s) => {
      if (skillSource !== "all" && s.source !== skillSource) return false;
      if (privacyFilter && s.privacy && (s.privacy.level === "clean" || s.privacy.level === "low")) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.description.toLowerCase().includes(q)) return false;
      return true;
    });

    const riskColor = (r: string) => {
      if (r === "low") return "var(--green)";
      if (r === "medium") return "var(--amber, #f59e0b)";
      if (r === "high") return "var(--red, #ef4444)";
      return "var(--text-tertiary)";
    };

    const privacyLevelColor = (level: string) => {
      switch (level) {
        case "clean": return "#22c55e";
        case "low": return "#84cc16";
        case "medium": return "#f59e0b";
        case "high": return "#ef4444";
        case "critical": return "#dc2626";
        default: return "#6b7280";
      }
    };

    const privacyLevelIcon = (level: string) => {
      switch (level) {
        case "clean": return "✓";
        case "low": return "○";
        case "medium": return "◑";
        case "high": return "●";
        case "critical": return "◉";
        default: return "?";
      }
    };

    const categoryLabel = (cat: string) => cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    const severityChipColor = (sev: string) => {
      if (sev === "danger") return { bg: "rgba(239,68,68,0.15)", text: "#ef4444" };
      if (sev === "warning") return { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" };
      return { bg: "rgba(107,114,128,0.15)", text: "#9ca3af" };
    };

    // Privacy summary counts
    const privacyCounts = { clean: 0, low: 0, medium: 0, high: 0, critical: 0 };
    skills.forEach(s => {
      if (s.privacy) privacyCounts[s.privacy.level]++;
    });
    const hasAnyConcerns = privacyCounts.medium + privacyCounts.high + privacyCounts.critical > 0;

    if (selectedSkill) {
      const p = selectedSkill.privacy;
      const groupedFlags: Record<string, PrivacyFlag[]> = {};
      if (p?.flags) {
        for (const f of p.flags) {
          if (!groupedFlags[f.category]) groupedFlags[f.category] = [];
          groupedFlags[f.category].push(f);
        }
      }

      return (
        <div className="tab-content" key="skill-detail">
          <button className="back-btn" onClick={() => setSelectedSkill(null)}>
            {Icons.back} <span>Back to Skills</span>
          </button>
          <div className="card" style={{ marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div className="skill-icon-lg">{selectedSkill.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 20, color: "var(--text-primary)" }}>{selectedSkill.name}</h2>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span className="skill-badge" style={{ background: "var(--surface-2)" }}>{selectedSkill.source}</span>
                  <span className="skill-badge" style={{ background: `${riskColor(selectedSkill.risk)}22`, color: riskColor(selectedSkill.risk) }}>
                    risk: {selectedSkill.risk}
                  </span>
                  {selectedSkill.dateAdded && (
                    <span className="skill-badge" style={{ background: "var(--surface-2)" }}>added {selectedSkill.dateAdded}</span>
                  )}
                </div>
              </div>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              {selectedSkill.description}
            </p>
            {selectedSkill.bodyPreview && selectedSkill.bodyPreview !== selectedSkill.description && (
              <p style={{ color: "var(--text-tertiary)", lineHeight: 1.6, marginTop: 12, fontSize: 13 }}>
                {selectedSkill.bodyPreview}
              </p>
            )}
          </div>

          {/* ── Privacy Audit Panel ── */}
          {p && (
            <div className="card privacy-audit-panel" style={{ marginTop: 12 }}>
              <div className="privacy-audit-header">
                <div className="privacy-audit-title">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 1L2 4v4c0 3.5 2.5 6.2 6 7 3.5-.8 6-3.5 6-7V4L8 1z" />
                  </svg>
                  <span>Privacy Audit</span>
                </div>
                <div className="privacy-score-pill" style={{ background: `${privacyLevelColor(p.level)}18`, color: privacyLevelColor(p.level), borderColor: `${privacyLevelColor(p.level)}40` }}>
                  <span className="privacy-score-icon">{privacyLevelIcon(p.level)}</span>
                  <span>{p.level.toUpperCase()}</span>
                  <span className="privacy-score-num">({p.score})</span>
                </div>
              </div>

              {/* Score bar */}
              <div className="privacy-score-bar-track">
                <div
                  className="privacy-score-bar-fill"
                  style={{ width: `${p.score}%`, background: privacyLevelColor(p.level) }}
                />
              </div>
              <div className="privacy-audit-summary">{p.summary}</div>

              {/* Grouped flags */}
              {Object.keys(groupedFlags).length > 0 && (
                <div className="privacy-flags-list">
                  {Object.entries(groupedFlags).map(([cat, flags]) => (
                    <div key={cat} className="privacy-flag-group">
                      <div className="privacy-flag-category">{categoryLabel(cat)}</div>
                      {flags.map((f, i) => {
                        const chip = severityChipColor(f.severity);
                        return (
                          <div key={i} className="privacy-flag-item">
                            <span className="privacy-severity-chip" style={{ background: chip.bg, color: chip.text }}>
                              {f.severity}
                            </span>
                            <span className="privacy-flag-pattern">{f.pattern}</span>
                            <span className="privacy-flag-context">{f.context}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="tab-content" key="skills">
        {/* Search + filters */}
        <div className="skills-toolbar">
          <input
            className="skills-search"
            placeholder="Search 1200+ skills..."
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
          />
          <div className="skills-filters">
            {(["all", "community", "official"] as const).map((src) => (
              <button
                key={src}
                className={`skill-filter-pill ${skillSource === src ? "active" : ""}`}
                onClick={() => setSkillSource(src)}
              >
                {src === "all" ? "All" : src.charAt(0).toUpperCase() + src.slice(1)}
              </button>
            ))}
            {hasAnyConcerns && (
              <button
                className={`skill-filter-pill privacy-filter-pill ${privacyFilter ? "active" : ""}`}
                onClick={() => setPrivacyFilter(!privacyFilter)}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M8 1L2 4v4c0 3.5 2.5 6.2 6 7 3.5-.8 6-3.5 6-7V4L8 1z" />
                </svg>
                Privacy Concerns
              </button>
            )}
          </div>
        </div>

        {/* Privacy summary bar */}
        {skills.length > 0 && (
          <div className="privacy-summary-bar">
            <span className="privacy-summary-item" style={{ color: "#22c55e" }}>{privacyCounts.clean} clean</span>
            <span className="privacy-summary-sep">·</span>
            <span className="privacy-summary-item" style={{ color: "#84cc16" }}>{privacyCounts.low} low</span>
            <span className="privacy-summary-sep">·</span>
            <span className="privacy-summary-item" style={{ color: "#f59e0b" }}>{privacyCounts.medium} medium</span>
            <span className="privacy-summary-sep">·</span>
            <span className="privacy-summary-item" style={{ color: "#ef4444" }}>{privacyCounts.high} high</span>
            <span className="privacy-summary-sep">·</span>
            <span className="privacy-summary-item" style={{ color: "#dc2626" }}>{privacyCounts.critical} critical</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, fontSize: 13, color: "var(--text-tertiary)" }}>
          <span>{filtered.length} skills</span>
          {q && <span>matching &ldquo;{skillSearch}&rdquo;</span>}
          {privacyFilter && <span>with privacy concerns</span>}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-tertiary)" }}>
            {skills.length === 0 ? "Loading skills..." : "No skills match your search."}
          </div>
        ) : (
          <div className="skills-grid">
            {filtered.map((s) => {
              const pl = s.privacy?.level || "clean";
              const plColor = privacyLevelColor(pl);
              return (
                <button
                  key={s.id}
                  className="skill-card"
                  onClick={() => setSelectedSkill(s)}
                >
                  <div className="skill-card-header">
                    <div className="skill-icon">{s.name.slice(0, 2).toUpperCase()}</div>
                    <div className="skill-card-meta">
                      <span className="skill-badge" style={{ background: "var(--surface-2)" }}>{s.source}</span>
                      <span className="skill-badge" style={{ background: `${riskColor(s.risk)}22`, color: riskColor(s.risk) }}>
                        {s.risk}
                      </span>
                      {pl !== "clean" && (
                        <span
                          className="privacy-badge"
                          style={{ background: `${plColor}18`, color: plColor, borderColor: `${plColor}40` }}
                          title={`Privacy: ${pl} (${s.privacy?.score || 0})`}
                        >
                          {privacyLevelIcon(pl)} {pl}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="skill-card-name">{s.name}</div>
                  <div className="skill-card-desc">{s.description.slice(0, 120)}{s.description.length > 120 ? "…" : ""}</div>
                  {/* Privacy mini-bar */}
                  {s.privacy && s.privacy.score > 0 && (
                    <div className="privacy-mini-bar-track">
                      <div className="privacy-mini-bar-fill" style={{ width: `${s.privacy.score}%`, background: plColor }} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ══════════════════════════════════════════════════
     MAIN RENDER
     ══════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════
     RENDER: APPS (Vercel Deployments)
     ══════════════════════════════════════════════════ */
  const [appsSearch, setAppsSearch] = useState("");
  const [appsFramework, setAppsFramework] = useState<string>("all");

  const renderApps = () => {
    const VERCEL_APPS = liveApps;
    const filtered = VERCEL_APPS.filter((app) => {
      const matchesSearch = app.name.toLowerCase().includes(appsSearch.toLowerCase()) ||
        app.url.toLowerCase().includes(appsSearch.toLowerCase()) ||
        app.repo.toLowerCase().includes(appsSearch.toLowerCase());
      const matchesFramework = appsFramework === "all" || app.framework === appsFramework;
      return matchesSearch && matchesFramework;
    });

    const frameworkCounts = VERCEL_APPS.reduce((acc, app) => {
      acc[app.framework] = (acc[app.framework] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="tab-content" key="apps">
        {/* Summary strip */}
        <div className="bento bento-4" style={{ marginBottom: 24 }}>
          <div className="card card-compact metric">
            <div className="label">Total Apps</div>
            <div className="value accent">{VERCEL_APPS.length}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">Next.js</div>
            <div className="value" style={{ color: FRAMEWORK_COLORS.nextjs }}>{frameworkCounts.nextjs || 0}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">Vite</div>
            <div className="value" style={{ color: FRAMEWORK_COLORS.vite }}>{frameworkCounts.vite || 0}</div>
          </div>
          <div className="card card-compact metric">
            <div className="label">Static</div>
            <div className="value" style={{ color: FRAMEWORK_COLORS.static }}>{frameworkCounts.static || 0}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search apps…"
            value={appsSearch}
            onChange={(e) => setAppsSearch(e.target.value)}
            className="apps-search-input"
          />
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "nextjs", "vite", "static"].map((fw) => (
              <button
                key={fw}
                className={`apps-filter-btn ${appsFramework === fw ? "active" : ""}`}
                onClick={() => setAppsFramework(fw)}
                style={appsFramework === fw ? { borderColor: FRAMEWORK_COLORS[fw] || "var(--accent)", color: FRAMEWORK_COLORS[fw] || "var(--accent)" } : {}}
              >
                {fw === "all" ? "All" : FRAMEWORK_LABELS[fw] || fw}
              </button>
            ))}
          </div>
        </div>

        {/* App grid */}
        <div className="section-label">Deployed Applications</div>
        <div className="apps-grid">
          {filtered.map((app) => (
            <a
              key={app.url}
              href={`https://${app.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card vercel-app-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="vercel-app-card-header">
                <div className="vercel-app-icon">
                  {app.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="status-dot" style={{ width: 6, height: 6 }} />
                  <span className="vercel-framework-badge" style={{ background: `${FRAMEWORK_COLORS[app.framework] || FRAMEWORK_COLORS.unknown}18`, color: FRAMEWORK_COLORS[app.framework] || FRAMEWORK_COLORS.unknown }}>
                    {FRAMEWORK_LABELS[app.framework] || app.framework}
                  </span>
                </div>
              </div>
              <div className="vercel-app-card-name">{app.name}</div>
              <div className="vercel-app-card-url">
                {Icons.externalLink}
                <span>{app.url.replace("-brandons-projects-e64ccab1.vercel.app", ".vercel.app").replace("-brandons-projects-e64ccab1", "")}</span>
              </div>
              {app.repo && (
                <div className="vercel-app-card-repo">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                  <span>{app.repo}</span>
                </div>
              )}
            </a>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-tertiary)", fontSize: 14 }}>
            No apps match your search
          </div>
        )}
      </div>
    );
  };

  const renderTab = () => {
    switch (tab) {
      case "overview": return renderOverview();
      case "apps": return renderApps();
      case "agents": return renderAgents();
      case "skills": return renderSkills();
      case "files": return renderFiles();
      case "logs": return renderLogs();
      case "config": return renderConfig();
      case "chat": return renderChat();
    }
  };

  /* ── PASSWORD GATE ── */
  if (!authed) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 380,
            padding: "48px 36px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <div className="brand" style={{ fontSize: 22, marginBottom: 4 }}>GravityClaw</div>
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Control Center Access</div>
          </div>

          <input
            type="password"
            placeholder="Enter password"
            value={passInput}
            onChange={(e) => { setPassInput(e.target.value); setAuthError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            autoFocus
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: "var(--font-mono)",
              background: "var(--surface-2)",
              border: authError ? "1px solid #ef4444" : "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              borderRadius: 10,
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 12,
              letterSpacing: "0.2em",
              transition: "border-color 0.2s ease",
            }}
          />

          {authError && (
            <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>
              Incorrect password
            </div>
          )}

          <button
            onClick={handleLogin}
            style={{
              width: "100%",
              padding: "12px 0",
              fontSize: 14,
              fontWeight: 600,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── HEADER ── */}
      <div className="page-header">
        <div className="brand">GravityClaw</div>
        <h1>Control Center</h1>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{
            marginLeft: "auto",
            background: "none",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
            fontSize: 11,
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: 999,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="1" width="10" height="14" rx="2" />
            <path d="M6 6h0M6 8h4M6 10h4" />
          </svg>
          Logout
        </button>
      </div>

      {/* ── FLOATING NAV ── */}
      <nav className="nav-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ── CONTENT ── */}
      {renderTab()}
    </div>
  );
}

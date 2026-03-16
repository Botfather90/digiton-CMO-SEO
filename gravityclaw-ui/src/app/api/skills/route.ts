import { NextResponse } from "next/server";
import { readFile, readdir, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const SKILLS_DIR = join(
  process.env.HOME || "/Users/brandonwilliam",
  ".gemini",
  "antigravity",
  "skills"
);

/* ── TYPES ── */
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

interface SkillInfo {
  id: string;
  name: string;
  description: string;
  risk: string;
  source: string;
  dateAdded: string;
  bodyPreview: string;
  privacy: PrivacyAudit;
}

/* ── PRIVACY THREAT PATTERNS ── */
interface ThreatPattern {
  category: string;
  severity: "info" | "warning" | "danger";
  regex: RegExp;
  label: string;
}

const THREAT_PATTERNS: ThreatPattern[] = [
  // ── Credential Access ──
  { category: "credential_access", severity: "danger",  regex: /\.ssh\b/gi,                     label: "SSH key access" },
  { category: "credential_access", severity: "danger",  regex: /\.env\b/gi,                      label: ".env file access" },
  { category: "credential_access", severity: "danger",  regex: /keychain/gi,                     label: "Keychain access" },
  { category: "credential_access", severity: "danger",  regex: /credentials?\b/gi,               label: "Credential reference" },
  { category: "credential_access", severity: "warning", regex: /api[_-]?key/gi,                  label: "API key reference" },
  { category: "credential_access", severity: "warning", regex: /access[_-]?token/gi,             label: "Access token reference" },
  { category: "credential_access", severity: "danger",  regex: /cookies\.sqlite/gi,              label: "Browser cookies access" },
  { category: "credential_access", severity: "danger",  regex: /\.gnupg/gi,                      label: "GPG key access" },
  { category: "credential_access", severity: "warning", regex: /\bsecret[_-]?key\b/gi,           label: "Secret key reference" },
  { category: "credential_access", severity: "warning", regex: /\bpassword\b/gi,                 label: "Password reference" },
  { category: "credential_access", severity: "danger",  regex: /aws[_-]?(secret|access)/gi,      label: "AWS credential reference" },

  // ── Data Exfiltration ──
  { category: "data_exfiltration", severity: "warning", regex: /\bcurl\b/gi,                     label: "curl HTTP client" },
  { category: "data_exfiltration", severity: "warning", regex: /\bwget\b/gi,                     label: "wget download" },
  { category: "data_exfiltration", severity: "danger",  regex: /Invoke-WebRequest/gi,            label: "PowerShell web request" },
  { category: "data_exfiltration", severity: "danger",  regex: /Invoke-RestMethod/gi,            label: "PowerShell REST call" },
  { category: "data_exfiltration", severity: "danger",  regex: /\bscp\b/gi,                      label: "SCP file transfer" },
  { category: "data_exfiltration", severity: "danger",  regex: /\bftp\b/gi,                      label: "FTP transfer" },
  { category: "data_exfiltration", severity: "danger",  regex: /curl\s.*\|\s*bash/gi,            label: "Pipe-to-bash execution" },
  { category: "data_exfiltration", severity: "danger",  regex: /iwr\s.*\|\s*iex/gi,              label: "PowerShell pipe-to-execute" },

  // ── Privilege Escalation ──
  { category: "privilege_escalation", severity: "danger",  regex: /\bsudo\b/gi,                   label: "sudo invocation" },
  { category: "privilege_escalation", severity: "warning", regex: /\bchmod\b/gi,                  label: "File permission change" },
  { category: "privilege_escalation", severity: "warning", regex: /\bchown\b/gi,                  label: "File ownership change" },
  { category: "privilege_escalation", severity: "danger",  regex: /Set-ExecutionPolicy/gi,        label: "PowerShell policy override" },
  { category: "privilege_escalation", severity: "danger",  regex: /\bicacls\b/gi,                 label: "Windows ACL manipulation" },
  { category: "privilege_escalation", severity: "warning", regex: /chmod\s+\+x/gi,               label: "Make file executable" },
  { category: "privilege_escalation", severity: "danger",  regex: /chmod\s+000/gi,                label: "Lock file permissions" },

  // ── Config Poisoning ──
  { category: "config_poisoning", severity: "danger",  regex: /CLAUDE\.md/gi,                    label: "Agent config modification" },
  { category: "config_poisoning", severity: "danger",  regex: /MEMORY\.md/gi,                    label: "Agent memory modification" },
  { category: "config_poisoning", severity: "danger",  regex: /settings\.json/gi,                label: "Settings file modification" },
  { category: "config_poisoning", severity: "danger",  regex: /\.mcp\.json/gi,                   label: "MCP config modification" },
  { category: "config_poisoning", severity: "warning", regex: /\.bashrc|\.zshrc|\.bash_profile/gi, label: "Shell config modification" },
  { category: "config_poisoning", severity: "danger",  regex: /git\s+hooks?/gi,                  label: "Git hooks modification" },

  // ── Code Execution ──
  { category: "code_execution", severity: "danger",  regex: /\beval\s*\(/gi,                     label: "eval() execution" },
  { category: "code_execution", severity: "danger",  regex: /\bexec\s*\(/gi,                     label: "exec() execution" },
  { category: "code_execution", severity: "danger",  regex: /shell\s*=\s*True/gi,                label: "Shell injection risk" },
  { category: "code_execution", severity: "warning", regex: /cmd\.exe/gi,                        label: "Windows command shell" },
  { category: "code_execution", severity: "warning", regex: /powershell\b/gi,                    label: "PowerShell invocation" },
  { category: "code_execution", severity: "danger",  regex: /ExecutionPolicy\s+Bypass/gi,        label: "Bypass execution policy" },

  // ── Persistence ──
  { category: "persistence", severity: "danger",  regex: /\bcrontab\b/gi,                        label: "Cron job persistence" },
  { category: "persistence", severity: "danger",  regex: /\blaunchctl\b/gi,                      label: "macOS LaunchAgent" },
  { category: "persistence", severity: "danger",  regex: /\bsystemd\b/gi,                        label: "systemd service" },
  { category: "persistence", severity: "danger",  regex: /reg\s+add.*Run/gi,                     label: "Windows registry Run key" },
  { category: "persistence", severity: "danger",  regex: /\bschtasks\b/gi,                       label: "Windows scheduled task" },
  { category: "persistence", severity: "warning", regex: /\.plist\b/gi,                           label: "macOS plist reference" },

  // ── Network Recon ──
  { category: "network_recon", severity: "warning", regex: /\bnmap\b/gi,                         label: "Network scanner" },
  { category: "network_recon", severity: "danger",  regex: /\bnetcat\b|\bnc\s+-/gi,              label: "Netcat connection" },
  { category: "network_recon", severity: "danger",  regex: /\bsocat\b/gi,                        label: "Socket relay" },
  { category: "network_recon", severity: "warning", regex: /\bshodan\b/gi,                       label: "Shodan device search" },
  { category: "network_recon", severity: "warning", regex: /192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+/gi, label: "Internal IP reference" },
  { category: "network_recon", severity: "danger",  regex: /reverse\s*shell/gi,                  label: "Reverse shell" },

  // ── Obfuscation ──
  { category: "obfuscation", severity: "warning", regex: /\bbase64\b/gi,                         label: "Base64 encoding" },
  { category: "obfuscation", severity: "warning", regex: /\batob\s*\(/gi,                        label: "atob() decoding" },
  { category: "obfuscation", severity: "danger",  regex: /\bxor\b/gi,                            label: "XOR encoding" },
  { category: "obfuscation", severity: "warning", regex: /\\x[0-9a-f]{2}/gi,                     label: "Hex-encoded bytes" },
];

/* Security-related skill name keywords (for false-positive reduction) */
const SECURITY_KEYWORDS = /\b(pentest|security|audit|vulnerability|exploit|ctf|hack|red.?team|blue.?team|threat|incident|forensic|malware|reverse.?engineer|scanning|penetration)\b/i;

/* ── PRIVACY SCANNER ── */
function scanPrivacy(name: string, description: string, body: string): PrivacyAudit {
  const fullText = `${description}\n${body}`;
  const flags: PrivacyFlag[] = [];
  const isSecuritySkill = SECURITY_KEYWORDS.test(name) || SECURITY_KEYWORDS.test(description);

  for (const pattern of THREAT_PATTERNS) {
    const matches = fullText.match(pattern.regex);
    if (!matches) continue;

    // Deduplicate — only flag each pattern once per category
    const matchText = matches[0];
    const idx = fullText.indexOf(matchText);
    const ctxStart = Math.max(0, idx - 40);
    const ctxEnd = Math.min(fullText.length, idx + matchText.length + 40);
    const context = fullText.slice(ctxStart, ctxEnd).replace(/\n/g, " ").trim();

    flags.push({
      category: pattern.category,
      severity: pattern.severity,
      pattern: pattern.label,
      context: context.length > 100 ? context.slice(0, 97) + "..." : context,
    });
  }

  // Score calculation
  const severityPoints = { info: 2, warning: 10, danger: 25 };
  let rawScore = flags.reduce((sum, f) => sum + severityPoints[f.severity], 0);

  // Security skills get a reduction for expected patterns
  if (isSecuritySkill) {
    const reductionCategories = new Set(["network_recon", "code_execution", "privilege_escalation", "obfuscation", "data_exfiltration"]);
    const reducedFlags = flags.filter(f => reductionCategories.has(f.category));
    const reducedPoints = reducedFlags.reduce((sum, f) => sum + severityPoints[f.severity], 0);
    rawScore -= Math.floor(reducedPoints * 0.5);
  }

  const score = Math.min(100, Math.max(0, rawScore));

  // Level thresholds
  let level: PrivacyAudit["level"];
  if (score === 0) level = "clean";
  else if (score <= 15) level = "low";
  else if (score <= 40) level = "medium";
  else if (score <= 70) level = "high";
  else level = "critical";

  // Category counts for summary
  const cats = new Set(flags.map(f => f.category));
  const dangerCount = flags.filter(f => f.severity === "danger").length;
  const warningCount = flags.filter(f => f.severity === "warning").length;

  let summary: string;
  if (score === 0) {
    summary = "No privacy concerns detected";
  } else {
    const parts: string[] = [];
    if (dangerCount > 0) parts.push(`${dangerCount} danger`);
    if (warningCount > 0) parts.push(`${warningCount} warning`);
    summary = `${parts.join(", ")} across ${cats.size} ${cats.size === 1 ? "category" : "categories"}`;
    if (isSecuritySkill) summary += " (security skill — reduced score)";
  }

  return { score, level, flags, summary };
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

  const body = content.slice(endIdx + 3).trim();
  return { meta, body };
}

/* ── CACHE ── */
let cachedSkills: SkillInfo[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000;

/* ── GET HANDLER ── */
export async function GET() {
  try {
    const now = Date.now();
    if (cachedSkills && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ skills: cachedSkills });
    }

    if (!existsSync(SKILLS_DIR)) {
      return NextResponse.json({ skills: [], error: "Skills directory not found" });
    }

    const entries = await readdir(SKILLS_DIR);
    const skills: SkillInfo[] = [];

    for (const entry of entries) {
      if (entry.startsWith(".")) continue;
      const entryPath = join(SKILLS_DIR, entry);
      const entryStat = await stat(entryPath);
      if (!entryStat.isDirectory()) continue;

      const skillFile = join(entryPath, "SKILL.md");
      if (!existsSync(skillFile)) continue;

      try {
        const raw = await readFile(skillFile, "utf-8");
        const { meta, body } = parseFrontmatter(raw);

        const lines = body.split("\n").filter((l) => l.trim().length > 0);
        const preview =
          lines.find(
            (l) => !l.startsWith("#") && !l.startsWith(">") && l.length > 20
          )?.slice(0, 200) || "";

        const name = meta.name || entry;
        const description = meta.description || preview || "No description.";

        // Run privacy scan on the full body
        const privacy = scanPrivacy(name, description, body);

        skills.push({
          id: entry,
          name,
          description,
          risk: meta.risk || "unknown",
          source: meta.source || "unknown",
          dateAdded: meta.date_added || "",
          bodyPreview: preview,
          privacy,
        });
      } catch {
        /* skip unreadable skills */
      }
    }

    skills.sort((a, b) => a.name.localeCompare(b.name));

    cachedSkills = skills;
    cacheTime = now;

    return NextResponse.json({ skills });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read skills", details: String(error) },
      { status: 500 }
    );
  }
}

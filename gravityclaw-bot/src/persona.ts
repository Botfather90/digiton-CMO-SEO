/**
 * Persona Layer — formats all bot responses with agent-specific styling.
 *
 * Generic: takes a prefix parameter so each agent in the swarm
 * gets its own identity in responses.
 */

export function agentMsg(prefix: string, message: string): string {
  return `${prefix} ${message}`;
}

export function agentBlock(prefix: string, title: string, body: string): string {
  return `${prefix} *${title}*\n\n${body}`;
}

// Legacy aliases for backward compat (JARVIS-specific)
export const jarvis = (message: string) => agentMsg("⚡", message);
export const jarvisBlock = (title: string, body: string) => agentBlock("⚡", title, body);

export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

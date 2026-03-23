---
description: Start the full GravityClaw agent stack — Paperclip orchestrator + agent-swarm workers + health checks
---

## Start Full GravityClaw Stack

### 1. Start Paperclip (Company Orchestrator)
// turbo
```bash
cd /Users/brandonwilliam/GRAVITYCLAW/paperclip && pnpm dev &
```
Wait for: `http://localhost:3100/api/health` → `{"status":"ok"}`

### 2. Start Agent Swarm API (Worker Layer)
// turbo
```bash
cd /Users/brandonwilliam/GRAVITYCLAW/agent-swarm && bun run start:http &
```
Wait for: `http://localhost:3013/health`

### 3. Verify Stack Health
// turbo
```bash
sleep 5
echo "--- Paperclip ---"
curl -s http://localhost:3100/api/health
echo ""
echo "--- Agent Swarm ---"
curl -s http://localhost:3013/health 2>/dev/null || echo "Agent swarm not configured yet"
```

### 4. Open Paperclip Dashboard
Open browser to `http://localhost:3100`

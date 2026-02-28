# Cloudflare Deployment Guide

## Prerequisites

- Cloudflare account with Workers plan (free tier works)
- `wrangler` CLI installed: `npm i -g wrangler`
- D1 database created: `wrangler d1 create meitheal-db`

## Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Coolock-Village/meitheal.git
   cd meitheal && pnpm install
   ```

2. **Create D1 database**
   ```bash
   wrangler d1 create meitheal-db
   # Copy the database_id to apps/api/wrangler.toml
   ```

3. **Run migrations**
   ```bash
   wrangler d1 migrations apply meitheal-db --local  # test locally first
   wrangler d1 migrations apply meitheal-db           # then production
   ```

4. **Set secrets**
   ```bash
   wrangler secret put MEITHEAL_VIKUNJA_API_TOKEN
   # Enter your API token when prompted
   ```

5. **Deploy**
   ```bash
   cd apps/api && wrangler deploy
   ```

## Local Development

```bash
cd apps/api && wrangler dev
# → http://localhost:8787
```

## API Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/runtime` | No | Runtime detection |
| GET | `/api/v1/tasks` | Bearer | List tasks |
| GET | `/api/v1/tasks/:id` | Bearer | Get task |
| POST | `/api/v1/tasks` | Bearer | Create task |
| PUT | `/api/v1/tasks/:id` | Bearer | Update task |
| DELETE | `/api/v1/tasks/:id` | Bearer | Delete task |

## Dual-Runtime Architecture

| | HA Add-on | Cloudflare Workers |
|---|-----------|-------------------|
| Database | SQLite (file) | D1 (managed SQLite) |
| Runtime | Node.js (Astro SSR) | Workers V8 isolate |
| Auth | Supervisor token | Bearer token |
| IP Header | X-Forwarded-For | CF-Connecting-IP |
| Deploy | Docker/HA Store | `wrangler deploy` |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MEITHEAL_VIKUNJA_API_TOKEN` | Yes | Bearer token for API auth (set via `wrangler secret put`) |
| `MEITHEAL_RUNTIME` | Auto | Set to `cloudflare` in wrangler.toml |

## Staging

```bash
wrangler deploy --env staging
```

---

*Last updated: 2026-02-28 — Phase 4 Cloud Runtime*

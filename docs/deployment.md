# Meitheal Cloudflare Deployment Guide

## Overview

Meitheal is designed to run in two primary modes:
1. **Home Assistant Add-on** (Local-first, Node.js + SQLite/Turso)
2. **Cloudflare Runtime** (Edge-first, Workers + D1 + Pages)

This guide covers deploying the **Cloudflare Runtime** architecture.

## Architecture

* **Frontend:** Cloudflare Pages (Astro SSR + Static Assets)
* **Backend:** Cloudflare Workers (`apps/api/src/worker.ts`)
* **Database:** Cloudflare D1 (SQLite at the edge)

## Prerequisites

1. Cloudflare account
2. \`wrangler\` CLI installed globally: \`npm install -g wrangler\`
3. Authenticated CLI: \`wrangler login\`

## Step 1: Database Setup (D1)

Create your new D1 database:

\`\`\`bash
wrangler d1 create meitheal-db
\`\`\`

Note the \`database_id\` returned in the console. You must update your \`apps/api/wrangler.toml\` with this ID.

Update \`apps/api/wrangler.toml\`:
\`\`\`toml
[[d1_databases]]
binding = "DB"
database_name = "meitheal-db"
database_id = "<YOUR_DATABASE_ID>"
\`\`\`

### Run Migrations

Run your D1 migrations to set up the schema:

\`\`\`bash
# Run locally first
wrangler d1 migrations apply meitheal-db --local

# Apply to production
wrangler d1 migrations apply meitheal-db --remote
\`\`\`

## Step 2: Deploy the API Worker

Navigate to the \`apps/api\` directory and deploy the worker.

\`\`\`bash
cd apps/api
pnpm run build  # Ensure typescript compiles
wrangler deploy
\`\`\`

Note the deployment URL (e.g., \`https://api.yourdomain.workers.dev\`). You will need this for the frontend configuration.

## Step 3: Deploy the Frontend (Pages)

Navigate back to the project root and configure your frontend for production.

1. Ensure your Astro config (\`apps/web/astro.config.mjs\`) is set up for the \`@astrojs/cloudflare\` adapter.
2. Build the frontend:

\`\`\`bash
cd apps/web
pnpm run build
\`\`\`

3. Deploy using Wrangler to Cloudflare Pages:

\`\`\`bash
wrangler pages deploy dist --project-name="meitheal-web"
\`\`\`

## Step 4: Environment Variables

Configure essential secrets. In your Cloudflare Dashboard (or via wrangler):

1. **\`MEITHEAL_VIKUNJA_API_TOKEN\`**: (Optional) For integration with external services.
2. **\`MEITHEAL_ALLOWED_ORIGINS\`**: Your frontend domain (e.g., \`https://meitheal.pages.dev\`) to pass CSRF validation.

\`\`\`bash
wrangler secret put MEITHEAL_ALLOWED_ORIGINS
# Enter your frontend URL
\`\`\`

## Troubleshooting

* **503 Service Unavailable:** Usually means D1 is down or the database binding is completely mismatched. Check your \`wrangler.toml\` \`database_id\`.
* **403 CSRF Failed:** Ensure your \`MEITHEAL_ALLOWED_ORIGINS\` secret includes the exact origin of your deployed Cloudflare Pages site.
* **Offline Sync Issues:** The worker implements a background sync queue conflict resolution (Last-Write-Wins). Ensure that \`updated_at\` timestamps are correctly synchronized to avoid constant 409 Conflict messages.

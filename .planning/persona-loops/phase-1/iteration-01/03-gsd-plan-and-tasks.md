# GSD Plan and Tasks - Phase 1 Iteration 01

## Accepted Recommendations to Tasks

1. Runtime split scaffold
- Source: Frontier Panel / Platform Architect
- Task: Create `apps/web` (Astro Node SSR) and `apps/api` (Cloudflare worker adapter).

2. Astro integration-first setup
- Source: Frontier Panel / OSS Integrations Specialist
- Task: Configure `astro.config.mjs` with OSS integrations.

3. Logging baseline with Alloy
- Source: Frontier Panel / Reliability Engineer
- Task: Implement domain logger and `addons/meitheal-hub/rootfs/etc/alloy/config.river`.

4. Security baseline
- Source: Frontier Panel / Security Engineer
- Task: Add SSRF guardrails in `/api/unfurl` and redaction patterns in logger.

5. Governance and KCS
- Source: ADHD Panel / Knowledge Coach
- Task: Add `AGENTS.md`, `WEBMCP.md`, `README.md`, `.skills/core-workflows/SKILL.md`, ADRs, and KCS runbooks.

6. Repo standards test
- Source: ADHD Panel / Execution Coach
- Task: Add `tests/governance/repo-standards.spec.ts`.

7. Vertical slice scaffolding
- Source: Focus Optimizer
- Task: Task schema + framework YAML + event bus + e2e placeholders.

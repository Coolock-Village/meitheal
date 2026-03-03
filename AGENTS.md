# AGENTS

## Purpose

This file defines mandatory behavior for human and AI contributors working in Meitheal.

## Automation Review

- CodeRabbitAI is enabled for PR review on this repository.
- Treat CodeRabbit findings as required triage items (accept, fix, or explicitly document reject rationale).

## Hard Requirements

- Preserve Astro-first architecture decisions.
- Prefer official/open Astro integrations before custom implementations.
- Maintain strict DDD bounded contexts and ubiquitous language.
- Maintain KCS artifacts in the same change set as code behavior updates.
- Keep Home Assistant add-on compatibility as a first-class constraint.
- Keep Home Assistant publishing compatibility aligned with https://developers.home-assistant.io/docs/apps/publishing.
- Maintain `repository.yaml` and add-on `config.yaml` `image` contract (`...-{arch}`) for publish readiness.
- All client-side fetch calls must work behind HA ingress (global fetch wrapper in `Layout.astro`).
- Never issue server-side redirects to bare `/` paths — they escape the ingress iframe.

## Required Files (CI Enforced)

- `README.md`
- `AGENTS.md`
- `SKILL.md`
- `WEBMCP.md`
- `.coderabbit.yaml`
- `.skills/core-workflows/SKILL.md`
- `.zeroclaw/soul.md`
- `docs/decisions/*.md`
- `docs/kcs/*.md`
- `public/.well-known/mcp.json`
- `public/.well-known/jsondoc.json`

## DDD Context Boundaries

- `domain-auth` — ingress detection, CSRF, session policy
- `domain-tasks` — task CRUD, persistence, sync
- `domain-strategy` — RICE scoring, strategic lenses
- `domain-observability` — structured logging, audit trail
- `integration-core` — calendar/todo adapters, HA bridge
- `domains/ha/` — HA events, WebSocket, connection status
- `domains/todo/` — HA todo list sync, status mapping

Cross-context imports must occur through public package APIs, not deep path imports.

## Ingress Patterns

- `serve.mjs` normalizes `//` paths before Astro routing (prevents 301 redirect loops)
- `ingress-policy.ts` determines ingress context from `X-Ingress-Path` header
- `Layout.astro` monkey-patches `fetch()` to prefix API calls with ingress path
- `middleware.ts` rewrites HTML attributes (`href`, `src`) with ingress prefix
- ViewTransitions are disabled behind ingress to prevent redirect loops

## KCS Rules

- New behavior requires updated docs and a runbook touchpoint.
- ADRs capture architectural and legal/security decisions.
- Error messages should support self-service debugging.

## Observability Rules

Use structured JSON logs with the canonical schema from `packages/domain-observability`.

Do not introduce high-cardinality Loki labels (user IDs, task IDs, URLs).

## Deploy Rules

- Pushing code to `main` does NOT deploy. Push a version tag (`v*`) to trigger CI Docker build.
- Version in `config.yaml` must match the tag (e.g., `version: "0.2.6"` ↔ `v0.2.6`).
- Also bump `MEITHEAL_VERSION` in `run.sh` to match.

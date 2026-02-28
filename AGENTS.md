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

- `domain-auth`
- `domain-tasks`
- `domain-strategy`
- `domain-observability`
- `integration-core`

Cross-context imports must occur through public package APIs, not deep path imports.

## KCS Rules

- New behavior requires updated docs and a runbook touchpoint.
- ADRs capture architectural and legal/security decisions.
- Error messages should support self-service debugging.

## Observability Rules

Use structured JSON logs with the canonical schema from `packages/domain-observability`.

Do not introduce high-cardinality Loki labels (user IDs, task IDs, URLs).

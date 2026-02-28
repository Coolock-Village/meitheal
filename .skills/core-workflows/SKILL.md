# Core Workflows Skill

## Purpose

Provide repeatable contributor workflows for DDD/KCS-compliant development in Meitheal.

## Workflow

1. Identify bounded context for requested change.
2. Update or create ADR when architecture/legal/security behavior changes.
3. Implement domain logic in `packages/domain-*` first.
4. Wire runtime adapters in `apps/` or `addons/`.
5. Update runbooks/docs in `docs/kcs`.
6. Add or update tests in `tests/e2e` or `tests/governance`.

## Guardrails

- Astro-first and Home Assistant compatibility must not regress.
- Prefer OSS Astro integrations where practical.
- Avoid direct cross-context internals imports.

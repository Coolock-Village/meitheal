# ADR 0001: Legal and Naming Strategy

## Status
Accepted

## Date
2026-02-28

## Context
We need visibility from adjacent ecosystems while avoiding trademark confusion and keeping licensing obligations explicit.

## Decision
Use a dual-track strategy:

1. `meitheal-core`
- Astro-native, clean-room implementation.
- No copied Vikunja source/assets unless explicitly isolated and licensed.

2. `meitheal-vikunja-adapter`
- Separate adapter/fork layer for migration and compatibility paths.
- AGPL-3.0 obligations apply when code is copied/reused.

Repository licensing posture:
- Root repository starts under AGPL-3.0 for clear OSS compliance during early iterations.
- `meitheal-core` and `meitheal-vikunja-adapter` separation remains the architectural target for long-term boundary clarity.

Branding policy:
- Project name: Meitheal.
- Tagline: The cooperative task and life engine for your home.
- Do not imply official endorsement by Vikunja or Super Productivity.

## Consequences
- Clear legal separation and contributor guidance.
- Easier compliance audits for AGPL-scope code.
- Better long-term ability to keep the core permissive if clean-room remains uncontaminated.

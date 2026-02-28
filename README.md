# Meitheal

The cooperative task and life engine for your home.

Repository target: `Coolock-Village/meitheal`.

Meitheal is an Astro-first, local-first life operating system for households, homelabs, and communities. It is designed to run natively as a Home Assistant app/add-on while also supporting Cloudflare deployment.

## Why Meitheal

In Ireland, a meitheal (pronounced meh-hal) is a tradition of neighbors sharing hard labor. You do not buy a meitheal; you show up, share the load, and return the favor.

Meitheal applies that ethos to software:

- The Hearth over The Cloud: local-first, resilient, private, fast.
- The Shared Burden: automation carries cognitive load across Home Assistant, Grocy, and calendars.
- Radical Pragmatism: Astro-native architecture, low memory footprint, strict performance budgets.
- Shared Knowledge: KCS culture where docs, runbooks, and ADRs evolve with code.

Source context for the term and community model:
- https://www.universityofgalway.ie/cfrc/projects/completedprojects/preventionpartnershipandfamilysupportppfsprogramme/theworkpackageapproach/meithealandchildandfamilysupportnetworks/

## Non-Negotiables

- Astro first/native architecture.
- Favor OSS Astro integrations from https://astro.build/integrations/ when suitable.
- DDD boundaries, extensibility, and framework-driven behavior are core constraints.
- Released as a Home Assistant app/add-on and aligned with Home Assistant app ecosystem expectations: https://www.home-assistant.io/apps/

## Ubiquitous Language

- Meitheal: the system.
- The Hearth: Home Assistant host environment.
- Villagers: users/household members.
- Endeavors: high-level goals/portfolios.
- Tasks: units of work (not "issues").
- Frameworks: YAML-defined scoring and decision models (RICE, DRICE, HEART, KCS overlays).

## Monorepo Layout

- `apps/web`: Astro PWA frontend + API routes for HA runtime.
- `apps/api`: Cloudflare runtime adapter.
- `packages/domain-*`: pure domain logic.
- `addons/meitheal-hub`: Home Assistant OS add-on package.
- `integrations/home-assistant`: custom component skeleton.
- `docs/`: ADRs, KCS runbooks, methodology docs, PRFAQ.
- `tests/e2e` and `tests/governance`: quality and policy gates.
- `public/.well-known`: WebMCP discovery artifacts.

## Logging and Observability

Meitheal uses a coordinated HA-compatible pipeline:

1. Structured JSON logs from app to stdout/stderr.
2. Home Assistant journal capture.
3. Grafana Alloy collector.
4. Loki storage/query.
5. Grafana dashboards and alerts.

See `docs/decisions/0002-target-architecture.md` and `addons/meitheal-hub/rootfs/etc/alloy/config.river`.

## Legal and Licensing

Meitheal uses a dual-track strategy:

- `meitheal-core`: clean-room Astro-native implementation focused on first-party Meitheal UX and domain model.
- `meitheal-vikunja-adapter`: AGPL-compatible migration/bridge layer for compatibility with Vikunja-oriented ecosystems.

Initial repository license is AGPL-3.0 while boundaries are hardened.

See `docs/decisions/0001-legal-and-naming-strategy.md`.

## HA Ecosystem Interop

Meitheal ships both:

- an HA OS add-on runtime (`addons/meitheal-hub`), and
- a Home Assistant custom component skeleton (`integrations/home-assistant`).

Interop design is informed by existing HA/Vikunja integration patterns, including:
- https://github.com/joeShuff/vikunja-homeassistant

## Status

Repository is now at Iteration 2 baseline with:

- Public GitHub publication at `Coolock-Village/meitheal`
- Protected `main` branch and feature-branch workflow
- Persistent SQLite-backed vertical slice for task->calendar sync
- Direct Home Assistant calendar service integration
- Idempotent replay handling and persistent audit trail
- Playwright test harness including new domain/persistence coverage
- Persona optimization loop artifacts under `.planning/persona-loops/`

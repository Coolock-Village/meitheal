# Phase 27 — HA Security Hardening

## Goal

Harden the Meitheal Hub add-on for Home Assistant third-party repository publishing.
Implement AppArmor, ingress user identity extraction, auth_api, config hardening,
CSP adjustments, and security documentation without removing any features.

## Decisions

- **AppArmor profile**: Restrictive deny-by-default, allow Node.js, SQLite, and tmpfs
- **Non-root user**: Container runs as `meitheal` user, not root
- **auth_api**: Enables Supervisor auth backend for credential validation
- **panel_admin**: Restricts sidebar panel to admin users only
- **Dynamic CSP**: frame-ancestors adjusts when under HA ingress context
- **stage: experimental**: Required for third-party repos, signals pre-stable

## Cross-references

- 50-persona-audit.md: Personas #1, #4, #5, #7, #8, #32 (all addressed in Phase 5)
- Phase 2 Iteration 01 tasks: FR-204 (X-Forwarded-For rate limiting — already done)
- HA Developer Docs: apps/security, apps/communication, apps/configuration

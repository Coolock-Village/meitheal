# 70-Integration Auto-Discovery Persona Audit

**Date:** 2026-03-04
**Scope:** HA Custom Component config_flow, addon `config.yaml`, `run.sh` — integration setup UX

## Context

The Meitheal addon auto-installs the custom component at boot, but users must **manually** add the integration via Settings → Devices & Services → Add Integration → Meitheal, then confirm host/port. The screenshot shows this dialog asking for `local_meitheal:3000` — unintuitive for users who expect it to "just work" since the addon is already running.

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | HA Addon Expert | Discovery | Addon `config.yaml` has no `discovery` key — Supervisor can't auto-trigger integration setup | 🔴 High | Add `discovery` config + Supervisor API call |
| 2 | HA Integration Dev | Config Flow | Missing `async_step_hassio()` — can't receive Supervisor discovery events | 🔴 High | Add hassio step for zero-touch setup |
| 3 | UX Designer | Onboarding | Users see raw hostname `local_meitheal` with no context — no explanation of what this is or why | ⚠️ Med | Add step description explaining auto-detection |
| 4 | UX Researcher | Error State | "Cannot connect" error gives no actionable guidance (check addon running? check hostname?) | ⚠️ Med | Improve error messages with troubleshooting hints |
| 5 | Product Manager | Activation | 2-step activation (install addon → manually add integration) creates drop-off | 🔴 High | Make integration auto-configure via discovery |
| 6 | KCS Author | Docs | README says "No manual steps needed" but integration requires manual setup | ⚠️ Med | Update README with accurate flow |
| 7 | Accessibility Eng | Form | Config form has no descriptions or help text explaining fields | ℹ️ Low | Add `data_description` to `strings.json` |
| 8 | DDD Architect | Boundaries | Discovery is a cross-cutting concern — addon (infra) must signal integration (domain) | ✅ Pass | Supervisor API is the correct boundary pattern |
| 9 | Security Architect | Auth | Discovery payload uses internal Docker hostname — no tokens/secrets leaked | ✅ Pass | Safe pattern |
| 10 | Error Handler | Fallback | If discovery fails, manual setup must still work as fallback | ⚠️ Med | Keep `async_step_user` alongside discovery |
| 11 | HA Frontend Dev | Integration | No logo/icon for Meitheal in HA integrations list | ℹ️ Low | Future: submit to HA brands repo |
| 12 | Performance Eng | Startup | Discovery call adds ~200ms to addon boot — negligible | ✅ Pass | Acceptable |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 High | 3 | Discovery API + config_flow hassio step + addon discovery call |
| ⚠️ Med | 4 | Better error messages, docs, fallback, descriptions |
| ℹ️ Low | 2 | Deferred |
| ✅ Pass | 3 | No action |

## Immediate Actions

1. **Add Supervisor Discovery API call** to `run.sh` (after healthcheck passes)
2. **Add `async_step_hassio()`** to `config_flow.py` for zero-touch setup
3. **Add `discovery` key** to addon `config.yaml`
4. **Improve `strings.json`** with descriptions and better error messages
5. **Update README** with accurate onboarding flow

---
*Phase: 70-integration-autodiscovery*
*Audit: 2026-03-04*

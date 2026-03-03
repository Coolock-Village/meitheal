# 50-Persona Audit — Phase 57: Integrations Page Iteration

**Date:** 2026-03-03
**Scope:** Settings → Integrations tab — explainer popups, auto-config, theme readability
**Mode:** PLANNING ONLY — findings inform implementation decisions

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | UX Designer | Explainers | No onboarding or explanation for what each integration does — users see raw config inputs | ⚠️ Med | Add explainer popups (Phase 57) |
| 2 | UX Researcher | Calendar | Calendar entity input is a free-text field — error-prone when entities exist that could be listed | ⚠️ Med | Replace with dropdown (Phase 57) |
| 3 | Product Manager | Calendar | CaldAV field shown alongside HA calendar — confuses users about which to use | ⚠️ Med | Separate into collapsible section (Phase 57) |
| 4 | Accessibility Eng | Contrast | Dark theme `--text-muted: #5e5e78` on `--bg-primary: #0f0f1a` — contrast ratio ~2.8:1, fails WCAG AA | 🔴 High | Fix theme variables (Phase 57) |
| 5 | Color Vision Eng | Contrast | `--text-secondary: #9b9bb4` on `--bg-card: #16213e` — ratio ~3.9:1, borderline AA | ⚠️ Med | Bump to ≥4.5:1 (Phase 57) |
| 6 | Accessibility Eng | Light theme | `--text-muted: #8888a4` on `--bg-primary: #f8f9fc` — ratio ~3.6:1, fails AA for normal text | ⚠️ Med | Bump to `#7a7a96` (Phase 57) |
| 7 | HA Addon Expert | Grocy | Grocy card requires manual URL/key even when running as HA addon with known ingress path | ⚠️ Med | Auto-detect via Supervisor API (Phase 57) |
| 8 | HA Addon Expert | n8n/Node-RED | No distinction between HA addon Node-RED (auto via WS) vs standalone (needs webhook URL) | ⚠️ Med | Split modes (Phase 57) |
| 9 | Integration Architect | n8n | n8n standalone needs API key/secret fields — currently only webhook URL | ⚠️ Med | Add auth fields (Phase 57) |
| 10 | Security Architect | n8n | API key field should use `type="password"` with show/hide toggle | ℹ️ Low | Phase 57 |
| 11 | KCS Author | Webhooks | No explanation of webhooks vs MCP/A2A — users confused about which tab to use | ⚠️ Med | Add differentiation callout (Phase 57) |
| 12 | HA Addon Expert | Todo | Purpose of Todo sync unclear — users don't understand why it exists | ⚠️ Med | Add bridge explainer (Phase 57) |
| 13 | DDD Architect | Naming | Integration card titles are generic — "n8n / Node-RED" doesn't explain it's automation | ℹ️ Low | Add subtitle context |
| 14 | I18n Engineer | Text | Explainer popup text will be hardcoded English — no i18n keys | ℹ️ Low | Defer to i18n phase |
| 15 | Screen Reader Eng | Modal | Explainer popup needs `role="dialog"`, `aria-modal`, focus trap, Escape to close | ⚠️ Med | Phase 57 |
| 16 | Keyboard Nav Eng | Cards | Integration card expand/collapse works with keyboard — ✓ verified | ✅ OK | No action |
| 17 | Mobile Engineer | Responsive | Cards work at 375px — `integration-card__desc` hidden on mobile ✓ | ✅ OK | No action |
| 18 | Performance Eng | Bundle | Explainer modal markup is static — no JS framework overhead, Astro-native ✓ | ✅ OK | No action |
| 19 | API Designer | Calendar | `GET /api/ha/calendars` returns entities + sync status — sufficient for dropdown | ✅ OK | No action |
| 20 | API Designer | Grocy | No `GET /api/grocy/status` endpoint exists — need to add or use Supervisor API client-side | ⚠️ Med | Use Supervisor addon list endpoint (Phase 57) |
| 21 | Security Analyst | Grocy | Auto-populating Grocy URL from ingress — safe since both are same-origin behind Supervisor | ✅ OK | No action |
| 22 | Test Architect | E2E | Existing `integrations.spec.ts` tests webhooks and n8n — no coverage for calendar/todo/grocy UI | ℹ️ Low | Add E2E for new features later |
| 23 | QA Lead | Testing | No unit test for `hydrateCalendarStatus()` — complex DOM mutation logic untested | ℹ️ Low | Phase 5+ |
| 24 | UX Designer | Cards | Badge states (Connected/Checking/Configured/Not configured) are inconsistent across cards | ℹ️ Low | Standardize in UX cycle |
| 25 | UX Designer | Animation | Card expand/collapse animation is smooth with `max-height` transition ✓ | ✅ OK | No action |
| 26 | CSS Architect | Scoping | Integration styles are scoped inside `<style>` tag — no global pollution ✓ | ✅ OK | No action |
| 27 | CSS Architect | Variables | Integration card uses `var(--bg-primary)`, `var(--border)` correctly from design system ✓ | ✅ OK | No action |
| 28 | CSS Architect | Theme | `.badge-active` uses hardcoded `rgba(16, 185, 129, 0.15)` — should track var(--accent) | ℹ️ Low | Refactor in UX cycle |
| 29 | Product Manager | Grocy | Grocy sync mode dropdown shown before connection — premature config | ℹ️ Low | Phase 57 |
| 30 | Product Manager | n8n | Trigger events checkboxes should be contextual — show only after connection mode selected | ℹ️ Low | Phase 57 |
| 31 | HA Addon Expert | Detection | Node-RED addon slug is `a0d7b954_nodered` — need to verify against Supervisor API | ℹ️ Info | Verify during implementation |
| 32 | HA Addon Expert | Detection | n8n addon slug varies by repository — may need configurable slug | ℹ️ Info | Default + override |
| 33 | Security Engineer | API Key | Grocy API key stored as setting in SQLite — acceptable since DB is local-only | ✅ OK | No action |
| 34 | Privacy Engineer | Tokens | Token/key values should not appear in structured logs | ✅ OK | Already redacted in compat-logger |
| 35 | Frontend Architect | Modal | Explainer modal should be a shared component — reusable across settings tabs | ⚠️ Med | Create shared `InfoModal` component |
| 36 | Astro Expert | Patterns | Modal should use `<dialog>` element (native HTML) — better a11y than custom div | ⚠️ Med | Use `<dialog>` for explainers |
| 37 | Astro Expert | Lifecycle | Modal init needs dual-init pattern (`initFn()` + `astro:page-load`) | ✅ OK | Will follow existing pattern |
| 38 | DDD Architect | Boundaries | Grocy auto-detect crosses bounded contexts (integrations reads supervisor) | ℹ️ Info | Acceptable — settings is a configuration surface |
| 39 | Tech Writer | Copy | Explainer text must be concise — max 3 sentences per integration | ℹ️ Low | Enforce during implementation |
| 40 | UX Designer | Empty States | Cards with unconfigured integrations show raw form — should show explanation first | ⚠️ Med | Explainer callout before config form |
| 41 | WCAG Auditor | Border | `--border: #2a2a42` on `--bg-primary: #0f0f1a` — ratio ~1.5:1, nearly invisible | ⚠️ Med | Bump border contrast (Phase 57) |
| 42 | WCAG Auditor | Focus | Focus ring uses `var(--accent)` — ✓ visible against all backgrounds | ✅ OK | No action |
| 43 | Data Architect | Settings | Calendar/todo/grocy/n8n settings all use same `saveSetting(key, value)` pattern — consistent ✓ | ✅ OK | No action |
| 44 | SRE | Error Handling | `hydrateCalendarStatus()` silently catches errors — no logging | ℹ️ Low | Add console.warn |
| 45 | SRE | Error Handling | `hydrateN8nStatus()` doesn't exist yet — needs error boundary | ℹ️ Info | Will add in Phase 57 |
| 46 | Localization Eng | RTL | Explainer modal needs RTL-safe layout if i18n adds Arabic/Hebrew | ℹ️ Low | Defer |
| 47 | DevOps Eng | n8n | n8n server detection — user mentioned they have an n8n server, need to check via MCP | ℹ️ Info | Check during implementation |
| 48 | Product Manager | Scope | Two GSD cycles planned: functional then UX polish — appropriate scope | ✅ OK | Follow plan |
| 49 | Release Eng | Version | Changes are UI-only, no migration needed — safe for minor bump | ✅ OK | No action |
| 50 | Domain Architect | DDD | Explainer content is domain knowledge (KCS) — should be structured, not inlined | ℹ️ Low | Acceptable for MVP inline |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 High | 1 | Fix now — dark theme contrast fails WCAG AA |
| ⚠️ Med | 15 | All in Phase 57 scope |
| ℹ️ Low | 14 | 4 absorbed into Phase 57, 10 deferred |
| ℹ️ Info | 7 | No action needed |
| ✅ OK | 13 | Verified good |

## Immediate Actions (Phase 57)

1. **Fix WCAG contrast failures** — dark `--text-muted`, `--text-secondary`, `--border` (#4, #5, #41)
2. **Fix light theme `--text-muted`** contrast (#6)
3. **Add explainer popups** using native `<dialog>` element (#1, #15, #35, #36)
4. **Calendar dropdown** from HA entities (#2, #3)
5. **Grocy auto-detect** via Supervisor API (#7, #20)
6. **n8n/Node-RED mode split** — HA addon vs standalone (#8, #9)
7. **Todo bridge explainer** (#12)
8. **Webhooks vs AI callout** (#11)

## Deferred (UX Cycle or later)

- Badge state standardization (#24)
- CSS variable refactoring for badges (#28)
- E2E test coverage for new UI (#22)
- i18n for explainer text (#14)

# Changelog

All notable changes to Meitheal are documented in this file.

## [Unreleased]

### Added

- **Task Activity Log** — field-level audit trail for all task changes (ADR-0011)
- **Task Duplication** — `POST /api/tasks/[id]/duplicate` endpoint
- **Optimistic Locking** — 409 Conflict on stale `updated_at` (ADR-0010)
- **Rate Limiting** — 120 req/min per IP with x-ratelimit headers (ADR-0009)
- **Comment Counts** — displayed on kanban cards
- **Inline Priority Editing** — table view priority column now editable
- **Security Headers** — X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, CSP
- **CSRF Protection** — origin-based checking on all mutating API routes
- **Reduced Motion** — `prefers-reduced-motion: reduce` media query
- **Toast Accessibility** — `aria-live="polite"` on all toast containers
- **DB Indexes** — 9 indexes covering all filter/sort columns
- **Kanban Group-By Persistence** — localStorage for group selection
- **Shared API Helpers** — `apiError()` / `apiJson()` in `lib/api-response.ts`
- **ADRs 0008-0011** — Phase 27-30 architectural decisions
- **AppArmor Profile** — restrictive `apparmor.txt` for HA add-on container security
- **HA Ingress User Identity** — extract `X-Hass-User-Id` and `X-Hass-Is-Admin` from Supervisor headers
- **Auth API** — `auth_api: true` enables Supervisor auth backend validation
- **Panel Admin** — sidebar panel restricted to HA admin users
- **Non-root Container** — Dockerfile runs as `meitheal` user instead of root
- **Dynamic CSP** — `frame-ancestors` adjusts for HA ingress iframe embedding
- **Translations** — English option descriptions in `translations/en.yaml`
- **tmpfs** — `/tmp` mounted as tmpfs for ephemeral storage
- **Activity Log UI** — collapsible `<details>` section in task detail panel, lazy-loaded on expand
- **Duplicate Task Button** — 📋 button in task detail action sidebar (POST + auto-open clone)
- **Time Tracked Input** — editable minutes-tracked field in Date & Time section
- **Danger Zone** — settings page section for purge all tasks (triple-confirm) and reset settings
- **Command Palette Nav** — Go to Dashboard/Kanban/Table/Settings + Export CSV commands
- **Command Search Filtering** — typing in command palette filters both commands and tasks
- **Version Bump** — `0.3.0` Phase 32: Deep Audit

### Fixed

- Comments POST now wrapped in try/catch
- Labels GET/POST now wrapped in try/catch
- Lanes PUT/DELETE now wrapped in try/catch
- Table bulk operations wrapped in try/catch with error toasts
- Table +New Task button wired to API POST
- Inline-select sends priority as number (was string, silently ignored)

### Changed

- CSP tightened: `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`
- Settings API: key regex validation, 10KB value cap
- Import: 100KB payload guard, expanded allowlist
- Build time improved: 2.35s (from 2.49s)
- Bundle stable: tasks 10.59kB, Layout 21.91kB (gzip)

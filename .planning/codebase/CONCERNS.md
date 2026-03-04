# Codebase Concerns

**Analysis Date:** 2026-03-04
**Version:** 0.1.59

## Tech Debt

| Issue | Impact | Location | Fix |
|-------|--------|----------|-----|
| Build output in git | Repo inflation, noisy diffs | `apps/web/dist/` | Docker build-only output |
| Cloudflare adapter skeleton | Cloud path non-functional | `apps/api/` | Implement when cloud is prioritized |
| 7 placeholder test specs | No actual coverage | `tests/e2e/` (skipped specs) | Implement when features exist |

## Security

| Risk | Location | Current Mitigation | Status |
|------|----------|-------------------|--------|
| Ingress header spoofing | `middleware.ts`, `auth/ingress.ts` | Required header validation + 4 spoofing tests | ✅ Mitigated |
| Ingress 301 redirect loop | `serve.mjs`, Astro SSR adapter | `serve.mjs` normalizes `//` → `/` before routing | ✅ Mitigated |
| SSRF in unfurl | `pages/api/unfurl.ts` | Domain allowlist (.local/.home.arpa) | ✅ Mitigated |
| Secret leakage in logs | `domain-observability/logger.ts` | 6 default redaction patterns | ✅ Mitigated |
| Compat API abuse | `vikunja-compat/auth.ts` | Bearer token validation + rate limiting | ✅ Mitigated |

## Performance

All budgets enforced in CI (`perf-budgets` job):

| Metric | CI Threshold | Local Threshold |
|--------|-------------|-----------------|
| Client bundle | ≤ 64 KB | ≤ 80 KB |
| Web RSS | ≤ 160 MB | ≤ 220 MB |
| Task create p95 | ≤ 150 ms | ≤ 250 ms |

No bottlenecks detected.

## Fragile Areas

| Area | Why Fragile | Tests | Safe Modification |
|------|-------------|-------|-------------------|
| Vikunja compat surface | Must match upstream API exactly | 3 compat specs + live verifier | Run `verify_vikunja_voice_assistant_compat.py` |
| SQL statement splitter | Edge cases (triggers, strings) | `migration-splitter.spec.mjs` | Run splitter spec |
| Timezone handling | Non-UTC offsets in calendar sync | `vikunja-compat-calendar-timezone.spec.ts` | Run timezone spec |

## Test Coverage Gaps

| Gap | Risk | Priority |
|-----|------|----------|
| `domain-auth` package directly | Auth logic changes could break silently | Medium |
| `domain-strategy` RICE scoring | Scoring formula changes untested | Medium |
| Content schema validation | Malformed YAML could cause runtime errors | Low |
| Browser E2E (pages, nav, a11y) | No automated browser testing | Medium |

## Resolved Concerns (This Iteration)

- ✅ `OA-402` — Compat routes now have structured request logging
- ✅ `OA-409` — Grafana dashboard for compat API metrics
- ✅ `OA-410` — Non-UTC timezone handling validated with 3 tests
- ✅ `OA-411` — HA custom component shows structured error payloads
- ✅ `OA-412` — Iteration-05 RFC drafted for webhook/Grocy/n8n
- ✅ `OA-413` — HA connection status always showing "Disconnected" — `/api/ha/connection` never called `getHAConnection()` before reading singleton status
- ✅ `OA-414` — HA version requirement too strict — `conversation` moved to `after_dependencies`, LLM API import made conditional (v0.1.55)
- ✅ `OA-415` — Task type icons (`✅`) confused with completion state — changed to `📌` across Today and Upcoming views
- ✅ `OA-416` — Keyboard shortcuts + command palette navigate to bare paths (`/tasks`, `/kanban`), causing 404 behind HA ingress — all 17 `window.location.href` calls now prepend `window.__ingress_path`
- ✅ `OA-417` — n8n HA addon mode save handler wrongly required webhook URL — now saves `n8n_mode: ha_addon`, webhook URL optional
- ✅ `OA-418` — Calendar settings `calendar_sync_enabled` and `calendar_write_back` not persisted — added to save handler + sync API call
- ✅ `OA-419` — PWA service worker never registered — Phase 59: wired `registerServiceWorker()` in Layout.astro, added install banner, Settings install/update buttons
- ✅ `OA-420` — SW `CACHE_VERSION` stuck at 0.1.25 — synced to 0.1.58, added `GET_VERSION` handler
- ✅ `OA-421` — No cache eviction — unlimited growth risk with dynamic IPs/ingress tokens — 4 scoped caches with max-entries + TTL eviction
- ✅ `OA-422` — Offline page Dashboard link not ingress-aware — now uses `x-ingress-path` header
- ✅ `OA-423` — Offline page missing `role="alert"` + `aria-live` — added both
- ✅ `OA-424` — KCS pwa-offline-guide.md stale — updated with cache eviction, install flow, update flow
- ✅ `OA-425` — SW update check 60s too aggressive for addon — reduced to 300s (5 min)
- ✅ `OA-426` — ~82 bare `fetch('/api/...')` calls would fail behind HA ingress — all now use `window.__ingress_path` prefix
- ✅ `OA-427` — 30+ `as any` casts across codebase — reduced to 2 via `types/window.d.ts`, `LayoutShiftEntry`, `env.d.ts` typed DateFormat
- ✅ `OA-428` — 6 raw `alert()` calls — replaced with `showToast()` notifications
- ✅ `OA-429` — `ha/calendars.ts` GET endpoint leaked stack traces — wrapped in try/catch
- ✅ `OA-430` — CSS `@import` after `@tailwind` caused 10+ PostCSS warnings per build — reordered in `global.css`
- ✅ `OA-431` — Dead modal classes in `_modal.css` (`.modal-overlay`, `.modal-content`, `.modal-title`, `.modal-actions`) — removed by user
- ✅ `OA-432` — Duplicate `Window.__ingress_path` declaration in `ingress-fetch.ts` — centralized in `types/window.d.ts`

---

*Concerns audit: 2026-03-04 — Phase 60 broad quality audit + deferrals*

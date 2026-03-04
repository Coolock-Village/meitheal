# Codebase Concerns

**Analysis Date:** 2026-03-03
**Version:** 0.2.6

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

---

*Concerns audit: 2026-03-04 — v0.1.55*

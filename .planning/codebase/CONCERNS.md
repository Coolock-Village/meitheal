# Codebase Concerns

**Analysis Date:** 2026-02-28

## Tech Debt

**Build output committed to git:**
- Issue: `apps/web/dist/` is committed to the repository (required for HA add-on runtime)
- Files: `apps/web/dist/`
- Impact: Inflates repo size, noisy diffs on rebuilds
- Fix approach: Move to Docker build-only output; add-on Dockerfile copies from build stage

**Cloudflare adapter is skeleton only:**
- Issue: `apps/api/` exists but contains minimal adapter code
- Files: `apps/api/`
- Impact: Cloud runtime path is not functional
- Fix approach: Implement Workers adapter when cloud deployment is prioritized

## Known Bugs

- No source-level TODO/FIXME/HACK comments detected in application code
- All known issues are tracked via optimization actions (OA-*) in handoff doc

## Security Considerations

**Ingress header spoofing:**
- Risk: Attackers could forge `X-Ingress-Path` or `HASSIO_TOKEN` headers
- Files: `apps/web/src/domains/auth/ingress.ts`, `apps/web/src/middleware.ts`
- Current mitigation: Required header validation in middleware, ingress spoofing tests (`tests/e2e/ingress-header-validation.spec.ts`)
- Recommendations: Expand threat model tests (partially addressed in OA-406)

**SSRF in unfurl endpoint:**
- Risk: `/api/unfurl` could be used to probe internal networks
- Files: `apps/web/src/pages/api/unfurl.ts`
- Current mitigation: Baseline SSRF guardrails
- Recommendations: DNS/IP resolution checks and deny lists (noted in persona loop iteration-01)

**Secret redaction scope:**
- Risk: New log fields might accidentally leak secrets
- Files: `packages/domain-observability/src/logger.ts`
- Current mitigation: `defaultRedactionPatterns` covers bearer tokens, emails, HA tokens
- Recommendations: Consider adding API key patterns, expand test coverage for redaction

## Performance Bottlenecks

**No significant bottlenecks detected:**
- Bundle size is within 64-80KB budget
- RSS is within 160-220MB budget
- Task create p95 is within 150-250ms budget
- Budgets are enforced by CI (`perf-budgets` job)

## Fragile Areas

**Vikunja compatibility surface:**
- Files: `apps/web/src/domains/integrations/vikunja-compat/`
- Why fragile: Protocol must match upstream Vikunja API exactly for voice assistant interop
- Safe modification: Run `tests/scripts/verify_vikunja_voice_assistant_compat.py` against changes
- Test coverage: Good — 3 dedicated compat test specs

**Migration SQL splitting:**
- Files: `apps/web/scripts/split-sql-statements.mjs`
- Why fragile: Edge cases in SQL statement splitting (triggers, multi-line, semicolons in strings)
- Safe modification: Run `tests/e2e/migration-splitter.spec.mjs`
- Test coverage: Edge-case fixtures added in OA-407

## Dependencies at Risk

**No critical dependency risks detected:**
- All dependencies are actively maintained (Astro, Drizzle, Playwright, Zod)
- `@libsql/client` is maintained by Turso team

## Missing Critical Features

**Route-level structured logging:**
- Problem: No per-route structured log entries for compatibility request outcomes
- Blocks: Operational visibility into compat API usage patterns
- Status: Open as `OA-402`

**Compatibility dashboard:**
- Problem: No Grafana dashboard panels for compat API metrics
- Blocks: Observability for voice assistant integration health
- Status: Open as `OA-409`

**Browser E2E tests:**
- Problem: Page/navigation/SEO/accessibility tests require `E2E_BASE_URL` — currently placeholder
- Blocks: No automated browser testing
- Priority: Medium — governance and integration tests provide core coverage

## Test Coverage Gaps

**No unit tests for domain packages:**
- What's not tested: `packages/domain-auth/`, `packages/domain-strategy/src/rice.ts` directly
- Files: `packages/domain-auth/src/index.ts`, `packages/domain-strategy/src/rice.ts`
- Risk: Changes to auth or scoring logic could break silently
- Priority: Medium

**Content schema validation:**
- What's not tested: YAML framework config parsing via Astro content schemas
- Files: `apps/web/src/content/config.ts`
- Risk: Malformed YAML config could cause runtime errors
- Priority: Low

---

*Concerns audit: 2026-02-28*

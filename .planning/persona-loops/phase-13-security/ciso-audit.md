# Phase 13: CISO Security Audit Findings

## Audit Date: 2026-02-28

## Dependabot Vulnerabilities (4 moderate)

| # | Package | Severity | CVE | Runtime Impact | Action |
|---|---------|----------|-----|----------------|--------|
| 1 | lodash ≤4.17.22 | Moderate | GHSA-xxjr-mmjv-4gpg | None — dev-only (@astrojs/check → yaml-language-server) | Defer — no runtime exposure |
| 2 | lodash ≤4.17.22 | Moderate | GHSA-xxjr-mmjv-4gpg | None — duplicate path | Defer |
| 3 | undici <6.23.0 | Moderate | GHSA-g9mf-h72j-4rw9 | None — dev-only (wrangler → miniflare) | Defer — Cloudflare dev tool |
| 4 | undici <6.23.0 | Moderate | GHSA-g9mf-h72j-4rw9 | None — duplicate path | Defer |

**Verdict**: All 4 vulns are in dev-only transitive deps. Zero runtime exposure.

## API Route Security Audit

| Check | Status | Details |
|-------|--------|---------|
| Input validation | ✅ Pass | Title length (500), status enum, priority range (1-5) |
| HTML stripping | ✅ Pass | `.replace(/<[^>]*>/g, "")` on all text inputs |
| JSON.parse guarded | ✅ Pass | All `JSON.parse()` wrapped in try/catch |
| No eval() | ✅ Pass | Zero instances of `eval()` across codebase |
| Error responses | ✅ Pass | Structured `{ error: "message" }` — no stack traces |
| SSRF protection | ✅ Pass | unfurl.ts blocks private networks, redirects |
| Auth enforcement | ✅ Pass | Middleware validates `hassio_token` for ingress routes |
| Security headers | ✅ Pass | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection |

## Vikunja Comparison (GHSA-rfjg-6m84-crj2)

| Vikunja Issue | Meitheal Status |
|---------------|-----------------|
| Password reset token reuse | IMMUNE — No password flow (HA ingress auth) |
| Token cleanup cron inverted | IMMUNE — No tokens (SUPERVISOR_TOKEN per-request) |
| Persistent account takeover | IMMUNE — No user accounts (delegated to HA) |

## Remediation Applied

1. ✅ Security response headers added to middleware
2. ✅ OWASP best practices applied (5 headers)
3. ✅ X-Frame-Options: SAMEORIGIN (allows HA ingress iframe)
4. ✅ Permissions-Policy restricts camera/mic/geolocation

## Remaining Recommendations (P3)

- Consider CSP header (requires audit of inline scripts)
- Consider rate limiting middleware for standalone mode
- Monitor Dependabot for lodash/undici updates

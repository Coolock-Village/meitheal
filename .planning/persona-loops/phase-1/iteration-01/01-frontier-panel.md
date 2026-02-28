# Frontier Panel - Phase 1 Iteration 01

## Objective
Bootstrap Meitheal monorepo with Astro-first, HA-native architecture and enforce DDD/KCS governance from day one.

| Persona | Recommendation | Impact (1-5) | Effort (1-5) | Risk (1-5) | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | Split runtime paths explicitly (HA Node+SQLite vs Cloudflare Worker+D1). | 5 | 3 | 4 | Accept |
| OSS Integrations Specialist | Prefer Astro integrations (`mdx`, `sitemap`, `tailwind`, PWA plugin) before custom code. | 4 | 2 | 2 | Accept |
| Reliability Engineer | Ship structured logging and Alloy pipeline in first scaffold. | 5 | 3 | 4 | Accept |
| Security Engineer | Add SSRF guardrails to unfurl API and logging redaction defaults. | 5 | 2 | 4 | Accept |
| Product Architect | Encode ubiquitous language in README + docs + package naming. | 4 | 2 | 2 | Accept |

## Rejected or Deferred

- Full production-grade auth and RBAC implementation in iteration 1: deferred to next vertical slice.

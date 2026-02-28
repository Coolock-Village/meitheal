# Frontier Expert Panel — Phase 25 Iteration 04

## Objective

Fresh audit focused on authentication security, API error handling, and service layer robustness.

| Persona | Recommendation | Impact | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Platform Architect | settings.ts GET L62-66 has a catch block that swallows all errors and returns empty {}. Log the error before returning, so DB failures are diagnosable. | 4 | 1 | 1 | ✅ Accept |
| OSS Integrations Specialist | The Vikunja compat auth module loads tokens from env on every request (L23). Cache the tokens array at module load to avoid repeated env parsing. | 2 | 1 | 1 | ✅ Accept |
| Reliability Engineer | settings.ts PUT L97, like GET, swallows all errors silently. Add console.error logging so failures are traceable. | 3 | 1 | 1 | ✅ Accept |
| Security Engineer | vikunja-compat/auth.ts L41 uses Array.includes() for bearer token comparison. This is O(n) but NOT timing-safe. For secrets comparison, use a constant-time comparison to prevent timing side-channel attacks. | 5 | 2 | 2 | ✅ Accept |
| Product Architect | If settings GET returns empty {} on error (L63), the client assumes no settings exist and may reset defaults. At minimum, return a 500 status instead of silent 200. | 4 | 1 | 1 | ✅ Accept |

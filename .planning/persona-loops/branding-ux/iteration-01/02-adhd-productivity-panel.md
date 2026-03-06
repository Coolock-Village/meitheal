# Panel 2: ADHD/Productivity — Branding Overhaul UX Audit

## Workflow Coach
**Recommendation:** The "Good Evening! ✦" greeting uses a decorative symbol but provides no orientation beyond time-of-day. Replace the ✦ with a dynamic context hint showing the user's most urgent item count (e.g., "Good Evening! 1 overdue") to reduce the cognitive cost of figuring out what to do first.
- Impact: 3 (Moderate — reduces "where do I start?" friction)
- Effort: 2 (Small — data already available in `stats.overdue`)
- Risk: 1 (No regression — purely UI text)
- **Decision: Accept** ✅

## Execution Coach
**Recommendation:** No execution issue. The branding changes are purely visual and don't affect CI gates or enforcement. The build passes cleanly.
- Impact: 1 (Negligible)
- Effort: 1 (No change)
- Risk: 1 (No risk)
- **Decision: Reject** ❌ (No actionable change)

## Knowledge Coach
**Recommendation:** The color token names in `_tokens.css` (e.g., `--bg-primary`, `--accent`) are generic. Add a comment block at the top of the token definitions documenting the brand palette name ("Hearth Slate + Electric Indigo") and the hex-to-name mapping so future contributors know the design intent.
- Impact: 2 (Minor — KCS compliance, future-self clarity)
- Effort: 1 (Trivial — add 5-line comment block)
- Risk: 1 (No regression)
- **Decision: Accept** ✅

## Focus Optimizer
**Recommendation:** This iteration is well-scoped — branding only, no feature creep. No corrective action needed.
- Impact: 1 (Negligible)
- Effort: 1 (No change)
- Risk: 1 (No risk)
- **Decision: Reject** ❌ (No actionable change)

## Automation Coach
**Recommendation:** The E2E branding test checks font loading and CSS token values but doesn't catch regressions when a user changes their custom accent color. Add one test case that verifies the settings color picker updates `--accent` in real-time.
- Impact: 3 (Moderate — catches accent picker regressions)
- Effort: 2 (Small — extend existing branding.spec.ts)
- Risk: 1 (No regression)
- **Decision: Accept** ✅

# 50-Persona Audit — Branding Overhaul

**Scope:** Full visual identity, typography, color palette, logo, README positioning, and naming conventions for Meitheal.

---

## Category 1: Visual Identity (5 personas)

### 1. Brand Strategist
**Finding:** Current color palette (#131320 dark purple + #10b981 green accent) lacks the sharp, modern, technical aesthetic of peers like Linear, Vercel, or Obsidian. The green accent is generic and doesn't differentiate Meitheal.
**Action:** Replace entire palette with Slate/Indigo/Amber:
- Background: `#0F172A` (Hearth Slate)
- Surface: `#1E293B` (slate-800)
- Primary: `#6366F1` (Electric Indigo)
- Accent: `#F59E0B` (Harvest Gold)
- I:5 | E:3 | R:2

### 2. Color System Designer
**Finding:** 27+ hardcoded `#10b981` references across components, DB defaults, API responses, and error pages. The color is baked into SQL `CREATE TABLE` statements (board default color). The light theme also uses green. HA passthrough uses green fallback.
**Action:** Systematic sweep to replace all `#10b981` with `#6366F1` (indigo). Update DB migration to change default board color. Update HA passthrough fallback. Update all theme variants.
- I:5 | E:4 | R:3

### 3. Dark Theme Specialist
**Finding:** Current dark backgrounds (#131320 primary, #1e1e34 secondary, #1c2540 card) are a purple-tinted dark. The new Slate palette (#0F172A, #1E293B) is a neutral, technical dark that provides better contrast and looks more professional.
**Action:** Update `:root` vars, RGB channel vars, and all related shadow/border values to Slate-based palette.
- I:4 | E:3 | R:2

### 4. Light Theme Specialist
**Finding:** Light theme uses green accent (#059669) and warm whites. Need to update to Indigo primary with Slate-derived surfaces.
**Action:** Update `[data-theme="light"]` and `@media (prefers-color-scheme: light)` blocks with Indigo-accent equivalents.
- I:3 | E:2 | R:2

### 5. Accent Color Consistency Reviewer
**Finding:** Settings page has an accent color picker with green as the default swatch. The notification system uses `"#10b981"` for Android accent and `"#f59e0b"` for reminder accent. Priority level 4 uses green. Board defaults use green.
**Action:** Update accent color picker default to Indigo. Update notification Android accent to Indigo. Preserve Amber for warnings/reminders (already aligned). Update priority color 4.
- I:4 | E:3 | R:2

---

## Category 2: Typography (5 personas)

### 6. Type System Architect
**Finding:** Current fonts are Inter Variable (body/UI) and JetBrains Mono (monospace). The brand strategy calls for Outfit (headings) and Geist (body/UI). JetBrains Mono stays for monospace.
**Action:** Install `@fontsource/outfit` and `@fontsource-variable/geist-sans`. Add @font-face declarations. Update Tailwind `fontFamily` config. Keep JetBrains Mono for `font-mono`.
- I:5 | E:3 | R:2

### 7. Font Loading Performance Reviewer
**Finding:** Current fonts are self-hosted with `font-display: swap` and latin-only subsets. CSP enforces `font-src 'self'`. New fonts must follow the same pattern — no CDN, local bundles only.
**Action:** Install fontsource packages. Add @font-face with `swap` display and latin subset. Verify no external URL references added. Keep CSP compliant.
- I:4 | E:2 | R:1

### 8. Heading Hierarchy Reviewer
**Finding:** No explicit heading font family is set in `_base.css` — h1-h6 inherit the body `font-sans`. The brand calls for Outfit on headings specifically.
**Action:** Add `h1, h2, h3, h4, h5, h6 { font-family: 'Outfit', ... }` in `_base.css`. Add `fontFamily.heading` to Tailwind config.
- I:4 | E:2 | R:1

### 9. Font Fallback Chain Reviewer
**Finding:** Current fallback is `['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']`. New body should fallback from Geist → Inter → system. Headings: Outfit → Inter → system.
**Action:** Define two font stacks in Tailwind: `sans` (Geist body) and `heading` (Outfit headings). Keep Inter as first fallback for both.
- I:3 | E:1 | R:1

### 10. Font Weight Auditor
**Finding:** Inter Variable is loaded with full weight range (100-900). Geist and Outfit should be loaded with the specific weights actually used (400, 500, 600, 700) to minimize bundle size.
**Action:** Import only the weights used in the app. Check which weights are referenced in CSS.
- I:3 | E:2 | R:1

---

## Category 3: Logo & Iconography (5 personas)

### 11. Logo Designer
**Finding:** Current logo is ☘️ emoji + "Meitheal" text. The brand calls for "The Village Hub" SVG logo — three geometric nodes forming a home/roof shape.
**Action:** Create `public/logo.svg` with the Village Hub design. Create `public/logo-woven-checkmark.svg` as alternative. Update Sidebar to use SVG instead of emoji.
- I:5 | E:2 | R:1

### 12. Favicon Specialist
**Finding:** Current favicon/icon assets are PNG files in `meitheal-hub/` (`icon.png` 128×128, `logo.png` 250×100). Need new SVG-based favicons in multiple sizes.
**Action:** Generate favicon set from Village Hub SVG. Update `<link rel="icon">` in Layout. Update HA addon `icon.png` and `logo.png`.
- I:4 | E:3 | R:2

### 13. PWA Icon Reviewer
**Finding:** `manifest.webmanifest.ts` generates a dynamic manifest. It likely references icon assets. PWA install banner uses accent color. Need to update icons and theme_color.
**Action:** Update manifest to use new icon assets and Indigo/Slate theme colors. Update `theme-color` meta tag.
- I:3 | E:2 | R:1

### 14. HA Addon Store Icon Reviewer
**Finding:** HA addon store requires `icon.png` (128×128) and `logo.png` (250×100). These are currently existing PNGs that need to be regenerated from the new SVG brand.
**Action:** Generate raster versions of Village Hub logo for HA addon store. Replace `meitheal-hub/icon.png` and `meitheal-hub/logo.png`.
- I:4 | E:2 | R:1

### 15. Sidebar Logo Integration Reviewer
**Finding:** Sidebar uses `<span class="text-2xl" aria-hidden="true">☘️</span> Meitheal` with IPA pronunciation and hover tooltip. The SVG logo should replace the emoji but preserve the tooltip and IPA behavior.
**Action:** Replace emoji span with inline SVG (24px). Keep IPA and tooltip. Ensure hover and accessibility attributes maintained.
- I:3 | E:2 | R:1

---

## Category 4: README & Positioning (5 personas)

### 16. Open Source README Strategist
**Finding:** Repo README has a "Feature Inventory" table comparing against Vikunja and Trello. This is a Red Ocean strategy. Brand calls for Blue Ocean — highlight unique value, not competitor parity.
**Action:** Rewrite README with the brand story ("What is Meitheal?"), key features list (no competitor columns), HA-native callout, Astro.build mention, and tagline.
- I:5 | E:3 | R:1

### 17. HA Addon README Writer
**Finding:** `meitheal-hub/README.md` is sparse — basic install steps, local testing, and config table. Missing the brand story, features, and ecosystem context.
**Action:** Add "What is Meitheal?" section, key features, HA-native explanation, and link to repo README.
- I:4 | E:2 | R:1

### 18. Tagline & Positioning Reviewer
**Finding:** Current tagline is "The cooperative task and life engine for your home." The brand calls for: "Centralize your tasks. Automate the coordination. Get out of the way of life."
**Action:** Update README headers, HA addon descriptions, and sidebar tooltip to use new tagline.
- I:4 | E:1 | R:1

### 19. Technical Writing Auditor
**Finding:** README has technical sections (Container Testing, API Docs, Status) that should come after the brand/features sections. Structure should be: Story → Features → Screenshots → Install → Technical.
**Action:** Reorganize README structure. Move technical details to bottom. Lead with brand story and features.
- I:3 | E:1 | R:1

### 20. Grocy/Meitheal Differentiation Writer
**Finding:** The brand explicitly differentiates from Grocy: "Grocy is WHAT, Meitheal is WHEN/WHERE." This needs to be in the README clearly.
**Action:** Include the Grocy/Meitheal distinction in the README under a clear subsection.
- I:3 | E:1 | R:1

---

## Category 5: Naming & Language (5 personas)

### 21. Ecosystem Naming Auditor
**Finding:** Brand strategy defines naming: "The App: Just Meitheal", "Strategy Frameworks: Strategic Lenses", "AI/Automation: Digital Neighbors". Current code/UI may use "Hub" or other variants inconsistently.
**Action:** Audit UI labels, settings, and docs for naming consistency. Replace "Meitheal Hub" with "Meitheal" in user-facing contexts (keep "meitheal-hub" as the addon package name only).
- I:3 | E:2 | R:1

### 22. Brand Voice Auditor
**Finding:** Brand voice is "Pragmatic & Action-Oriented. Cut the fluff. Use strong verbs." Current README uses softer language like "cooperative task and life engine." Needs to be punchier.
**Action:** Review all user-facing copy in README, DOCS.md, and addon descriptions for brand voice alignment.
- I:3 | E:1 | R:1

### 23. Ubiquitous Language Consistency Reviewer
**Finding:** README uses "Villagers" for users and "Endeavors" for goals. These are the defined domain terms. Verify the brand copy doesn't introduce conflicting terminology.
**Action:** Verify README brand copy uses consistent ubiquitous language where domain terms appear.
- Verified ✅ (brand story uses everyday language, not domain terms — appropriate for external README)

### 24. HA Addon Description Writer
**Finding:** `meitheal-hub/config.yaml` has a `description` field used in the HA addon store. Needs to reflect the new brand positioning, not just "cooperative task and life engine."
**Action:** Update addon `description` to use the new tagline or short positioning statement.
- I:3 | E:1 | R:1

### 25. URL & Slug Reviewer
**Finding:** All routes follow clean, human-readable URLs (`/kanban`, `/settings`, `/today`). No generated artifacts in URLs. Brand calls for "treat URL like API." Already compliant.
- Verified ✅

---

## Category 6: Design Token Architecture (5 personas)

### 26. CSS Variable Migration Planner
**Finding:** All color tokens are CSS custom properties with hex values and matching RGB channel vars. Changing the palette requires updating both hex and RGB vars across `:root`, `[data-theme="light"]`, and `[data-theme="auto"]` blocks. The HA passthrough block also needs updating.
**Action:** Systematic update of all CSS var declarations. Ensure hex and RGB channel vars remain in sync.
- I:4 | E:3 | R:2

### 27. Tailwind Config Consistency Reviewer
**Finding:** Tailwind config references CSS vars via `rgb(var(--xxx-rgb) / <alpha-value>)` pattern. The config itself is color-value agnostic — it just reads vars. Comment says "Irish navy + emerald" which is outdated.
**Action:** Update Tailwind config comment to reflect new palette. No structural changes needed. Add `fontFamily.heading` for Outfit.
- I:2 | E:1 | R:1

### 28. Border & Focus Ring Reviewer
**Finding:** `--border-focus` is set to green (`#10b981`). Focus rings use accent color. These should update to Indigo to match the new primary.
**Action:** Update `--border-focus` to `#6366F1`. Update focus ring box-shadow color references.
- I:3 | E:1 | R:1

### 29. Shadow & Depth System Reviewer
**Finding:** Shadow tokens use `rgba(0,0,0,...)` which is palette-agnostic. No changes needed.
- Verified ✅

### 30. Gradient & Loading Bar Reviewer
**Finding:** Page loading bar uses `linear-gradient(90deg, var(--accent), var(--info))`. This will naturally update when accent changes to Indigo. However, `--info` is blue (#3b82f6) — Indigo + Blue gradient may lack contrast.
**Action:** Consider changing `--info` to a lighter blue or keeping as-is and testing visually. The gradient may need adjustment.
- I:2 | E:1 | R:1

---

## Category 7: Component Impact (5 personas)

### 31. Priority Color Mapper
**Finding:** Priority levels use hardcoded colors: level 4 maps to `#10b981` (green) in PriorityLabel, kanban, today, and upcoming pages. Need to update to Indigo.
**Action:** Update priority 4 color from `#10b981` to `#6366F1` across all priority color maps.
- I:3 | E:2 | R:2

### 32. Board Default Color Reviewer
**Finding:** Board default color in SQL schema is `'#10b981'`. API POST `/api/boards` defaults to `'#10b981'`. Board creation in `[id].ts` uses `'#10b981'`. The `index.astro` dashboard also has green defaults.
**Action:** Update all board default colors to `#6366F1`. Note: existing boards in DB will keep their old color — this only affects new boards.
- I:3 | E:2 | R:2

### 33. Settings Accent Picker Reviewer
**Finding:** SettingsSystem.astro has a color picker with preset swatches. Green (`#10b981`) is the default, labeled "Emerald (Default)." Need to make Indigo the default.
**Action:** Add Indigo swatch as default. Rename labels. Update `localStorage` default fallback from `#10b981` to `#6366F1`.
- I:4 | E:2 | R:1

### 34. Error Page Reviewer
**Finding:** `500.astro` has inline styles with `background: #10b981` for the primary button. Hardcoded because error pages can't rely on the CSS build.
**Action:** Update hardcoded color in 500.astro to `#6366F1`.
- I:2 | E:1 | R:1

### 35. Card Badge Reviewer
**Finding:** `_cards.css` uses `@apply bg-accent/10 text-emerald-400 border-accent/20`. The `text-emerald-400` is a Tailwind utility that won't update with our CSS vars.
**Action:** Replace `text-emerald-400` with `text-accent` or a custom `text-indigo-400` class.
- I:3 | E:1 | R:1

---

## Category 8: Build & Bundle (5 personas)

### 36. Package Installation Reviewer
**Finding:** Need to install `@fontsource/outfit` and `@fontsource-variable/geist-sans` (or `@fontsource/geist-sans`). Check npm registry for correct package names.
**Action:** Run `pnpm add @fontsource/outfit @fontsource-variable/geist-sans` in `apps/web/`. Verify packages exist. If `geist-sans` isn't available via fontsource, find alternative self-hosted source.
- I:4 | E:2 | R:2

### 37. Font File Size Auditor
**Finding:** Current font bundle is Inter Variable (latin, woff2) + JetBrains Mono (2 weights, woff2+woff). Adding Outfit + Geist adds to bundle. Need to minimize — latin subset, woff2 only, specific weights.
**Action:** Import latin-only subsets. Use variable font versions if available to reduce file count.
- I:3 | E:2 | R:1

### 38. CSP Font Compliance Reviewer
**Finding:** CSP header enforces `font-src 'self'`. Self-hosted fontsource packages use local paths via postcss-import resolution. New fonts must follow same pattern — `url('@fontsource/...')` references only.
**Action:** Verify font-face `src` URLs are local fontsource paths, not CDN URLs. CSP audit token header.
- I:4 | E:1 | R:1

### 39. Build Output Size Monitor
**Finding:** No font tree-shaking in current build. All installed font weights are bundled. Need to import only what's used.
**Action:** Import specific weight files only. Don't import full package entry points.
- I:2 | E:1 | R:1

### 40. PostCSS Import Order Reviewer
**Finding:** `global.css` uses `@import './_tokens.css'` first, then @tailwind directives last. Font-face declarations in `_tokens.css` are processed by postcss-import before Tailwind. New fonts must be declared in `_tokens.css` to maintain this order.
**Action:** Add Outfit and Geist @font-face declarations alongside existing Inter/JetBrains in `_tokens.css`.
- I:3 | E:1 | R:1

---

## Category 9: Testing & Regression (5 personas)

### 41. E2E Theme Test Reviewer
**Finding:** `theme-settings.spec.ts` tests theme switching (dark/light/auto/custom) and persistence. It checks `data-theme` and class attributes. It does NOT test specific color values. Branding changes won't break these tests.
**Action:** No changes to existing tests needed. Consider adding a font-family assertion test.
- I:2 | E:1 | R:1

### 42. Visual Regression Tester
**Finding:** No visual regression tests (screenshot comparison) exist. The branding change affects every page visually. Need to verify by running locally and checking key pages.
**Action:** Use `npm run dev` and browser subagent to visually verify dashboard, kanban, settings, and sidebar after changes.
- I:4 | E:3 | R:1

### 43. Font Loading E2E Tester
**Finding:** No existing test verifies font loading. Need to ensure Outfit and Geist actually load and render correctly, and Inter/JetBrains Mono still work as fallbacks.
**Action:** Add e2e test that checks `document.fonts.check()` for new font families. Add to `tests/e2e/branding.spec.ts`.
- I:4 | E:3 | R:1

### 44. Color Token E2E Tester
**Finding:** No test verifies specific CSS variable values. After the palette change, we should verify key variables are set correctly.
**Action:** Add e2e test asserting `getComputedStyle` for `--bg-primary`, `--accent`, key token values. Add to `tests/e2e/branding.spec.ts`.
- I:3 | E:2 | R:1

### 45. Build Smoke Test
**Finding:** `pnpm check` and `astro build` verify TypeScript and build correctness. These should pass after changes — fonts and colors are CSS-only, no type changes.
**Action:** Run `pnpm check` and `pnpm build` after all changes to catch any issues.
- I:3 | E:1 | R:1

---

## Category 10: Documentation & Ecosystem (5 personas)

### 46. STACK.md Updater
**Finding:** STACK.md documents "Fonts (Self-Hosted)" section with Inter + JetBrains Mono. Needs to be updated with Outfit + Geist. The comment "Irish navy + emerald" in tailwind config also needs updating.
**Action:** Update STACK.md fonts table. Update tailwind config comment. Update CSS architecture description.
- I:3 | E:1 | R:1

### 47. DOCS.md Reviewer
**Finding:** `meitheal-hub/DOCS.md` likely has setup/operations info. Verify it doesn't reference old branding or colors.
**Action:** Scan DOCS.md for any old branding references and update.
- I:2 | E:1 | R:1

### 48. Notification Accent Updater
**Finding:** Android push notifications use `color: "#10b981"` (green accent). This should be updated to Indigo to match the new brand.
**Action:** Search `ha-connection.ts` or notification dispatch files for hardcoded color values and update.
- I:3 | E:1 | R:1

### 49. Repository Metadata Updater
**Finding:** `repository.yaml` contains HA addon repository metadata. May reference old description or branding.
**Action:** Update repository.yaml description and any branding references.
- I:2 | E:1 | R:1

### 50. Persona Loop Index Updater
**Finding:** `.planning/persona-loops/INDEX.md` classifies persona loops. This branding audit needs to be added.
**Action:** Add branding-overhaul entry to INDEX.md.
- I:1 | E:1 | R:1

---

## Summary Table

| # | Persona | Finding | I | E | R | Net | Execute? |
|---|---------|---------|---|---|---|-----|----------|
| 1 | Brand Strategist | Palette swap to Slate/Indigo/Amber | 5 | 3 | 2 | +3 | ✅ |
| 2 | Color System Designer | 27+ hardcoded green refs | 5 | 4 | 3 | +2 | ✅ |
| 3 | Dark Theme Specialist | Purple → Slate backgrounds | 4 | 3 | 2 | +1 | ✅ |
| 4 | Light Theme Specialist | Green → Indigo light mode | 3 | 2 | 2 | +1 | ✅ |
| 5 | Accent Consistency | Settings picker, notifications | 4 | 3 | 2 | +1 | ✅ |
| 6 | Type System | Outfit headings + Geist body | 5 | 3 | 2 | +3 | ✅ |
| 7 | Font Loading Perf | Self-host, swap, latin | 4 | 2 | 1 | +2 | ✅ |
| 8 | Heading Hierarchy | Add heading font stack | 4 | 2 | 1 | +2 | ✅ |
| 9 | Font Fallback | Geist → Inter → system | 3 | 1 | 1 | +2 | ✅ |
| 10 | Font Weight | Import only used weights | 3 | 2 | 1 | +1 | ✅ |
| 11 | Logo Designer | Village Hub SVG | 5 | 2 | 1 | +3 | ✅ |
| 12 | Favicon | Multi-size from SVG | 4 | 3 | 2 | +1 | ✅ |
| 13 | PWA Icons | Manifest + theme_color | 3 | 2 | 1 | +1 | ✅ |
| 14 | HA Addon Icons | icon.png + logo.png | 4 | 2 | 1 | +2 | ✅ |
| 15 | Sidebar Logo | SVG replaces emoji | 3 | 2 | 1 | +1 | ✅ |
| 16 | README Strategist | Blue Ocean rewrite | 5 | 3 | 1 | +3 | ✅ |
| 17 | HA README Writer | Brand story + features | 4 | 2 | 1 | +2 | ✅ |
| 18 | Tagline Reviewer | New tagline everywhere | 4 | 1 | 1 | +3 | ✅ |
| 19 | Tech Writing | Reorganize README structure | 3 | 1 | 1 | +2 | ✅ |
| 20 | Grocy Distinction | WHAT vs WHEN/WHERE | 3 | 1 | 1 | +2 | ✅ |
| 21 | Naming Auditor | "Meitheal" not "Hub" in UI | 3 | 2 | 1 | +1 | ✅ |
| 22 | Brand Voice | Pragmatic & action-oriented | 3 | 1 | 1 | +2 | ✅ |
| 24 | Addon Description | Config.yaml description | 3 | 1 | 1 | +2 | ✅ |
| 26 | CSS Var Migration | Hex + RGB sync | 4 | 3 | 2 | +1 | ✅ |
| 27 | Tailwind Comment | Update palette description | 2 | 1 | 1 | +1 | ✅ |
| 28 | Focus Ring | Green → Indigo | 3 | 1 | 1 | +2 | ✅ |
| 30 | Loading Bar | Gradient check | 2 | 1 | 1 | +1 | ✅ |
| 31 | Priority Colors | Level 4 green → indigo | 3 | 2 | 2 | +1 | ✅ |
| 32 | Board Defaults | DB + API defaults | 3 | 2 | 2 | +1 | ✅ |
| 33 | Settings Accent | Default swatch | 4 | 2 | 1 | +2 | ✅ |
| 34 | Error Page | 500.astro inline color | 2 | 1 | 1 | +1 | ✅ |
| 35 | Card Badge | emerald-400 utility | 3 | 1 | 1 | +2 | ✅ |
| 36 | Package Install | Outfit + Geist npm | 4 | 2 | 2 | +2 | ✅ |
| 37 | Font Size | Latin-only, woff2 | 3 | 2 | 1 | +1 | ✅ |
| 38 | CSP Font | Self-hosted compliance | 4 | 1 | 1 | +3 | ✅ |
| 40 | PostCSS Order | _tokens.css placement | 3 | 1 | 1 | +2 | ✅ |
| 42 | Visual Regression | Browser verify | 4 | 3 | 1 | +1 | ✅ |
| 43 | Font E2E | document.fonts check | 4 | 3 | 1 | +1 | ✅ |
| 44 | Color Token E2E | getComputedStyle assert | 3 | 2 | 1 | +1 | ✅ |
| 45 | Build Smoke | pnpm check + build | 3 | 1 | 1 | +2 | ✅ |
| 46 | STACK.md | Update fonts table | 3 | 1 | 1 | +2 | ✅ |
| 48 | Notification Accent | Android push color | 3 | 1 | 1 | +2 | ✅ |
| 49 | Repo Metadata | repository.yaml | 2 | 1 | 1 | +1 | ✅ |

**Verified OK:** #23 (ubiquitous language), #25 (URLs), #29 (shadows)
**Total actionable items: 42**

# Concerns & Technical Debt

> Last mapped: 2026-03-09 — v0.1.99 (UI/UX audit update)

## P0 — Critical

### ~~Inline SQL in API Routes~~ (RESOLVED — Phase 2)
- Migrated 107→4 inline SQL calls to 6 typed repositories
- 4 intentional inline SQL remaining: health.ts, ha/status.ts, backup/prepare.ts, v1/tasks.ts

### Scroll Blocking — Nested Overflow Contexts
- **Files**: `apps/web/src/styles/_layout.css:125-134`, `apps/web/src/styles/_base.css:11-23`
- **Issue**: `.main-content` has `height: 100vh` + `overflow-y: auto`, creating its own scroll context. Body/html also has `overflow-x: hidden`. Mouse wheel events target body but the scrollable element is `.main-content` — scroll appears broken on initial page load
- **Reproduction**: Open any page → scroll with mouse wheel — nothing happens until user clicks inside `.main-content`
- **Root cause**: Dual scroll contexts — `body { flex; min-h-screen; overflow-x: hidden }` vs `.main-content { height: 100vh; overflow-y: auto }`
- **Fix**: Remove `height: 100vh` from `.main-content`, let body handle scrolling. Change `.main-content` to `min-height: 100vh` with `overflow-x: hidden` only

### Body Overflow Stuck After Task Detail Close
- **Files**: `apps/web/src/layouts/Layout.astro:1371-1377`, `apps/web/src/lib/layout-controller.ts:207-209`
- **Issue**: Opening task detail sets `document.body.style.overflow = 'hidden'`. Closing via Escape key in `layout-controller.ts` removes panel but does NOT reset `body.style.overflow`. Only `pagehide` event resets it.
- **Impact**: After closing task detail, page scroll is permanently disabled until navigation
- **Fix**: All close paths (Escape, click outside, close button) must reset `document.body.style.overflow = ''`

### Large Page Files (Partially Addressed)
- **Files**: `kanban.astro` (~2622 lines, 87KB), `settings.astro` (~2200 lines), `table.astro` (~1000 lines), `index.astro` (~600 lines), `Layout.astro` (~1501 lines, 59KB)
- **Issue**: Mixing Astro templates, CSS, and large inline scripts. `Layout.astro` handles sidebar, navigation, command palette, keyboard shortcuts, health checks, fetch patching, focus traps, theme management, SW registration, ingress state persistence
- **Risk**: Hard to maintain, test, and review. Inline `is:inline` scripts are invisible to TypeScript
- **Fix**: Phase 3 (Page Decomposition) — extract scripts to typed `.ts` modules

## P1 — High

### Theme Initialization Gap — Dark Mode Fallthrough
- **Files**: `apps/web/src/styles/_tokens.css:87-243`, `apps/web/src/layouts/Layout.astro:184-203`
- **Issue**: `:root` CSS vars define dark theme colors as default. `[data-theme="light"]` overrides for light. But when theme is "dark", no `data-theme="dark"` attribute is set — relies on `:root` fallthrough. If any component uses `[data-theme="dark"]` selector, styles won't apply
- **Impact**: Theme inconsistency between components, especially HA theme passthrough
- **Fix**: Theme init script should always set `data-theme` attribute, including explicit `data-theme="dark"`

### Duplicate Service Worker Registration
- **Files**: `apps/web/src/layouts/Layout.astro:1282-1330` (inline block), `apps/web/src/layouts/Layout.astro:1451-1497` (module import)
- **Issue**: SW registration runs twice — once in an earlier `<script>` block (L1282-1330) and again via module import of `@domains/offline/sw-register` (L1451-1497)
- **Impact**: Race conditions, double registration events, unnecessary network requests
- **Fix**: Remove the inline block, keep only the module import version

### Missing Touch Drag Support on Kanban
- **Files**: `apps/web/src/pages/kanban.astro:443-444`
- **Issue**: HTML5 Drag API (`ondragstart`, `ondragend`) doesn't work on mobile touch devices
- **Impact**: Kanban board non-functional on iPhones, iPads, Android phones (touch users)
- **Fix**: Add touch event handlers (touchstart/touchmove/touchend) with drag simulation, or use a touch-aware drag library

### Missing `is:inline` Script Tests
- All client-side interactivity is in `<script is:inline>` blocks within `.astro` files
- These are invisible to TypeScript and untestable in unit tests
- Risk: Regressions in kanban drag-drop, table sorting, command palette

### Version Sync is Manual
- Three files must stay in sync: `config.yaml`, `run.sh`, `sw.js`
- No automated validation or build hook to enforce
- Risk: Mismatched versions between SW cache and backend

## P2 — Medium

### ~~Drizzle ORM Unused~~ (Still present)
- Drizzle is a dependency but **not used for queries**
- All SQL is raw `client.execute()` now in repositories
- Consider: Remove drizzle deps or migrate to Drizzle queries

### Missing Command Palette Shortcut
- **Files**: `apps/web/src/lib/layout-controller.ts:180-345`
- **Issue**: `Ctrl+K` / `Cmd+K` not handled — command palette exists in DOM but no keyboard shortcut to open it
- **Fix**: Add `(e.metaKey || e.ctrlKey) && e.key === 'k'` handler in keydown listener

### Inline Event Handlers Require `unsafe-inline` CSP
- **Files**: `apps/web/src/pages/kanban.astro:325-327`, `apps/web/src/layouts/Layout.astro:1203`
- **Issue**: `ondrop`, `ondragover`, `ondragleave`, `onclick` attributes in HTML require `script-src 'unsafe-inline'` in CSP
- **Fix**: Move event handlers to JS (addEventListener)

### Task Detail Panel Accessibility
- **Files**: `apps/web/src/layouts/Layout.astro:451-460`
- **Issue**: Panel has `role="dialog"` but no dynamic `aria-label` (should be set to task title). Focus not moved into panel on open.
- **Fix**: Set `aria-label` to task title dynamically, move focus to panel on open

### Emoji-Only Button Labels
- **Files**: `apps/web/src/pages/kanban.astro:634-660`
- **Issue**: Edit (✏️), Duplicate (⧉), Delete (🗑) buttons use emoji without `aria-label`
- **Fix**: Add descriptive `aria-label` attributes

### CSS @apply Lint Warnings
- `_feedback.css` uses `@apply` which IDE CSS linters flag as "Unknown at rule"
- 5 persistent lint warnings — work at build time

### Layout.astro Complexity
- Single file handles: sidebar, navigation, command palette, keyboard shortcuts, health checks, fetch patching, focus traps, theme management, SW registration (x2), ingress state persistence, sidebar badge hydration
- Should be decomposed (Phase 3 target)

## P3 — Low

### Search Results Overflow Clipping
- **Files**: `apps/web/src/styles/_layout.css:266-268`
- **Issue**: Search dropdown renders inside `.main-content` which had `overflow-x: hidden`, potentially clipping results
- **Fix**: Set z-index high enough and ensure dropdown escapes overflow context

### Loading Bar Animation Not Reduced-Motion-Safe
- **Files**: `apps/web/src/layouts/Layout.astro:269-297`, `apps/web/src/styles/_tokens.css:246-279`
- **Issue**: Page transition loading bar uses CSS animation not suppressed by `prefers-reduced-motion`
- **Fix**: Add `@media (prefers-reduced-motion: reduce)` rule to suppress loading bar animation

### No Tablet Breakpoint
- **Files**: `apps/web/src/styles/_responsive.css`
- **Issue**: Only two breakpoints — desktop (>768px) and mobile (≤768px). Tablets get desktop layout
- **Fix**: Add 768px-1024px tablet breakpoint for optimized layout

### Dead Route: `/api/reminders`
- May not be wired to any UI

### No Rate Limit on Export Routes
- `/api/export/database.sqlite` serves full DB file with only global 120/min limit

### Service Worker Version Fallback
- `sw.js` hardcodes `CACHE_VERSION` as fallback — stale cache could persist

### `apps/api/` (Cloudflare Workers) is Inactive
- Not used in production, not in CI

## P4 — Deferred

### `will-change: transform` GPU Memory Leak
- **Files**: `apps/web/src/styles/_responsive.css:345-348`
- **Issue**: `will-change: transform` applied to all `.kanban-card` elements permanently on touch devices — promotes ALL cards to GPU layers
- **Impact**: High GPU memory usage with 100+ cards
- **Fix**: Only apply during active drag operation

### No i18n Translation Files (Partial)
### PWA Background Sync (No visual indicator)
### `window.__healthIntervalId` Pattern (Could leak on full page teardown)

## Security Notes

### ✅ Good
- All SQL uses parameterized queries (`?` placeholders)
- `sanitize-html` used for user HTML content
- XSS vectors fixed (innerHTML → DOM API in kanban, index)
- Rate limiting: 120/req per minute
- CSRF protection in middleware
- CSP headers set
- Secrets redacted in logs

### ⚠️ Watch
- No authentication layer — relies entirely on HA Supervisor headers
- In standalone mode (no HA), all routes are accessible without auth
- Export routes serve raw data without additional access control
- Inline event handlers (`ondrop`, `onclick`) require `unsafe-inline` CSP

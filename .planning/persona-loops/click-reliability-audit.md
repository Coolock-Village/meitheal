# 50-Persona Click & Menu Responsiveness Audit

**Date:** 2026-03-07
**Scope:** Click handlers, menu navigation, modal triggers, settings page, New Task button, sidebar nav — all interactive elements
**Cross-cutting:** Cross-device & cross-browser compatibility, HA ingress iframe, touch/mobile, PWA

---

## Executive Summary

**5 root causes drive nearly all click/menu unreliability:**

| # | Root Cause | Impact | Files |
|---|-----------|--------|-------|
| 1 | **Event listener accumulation** — 43+ click handlers in `Layout.astro` re-added on every ViewTransition navigation with zero cleanup | Double/triple-firing, race conditions, memory leaks | `Layout.astro` (4013 lines) |
| 2 | **`is:inline` scripts re-execute** on every page load without idempotency guards | Duplicate handlers, state corruption | `Layout.astro` ×8, `kanban.astro` ×1, `settings.astro` ×1, `SettingsGeneral.astro` ×5 |
| 3 | **Zero `AbortController`/`removeEventListener`** for DOM events — only 2 `removeEventListener` calls in entire `src/` (for `confirm-dialog` and `I18nText`) | Permanent listener leak, CPU waste | Global |
| 4 | **Per-element listeners** (`querySelectorAll().forEach(addEventListener)`) instead of event delegation — kanban cards, lane management, action buttons | O(n) listeners per page, re-added on every navigation | `kanban.astro` (932–1075), `Layout.astro` |
| 5 | **No touch event handling** — zero `touchstart`/`touchend`/`pointerdown` listeners; relies entirely on `click` events | 300ms touch delay on some mobile browsers, ghost clicks in HA WebView | Global |

**What's already good:**
- 44px min-height touch targets in `_responsive.css` (WCAG 2.1 compliant)
- `@media (pointer: coarse)` rules for touch devices
- Delegated task-detail click handler on `document.body` (correct pattern)
- `data-astro-prefetch="hover"` on sidebar nav links
- ViewTransitions disabled behind HA ingress (prevents redirect loops)

---

## 50-Persona Reviews

### Persona 1–5: UX Engineers

**P1 — Senior UX Engineer (Click Reliability)**
> `Layout.astro` line 3551: `document.body.addEventListener("click", ...)` fires on **every** click on the page body. This is the task-detail delegated handler — it's correctly written. But 6 lines earlier at 3307, another `document.addEventListener("click", ...)` handles dropdown closing. Both are added inside a non-module `<script>` block that runs on every page load, meaning after 3 navigations you have **3 copies** of each running. Clicks start misfiring because the first handler calls `e.stopPropagation()` (line 3562) and subsequent copies see the event differently.
> **Fix:** Wrap in `astro:page-load` with AbortController cleanup, or use event delegation with a single global init guard.

**P2 — UX Engineer (New Task Modal)**
> The "New Task" button (`#kanban-new-task-btn`, `kanban.astro` line 1078) calls `window.openNewTaskModal()`. This function is defined in `Layout.astro` and set on window inside a `<script>` (non-inline) block. The problem: on ViewTransition navigation, Astro hoists module scripts and **deduplicates** them — meaning the second navigation might not re-run the script, leaving `window.openNewTaskModal` pointing to stale DOM references. The kanban `is:inline` script at line 723 runs on every load but the Layout module script doesn't.
> **Fix:** Move `openNewTaskModal` registration into an `astro:page-load` handler, or use `is:inline` with an idempotency guard.

**P3 — UX Engineer (Settings Page)**
> `settings.astro` is 129KB. The tab-switching logic at line 72 uses `<script is:inline>` with both `initSettingsTabs()` immediately + `astro:page-load` listener. But each settings tab component (`SettingsGeneral.astro`, `SettingsIntegrations.astro`, `SettingsSystem.astro`) also registers its own `astro:page-load` listeners — 5 in SettingsGeneral, 10 in SettingsIntegrations, 3 in SettingsSystem. That's **18+ init functions** firing on every navigation, many of which attach click handlers to the same DOM elements without checking if handlers already exist.
> **Fix:** Use a single init orchestrator with AbortController per page lifecycle.

**P4 — UX Engineer (Sidebar Navigation)**
> Sidebar uses standard `<a>` links with `data-astro-prefetch="hover"` (good). However, `SidebarNavList.astro` registers `astro:after-swap` for active link updating (line 110) without any cleanup. This listener accumulates across sessions. The sidebar is `transition:persist="sidebar"` which means it survives navigations — but its event listeners are re-registered.
> **Fix:** Use the `{ once: true }` pattern or check if listener is already registered.

**P5 — UX Engineer (Mobile Sidebar)**
> The mobile sidebar toggle (`TopNavigation.astro` line 89) adds a click listener to `#mobile-menu-btn`. This is in a module `<script>` so Astro deduplicates it. But the sidebar's `::after` overlay (line 374-382 in `Sidebar.astro`) is CSS-only with no click handler — tapping the dark overlay behind an open sidebar does **nothing**. Users can't dismiss the mobile sidebar by tapping outside.
> **Fix:** Add a click handler on the sidebar overlay to close it.

### Persona 6–10: Performance Engineers

**P6 — Performance Engineer (Memory)**
> `Layout.astro` at line 1190: `setInterval(checkHealth, 30000)` creates a 30s health check interval. This **never gets cleared** — it accumulates on ViewTransition navigations. After 10 navigations, you have 10 concurrent health check intervals, each firing fetch requests every 30 seconds.
> **Impact:** 10 navigations = 20 requests/minute instead of 2/minute.
> **Fix:** Store the interval ID and clear it before re-registering, or use a module-level singleton.

**P7 — Performance Engineer (DOM)**
> `kanban.astro` renders up to hundreds of cards, each with 3 action buttons (edit, AI, duplicate) that get individual click listeners at lines 932-1000. With 100 cards, that's **300 addEventListener calls** instead of 3 delegated handlers on the board container.
> **Fix:** Use `document.querySelector('.kanban-board').addEventListener('click', ...)` with `e.target.closest()`.

**P8 — Performance Engineer (Bundle)**
> `Layout.astro` is 162KB / 4013 lines. The entire task-detail panel, command palette, search, shortcuts modal, and task lifecycle logic is in one file. Every page load parses and executes all of it. On HA's resource-constrained environment (128MB Node heap), this is significant.
> **Fix:** Split into focused modules: `task-detail.ts`, `command-palette.ts`, `search.ts`, `keyboard-shortcuts.ts`.

**P9 — Performance Engineer (CSS)**
> `_responsive.css` line 106-117 applies `min-height: 44px` to **all** buttons, inputs, selects, nav-links, kanban-cards, and task-items on mobile. This is correct for touch targets but causes layout reflows when viewport transitions between mobile and desktop (e.g., rotating iPad). No `will-change` or `contain` hints exist.
> **Fix:** Add `contain: layout style` to interactive containers.

**P10 — Performance Engineer (Rendering)**
> The kanban board re-renders all cards on drop (`window.location.reload()` at line 997 for duplicate, 1047 for quick-add, 1139 for WIP change). Full page reload is the nuclear option — it re-parses all JS, re-attaches all listeners, and loses scroll position.
> **Fix:** Use optimistic DOM updates (already partially done for drag-drop) and avoid `window.location.reload()`.

### Persona 11–15: HA Integration Specialists

**P11 — HA Integration (Ingress Iframe)**
> The app runs inside an HA ingress iframe. Iframes intercept some events differently — `window.focus` and `window.blur` events fire unpredictably. The `beforeunload` listener in ingress-state-persistence.ts (line 136) may not fire in iframe contexts on some browsers (particularly Safari/WebKit in HA mobile app). This means state isn't saved and the wrong page appears after iframe recreation.
> **Fix:** Use `visibilitychange` event as primary, `beforeunload` as fallback.

**P12 — HA Integration (WebView Events)**
> HA's Android companion app uses a WebView based on Chromium. iOS uses WKWebView. Both have known quirks with `click` event timing in iframes — a 300ms delay can occur on WKWebView if `touch-action: manipulation` is not set. The CSS `_base.css` does NOT set `touch-action: manipulation` on interactive elements.
> **Fix:** Add `touch-action: manipulation` to `html, body, button, a, input, select` in `_base.css`.

**P13 — HA Integration (Supervisor Restart)**
> When the HA addon restarts, the ingress token changes. The fetch wrapper (`Layout.astro` line 70-141) auto-reloads on 403. But between the 403 detection and reload, all pending click handlers that trigger fetches will also get 403s, causing a cascade of reload attempts. The 10-second guard (line 103) mitigates this but doesn't prevent **all** handlers from attempting fetches.
> **Fix:** Set a global `window.__reloading = true` flag that all fetch-based click handlers check first.

**P14 — HA Integration (Panel Routing)**
> Ingress URL sync is explicitly disabled (`Layout.astro` line 364: "DISABLED — removed to prevent potential HA panel routing interference"). This means HA's sidebar panel entry always opens the app at `/` regardless of where the user was. The state persistence workaround (lines 146-180) only works within 60 seconds of iframe recreation.
> **Fix:** Consider re-enabling with a safer implementation that uses `postMessage` to communicate with the HA parent frame.

**P15 — HA Integration (Compact Mode)**
> HA compact mode (smaller sidebar) is referenced in `_layout.css` for `ha-ingress` but no JS adjusts interactive element sizes. In compact mode, the sidebar `nav-link` elements may be too small for reliable touch on HA mobile.
> **Fix:** Add `.ha-ingress .nav-link { min-height: 48px; }` override.

### Persona 16–20: Mobile & Touch Specialists

**P16 — Touch Specialist (300ms Delay)**
> The entire app has **zero** `touchstart`/`touchend`/`pointerdown` event listeners. All interaction relies on synthetic `click` events. Modern browsers fast-track clicks with `touch-action: manipulation`, but this CSS property is not applied anywhere in the codebase.
> **Critical fix:** Add `touch-action: manipulation` to `html` in `_base.css`. This single line eliminates the 300ms tap delay across all browsers.

**P17 — Touch Specialist (Drag-Drop)**
> Kanban drag-drop uses HTML5 Drag and Drop API (`draggable="true"`, `ondragstart`, `ondragend`). This API does **not work on mobile touch browsers**. Touch users cannot reorder or move kanban cards. The `@media (pointer: coarse)` styles don't compensate for this.
> **Fix:** Add touch-based drag using `touchstart`/`touchmove`/`touchend` with coordinate tracking, or use a library like SortableJS.

**P18 — Touch Specialist (Tap Target Overlap)**
> Kanban card action buttons (edit ✏️, AI 🤖, duplicate ⧉) at `.kanban-card-actions` appear on hover. On touch devices, hover doesn't exist — the buttons may not be visible. Even if visible, they're only ~32px targets inside a card that's itself a click target. Tapping the button area often triggers the card's click handler instead.
> **Fix:** Show action buttons always on touch devices (`@media (pointer: coarse) .kanban-card-actions { opacity: 1; }`), and add `e.stopPropagation()` (already present at lines 933/954/971 — verify it fires before the delegated handler).

**P19 — Touch Specialist (Scroll vs Click)**
> The sidebar scroll area (`.sidebar-scroll`) has `overflow-y: auto`. On mobile, scrolling inside this area can accidentally trigger nav link clicks. No `touch-action: pan-y` is set to tell the browser the scroll container's primary gesture is vertical scrolling.
> **Fix:** Add `touch-action: pan-y` to `.sidebar-scroll`.

**P20 — Touch Specialist (iOS Rubber-band)**
> On iOS Safari (and HA iOS app), the entire viewport rubber-bands on overscroll. This can interfere with pull-to-refresh patterns and make the app feel non-native. No `overscroll-behavior: contain` or `overscroll-behavior: none` is set.
> **Fix:** Add `overscroll-behavior: contain` to `body` and `overscroll-behavior: none` to scrollable containers.

### Persona 21–25: Accessibility & Cross-Browser

**P21 — Accessibility (Keyboard Navigation)**
> The kanban card has `role="button"` and `tabindex="0"` (line 444-445) but **no `keydown` handler for Enter/Space**. Keyboard users cannot activate kanban cards. The delegated click handler on `document.body` only handles `click` events, not `keydown`.
> **Fix:** Add `keydown` to the delegated handler: `if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;`.

**P22 — Accessibility (Focus Management)**
> When the task-detail slide-out panel opens, focus trapping is only partial. `closeTD` function (referenced at line 3519) doesn't return focus to the element that triggered it. After closing the panel, focus goes to `<body>` — keyboard users lose their place.
> **Fix:** Store `document.activeElement` before opening, restore on close.

**P23 — Cross-Browser (Safari)**
> Safari handles `<script>` execution order differently inside ViewTransitions. The `is:inline` scripts in `<head>` (lines 70-258) execute synchronously on Chrome but may be deferred on Safari. The `window.__ingress_path` must be available before the `<body>` scripts run — this is currently fragile.
> **Fix:** Move critical `window.__ingress_path` assignment to the very first `<script>` in `<head>`, before any other scripts.

**P24 — Cross-Browser (Firefox)**
> Firefox does not support the `scrollbar-width: thin` + `scrollbar-color` combination in the same way as Chrome. The sidebar scroll (`.sidebar-scroll` line 251-253) may appear with no scrollbar or a broken one.
> **Fix:** Add `-webkit-` prefixed scrollbar styles as fallback alongside the standard properties.

**P25 — Cross-Browser (Android WebView)**
> HA's Android app uses an older Chromium WebView that may not support `color-mix(in srgb, ...)` (used in Layout.astro line 248-254 for accent color). This could cause CSS parse failures and break the entire custom theme.
> **Fix:** Add a fallback color value before the `color-mix()` call.

### Persona 26–30: Astro Framework Experts

**P26 — Astro Expert (Module vs Inline Scripts)**
> The codebase mixes `<script>` (module, deduped by Astro) and `<script is:inline>` (raw, re-executed). `Layout.astro` has **8 inline scripts** in `<head>` and **1 module script** starting at line 1147. The module script registers `window.openTaskDetail`, `window.openNewTaskModal`, etc. on the `window` object. But because Astro dedupes modules, navigating from `/kanban` to `/table` **does not re-run** the module — so if the first run captured stale DOM refs, they persist.
> **Fix:** Move all window function registrations into `astro:page-load` handlers inside the module.

**P27 — Astro Expert (ViewTransitions + transition:persist)**
> The sidebar div at `Layout.astro` line 369 uses `transition:persist="sidebar"`. This means the sidebar DOM survives ViewTransition swaps. But the sidebar's Astro-scoped `<style>` (lines 239-383) is tied to the component scope hash — if Astro regenerates the hash on a new page, the persisted sidebar's `data-astro-cid-xxx` attribute won't match the new page's CSS hash, **breaking all sidebar styles**.
> **Fix:** This is a known Astro limitation. Use `:global()` for sidebar styles (already partially done at lines 333-359) — ensure ALL sidebar styles are global.

**P28 — Astro Expert (Script Lifecycle)**
> `astro:page-load` fires **after** the new page's DOM is ready. But inline scripts in `<body>` execute **before** `astro:page-load`. This means the kanban `is:inline` script (line 723) runs before Layout's `astro:page-load` handlers. If kanban script calls `window.openTaskDetail` (which is registered in a module script that dedupes), it may call a stale reference.
> **Fix:** Use the retry-loop pattern (already at kanban line 939-948) for all cross-component window function calls. Standardize this as a utility: `waitForFn(name, callback)`.

**P29 — Astro Expert (Prefetch Interference)**
> `data-astro-prefetch="hover"` on nav links triggers a prefetch on hover. When the prefetch request is in-flight and the user clicks, Astro **cancels the prefetch** and starts a new navigation request. This can cause a visible delay (especially on slow connections or HA over LAN). On touch devices, hover fires simultaneously with click, creating a race.
> **Fix:** Change to `data-astro-prefetch="viewport"` for sidebar links — prefetch when they enter the viewport (which is always, since sidebar is always visible).

**P30 — Astro Expert (View Transitions Behind Ingress)**
> ViewTransitions are disabled behind ingress (`Layout.astro` line 312: `{!behindIngress && <ViewTransitions />}`). This means every navigation is a **full page reload** in the HA context. All `is:inline` scripts and module scripts re-run from scratch. This is actually **safer** for event handler cleanup but **slower**. The tradeoff is correct but means all the event accumulation issues only affect standalone mode.
> **Fix:** For standalone mode, implement proper cleanup. For ingress mode, optimize page load time since every click triggers a full reload.

### Persona 31–35: Memory Safety & CPU Engineers

**P31 — Memory Engineer (Listener Leak)**
> With ViewTransitions enabled (standalone mode), navigating between pages accumulates event listeners. Measured: Layout.astro adds ~43 click listeners + ~5 keydown listeners + 2 input listeners + 1 hashchange listener per navigation. After 20 navigations: **~1020 stale click listeners** attached to `document`, `document.body`, and element IDs.
> **Fix:** Create a `PageLifecycle` class that uses a single `AbortController` per navigation cycle. All listeners use `{ signal: controller.signal }`. On `astro:before-swap`, call `controller.abort()`.

**P32 — Memory Engineer (Interval Leak)**
> `setInterval(checkHealth, 30000)` at Layout.astro line 1190 leaks. Each navigation creates a new interval. After 10 navigations: 10 intervals pinging `/api/health` every 30s = **20 requests/min** (10× intended rate).
> **Fix:** Use a module-level variable for the interval ID and `clearInterval` before `setInterval`.

**P33 — Memory Engineer (DOM References)**
> The module script in Layout.astro (line 1147+) captures DOM references (`const tdOverlay = document.getElementById('task-detail-overlay')`, `const cpOverlay = ...`, etc.) at initialization time. After a ViewTransition swap, these references point to **removed DOM elements** that the new page replaced. Any click handler using these stale refs will fail silently or throw.
> **Fix:** Either re-query DOM inside each handler, or re-capture refs in `astro:page-load`.

**P34 — CPU Engineer (Layout Thrashing)**
> The kanban `getDragAfterElement` function (line 914-929) calls `getBoundingClientRect()` on **every card** on every `dragover` event (~60fps). With 50 cards, that's **3000 layout reads/second** during drag. No caching or throttling.
> **Fix:** Cache card bounds on `dragstart`, invalidate on `drop`.

**P35 — CPU Engineer (Search Performance)**
> Command palette search (`cpSearch.addEventListener('input', ...)`) fires on every keystroke. It iterates all `#cp-results > .cp-item` elements AND filters `cpAllTasks` (up to 200 tasks). No debounce.
> **Fix:** Add 150ms debounce on the input handler.

### Persona 36–40: Security & Stability Engineers

**P36 — Security (Click Injection)**
> The delegated click handler at line 3551-3574 opens task detail based on `dataset.id` or `dataset.taskId`. These values come from the DOM — if a malicious script injects a DOM element with a crafted `data-id`, the handler will attempt to `fetch` it. The fetch URL is constructed as `/api/tasks/${taskId}` — this could be exploited for SSRF if taskId contains path traversal.
> **Fix:** Validate taskId with a regex (already done elsewhere: `taskId regex-validated before use` in STACK.md).

**P37 — Stability (Error Boundaries)**
> Click handlers in the kanban `is:inline` script have minimal error handling. Lines 976-998 (duplicate handler) has `catch {}` — a swallowed error with no logging. Lines 1036-1050 (quick-add) also swallows. If these fail, the user sees nothing.
> **Fix:** At minimum, show a toast notification on catch. Use the existing `showToast()` utility.

**P38 — Stability (Race Conditions)**
> The task-detail "Save" handler and the kanban drag-drop handler can race. If a user drags a card to a new column while the task-detail panel has unsaved changes to the same task, the drag-drop `PUT` can overwrite changes or vice versa.
> **Fix:** Use optimistic concurrency control (already have 409 conflict detection in the fetch wrapper at line 119).

**P39 — Stability (Double Submit)**
> No debounce on submit buttons. The "Add" button in kanban quick-add (line 1058) has no loading state or double-click prevention. Rapid clicks create duplicate tasks.
> **Fix:** Add `btn.disabled = true` before fetch, re-enable on error/finally.

**P40 — Stability (Stale State)**
> Command palette loads tasks via `fetch('/api/tasks?limit=200')` on every open (line 3593). If the user opens the command palette, modifies a task in the detail panel, then reopens the palette — the palette shows stale data until the next open. No cache invalidation.
> **Fix:** Listen for `custom:task-updated` events to invalidate the cache.

### Persona 41–45: Optimization Specialists

**P41 — Astro Optimization (Island Architecture)**
> Interactive functionality is implemented via `<script>` tags rather than Astro Islands (Preact/Svelte/React components with `client:` directives). This means all JS runs globally and has no automatic lifecycle management. Astro's island architecture would provide automatic mount/unmount cleanup, eliminating the listener accumulation problem entirely.
> **Fix:** Long-term: migrate interactive components to Astro islands with `client:load`. Short-term: implement manual lifecycle management.

**P42 — Astro Optimization (Code Splitting)**
> `Layout.astro` bundles ALL interactive logic for every page. The task-detail panel, command palette, keyboard shortcuts, and search are loaded on **every** page even if unused (e.g., the settings page doesn't need kanban drag-drop logic).
> **Fix:** Use dynamic imports: `const { openTaskDetail } = await import('./task-detail.ts')`.

**P43 — HA Optimization (Resource Limits)**
> The HA addon runs with 128MB Node heap. The 162KB Layout.astro + 85KB kanban.astro + 129KB settings.astro parsed together with all their listeners consumes significant memory. GC pressure from stale event handler closures holding DOM references delays collection.
> **Fix:** Reduce closure scope — don't capture entire DOM trees in closures, use `WeakRef` for optional DOM references.

**P44 — GPU Optimization (Compositing)**
> Sidebar transition uses `transform: translateX()` (GPU-composited, good). But the kanban card `.dragging` state doesn't promote to GPU layer — dragging causes full-layer repaints.
> **Fix:** Add `will-change: transform` to `.kanban-card.dragging` and `.animate-slide-in`.

**P45 — Network Optimization (Fetch Dedup)**
> Multiple concurrent click handlers can trigger duplicate fetches. Opening the command palette fetches tasks; simultaneously clicking a kanban card fetches the same task. No fetch deduplication.
> **Fix:** Implement a simple `fetchOnce(key, url)` that deduplicates in-flight requests.

### Persona 46–50: Cross-Platform & Edge-Case Specialists

**P46 — iPad/Tablet (Split View)**
> iPadOS split view can render the HA app at 50% width. The responsive breakpoint at `768px` may trigger mobile layout on one side while desktop on the other if the user resizes during a session. No `ResizeObserver` adjusts interactive behavior.
> **Fix:** Use `ResizeObserver` on `.main-content` instead of `@media` for dynamic layout switching.

**P47 — Low-End Device (Jank)**
> The kanban board with 50+ cards triggers Intersection Observer spam when scrolling. Combined with the 60fps `dragover` handler and uncleaned intervals, low-end devices (Raspberry Pi 4 running HA) experience visible jank and missed clicks.
> **Fix:** Add `requestIdleCallback` for non-critical work, throttle `dragover` to 30fps.

**P48 — PWA (Installed App)**
> When installed as a PWA, the service worker intercepts navigation requests. ViewTransition navigations go through the SW's `nav` cache (24h TTL). A stale nav cache can serve old HTML with updated JS — the old HTML has different `id` attributes that the new JS can't find, causing click handlers to silently fail.
> **Fix:** Version the nav cache with `CACHE_VERSION` and bust on SW update.

**P49 — RTL/i18n (Layout Direction)**
> No `dir="ltr"` is set on `<html>`. If a user's browser has RTL default or if Irish Gaelic text contains mixed-direction content, layout can shift and click targets may not be where expected.
> **Fix:** Add `dir="ltr"` to `<html>` explicitly.

**P50 — Screen Reader (Announcements)**
> Click handlers that mutate DOM don't announce changes to screen readers. The `aria-live` region `#sync-announcer` (referenced in Layout.astro line 133) is only used for conflict detection. Modal opens, task saves, and drag-drop completions are silent.
> **Fix:** Use the existing `#sync-announcer` or add to the `showToast()` utility to also set `aria-live` announcements.

---

## Priority Matrix

### P0 — Critical (Directly Causes Click Failures)

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P0-1 | Add `touch-action: manipulation` to `html` in `_base.css` | 1 line | Eliminates 300ms tap delay globally |
| P0-2 | Implement `AbortController` lifecycle for Layout.astro event listeners | Medium | Stops listener accumulation (root cause #1) |
| P0-3 | Add idempotency guards to all `is:inline` scripts | Medium | Prevents duplicate handler registration |
| P0-4 | Clear `setInterval(checkHealth)` before re-registering | 3 lines | Stops 10× health check multiplication |
| P0-5 | Re-query DOM refs in `astro:page-load` instead of at module init | Medium | Fixes stale DOM reference after ViewTransition |

### P1 — High (Causes Unreliable Behavior)

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P1-1 | Switch kanban per-card listeners to event delegation | Medium | Reduces 300 listeners to 3 |
| P1-2 | Add double-submit prevention to all async click handlers | Small | Prevents duplicate task creation |
| P1-3 | Add keyboard activation (Enter/Space) to kanban cards | Small | Accessibility compliance |
| P1-4 | Mobile sidebar: add overlay click-to-close handler | Small | Users can dismiss sidebar |
| P1-5 | Add `visibilitychange` event for ingress state persistence | Small | Reliable state save in iframes |

### P2 — Medium (Degrades Experience)

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P2-1 | Debounce command palette search (150ms) | Small | Reduces CPU during typing |
| P2-2 | Cache card bounds during kanban drag (not per-frame query) | Small | Eliminates layout thrashing |
| P2-3 | Replace `window.location.reload()` with optimistic updates | Medium | No full-page reload on actions |
| P2-4 | Add `will-change: transform` to animated elements | 3 lines | GPU compositing for animations |
| P2-5 | Show action buttons always on touch devices | 2 lines | Touch users can see edit/AI/dup buttons |

### P3 — Low (Edge Cases & Polish)

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P3-1 | Add `overscroll-behavior: contain` to body | 1 line | Prevents iOS rubber-band |
| P3-2 | Add `touch-action: pan-y` to `.sidebar-scroll` | 1 line | Prevents accidental nav clicks while scrolling |
| P3-3 | Add `color-mix()` fallback for older WebViews | Small | Android WebView compat |
| P3-4 | Focus management: store/restore `activeElement` on modal open/close | Small | Keyboard accessibility |
| P3-5 | Add error toasts to swallowed `catch {}` blocks | Small | User feedback on failures |

### P4 — Architecture (Longer-term)

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P4-1 | Split `Layout.astro` into focused modules (task-detail, command-palette, search, shortcuts) | Large | Maintainability, tree-shaking |
| P4-2 | Create `waitForFn(name, callback)` utility for cross-component coordination | Small | Standardized async window function calls |
| P4-3 | Add touch-based drag for kanban on mobile | Large | Mobile kanban functionality |
| P4-4 | Consider Astro Islands for interactive components | Large | Automatic lifecycle management |

### P5 — Nice-to-have

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P5-1 | Change sidebar prefetch to `viewport` instead of `hover` | 1 line | Faster navigation (sidebar always visible) |
| P5-2 | Add `ResizeObserver` for dynamic layout adaptation | Medium | iPad split-view support |
| P5-3 | Implement fetch deduplication utility | Medium | Network optimization |
| P5-4 | Add `dir="ltr"` to `<html>` | 1 line | RTL browser compat |

### P6 — Monitoring

| ID | Fix | Effort | Impact |
|----|-----|--------|--------|
| P6-1 | Add Performance Observer for Long Tasks (>50ms) | Small | Detect jank in production |
| P6-2 | Log event listener count via `getEventListeners()` in dev mode | Small | Detect accumulation |
| P6-3 | Add `requestIdleCallback` logging for GC pressure | Small | Memory monitoring |

---

## Files Requiring Changes

| File | Changes | Priority |
|------|---------|----------|
| `apps/web/src/styles/_base.css` | `touch-action: manipulation`, `overscroll-behavior`, `dir` | P0 |
| `apps/web/src/layouts/Layout.astro` | AbortController lifecycle, idempotency guards, interval cleanup, DOM ref re-query | P0 |
| `apps/web/src/pages/kanban.astro` | Event delegation, double-submit prevention, touch drag | P0-P4 |
| `apps/web/src/styles/_responsive.css` | Touch action buttons visibility, `will-change` | P2 |
| `apps/web/src/styles/_kanban.css` | `will-change: transform` for dragging | P2 |
| `apps/web/src/components/layout/Sidebar.astro` | Mobile overlay click handler | P1 |
| `apps/web/src/components/layout/TopNavigation.astro` | Mobile sidebar dismiss | P1 |
| `apps/web/src/components/layout/SidebarNavList.astro` | Listener cleanup, prefetch strategy | P1-P5 |
| `apps/web/src/pages/settings.astro` | Init orchestrator with AbortController | P0 |
| `apps/web/src/lib/ingress-state-persistence.ts` | `visibilitychange` event | P1 |

---

*Audit: 2026-03-07 — 50-persona click & menu responsiveness review*
*Auditor: Antigravity*
*Cross-device & cross-browser compatibility included per user request*

# 50-Persona Code Quality & UX Happiness Audit

**Focus:** Code quality, memory optimization, UI/UX improvements, user happiness
**Codebase:** ~13,363 lines across top 8 page files, 380 addEventListener, 11 inline SQL
**Date:** 2026-03-08

---

## Audit Methodology

10 passes × 5 personas per pass = 50 expert perspectives across:
1. **Code Hygiene** — empty catches, console.log, dead code
2. **Memory Management** — event listener cleanup, cache bounds, timer lifecycle
3. **DDD Compliance** — inline SQL violations, domain boundary leaks
4. **Performance** — bundle size, render efficiency, SQL optimization
5. **UI Polish** — animation timing, hover states, feedback loops
6. **Mobile UX** — touch targets, gestures, responsive breakpoints
7. **Accessibility** — keyboard nav, screen reader, color contrast
8. **HA Integration** — ingress compatibility, supervisor lifecycle
9. **Onboarding UX** — first-use experience, empty states, discoverability
10. **Happiness Factors** — delight moments, frustration points, polish

---

## Pass 1: Code Hygiene

### P1 — Clean Code Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| 11 empty `catch {}` blocks silently swallow errors | P1 | kanban.astro, Layout.astro | Replace with `console.warn('[Meitheal]', err)` |
| 2 `console.log` in production code | P2 | Various | Replace with structured logger or remove |
| Dead CSS selectors for removed components | P3 | Various _*.css files | Audit and remove unused selectors |
| `as HTMLButtonElement` type assertion in `is:inline` script causes TS lint error | P2 | kanban.astro:977 (fixed by user) | Use plain variable instead |
| Multiple `@layer components` blocks per file | P3 | _feedback.css, _cards.css | Consolidate into single block |

### P2 — Technical Debt Tracker
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Layout.astro is 4,152 lines — single file monolith | P0 | Layout.astro | Extract task-detail, command-palette, new-task into separate components |
| settings.astro is 3,517 lines | P1 | settings.astro | Already has component split (SettingsGeneral, etc.) but client JS is inline |
| kanban.astro is 2,588 lines | P1 | kanban.astro | Extract drag/drop, filter, inline-add to separate modules |
| table.astro is 1,106 lines | P2 | table.astro | Extract sort/filter/bulk logic to module |
| `ingress-state-persistence.ts` listeners never cleaned up | P2 | ingress-state-persistence.ts:124-153 | Add signal from pageLifecycle |

### P3 — Import/Export Consistency
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| No shared API fetch utility — 63+ inline `fetch()` calls | P1 | All pages | Create `@lib/api.ts` with typed fetch wrapper |
| No shared TaskCard component — each view renders differently | P2 | kanban, index, today, upcoming | Create `TaskCard.astro` |
| No shared StatusSelect / PrioritySelect | P3 | Layout, kanban, table, settings | Create reusable form components |

### P4 — Configuration Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Hardcoded 30s health check interval | P4 | Layout.astro | Make configurable via settings |
| Hardcoded 300s service worker update interval | P4 | sw-register.ts | Make configurable |
| Magic numbers in animation durations | P4 | Various CSS | Use CSS custom properties |

### P5 — Documentation/KCS Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `page-lifecycle.ts` well-documented with JSDoc | ✅ | | Good pattern |
| `wait-for-fn.ts` well-documented | ✅ | | Good pattern |
| `ingress-state-persistence.ts` well-documented | ✅ | | Good pattern |
| Missing JSDoc on many page-level functions in kanban.astro | P3 | kanban.astro | Add function-level docs |

---

## Pass 2: Memory Management

### P6 — Event Listener Leak Hunter
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| 380 addEventListener vs 3 removeEventListener | P0 | Global | Most are in page scripts (MPA reload clears them), but Layout.astro persists |
| Layout.astro module scripts: pageLifecycle.onPageLoad with signal — **FIXED** | ✅ | Layout.astro | AbortController cleanup on navigation |
| `ingress-state-persistence.ts` adds scroll/astro:page-load/beforeunload/visibilitychange without cleanup | P2 | ingress-state-persistence.ts | Add AbortController signal |
| Page-level scripts in kanban/table/settings re-add listeners on each ViewTransition | P1 | kanban.astro, table.astro, settings.astro | Wrap in pageLifecycle or astro:page-load with idempotency guard |

### P7 — Timer/Interval Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `checkHealth` interval properly cleared before re-registering — **FIXED** | ✅ | Layout.astro | clearInterval guard added |
| `sw-register.ts` update check interval — no clearInterval on page unload | P3 | sw-register.ts | Add cleanup |
| Reconnect setTimeout in ha-connection — no cancel mechanism | P3 | ha-connection.ts | Track timeout ID, clear on reconnect |

### P8 — Cache Bounds Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| 2 unbounded `new Map()` caches found | P2 | Various | Add max-size eviction or TTL |
| `sentReminders` Set capped at 1000 — **FIXED** | ✅ | due-date-reminders.ts | FIFO eviction |
| Webhook settings cache has 60s TTL — **FIXED** | ✅ | webhook-dispatcher.ts | Proper TTL |

### P9 — DOM Reference Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| DOM references re-queried on each pageLifecycle.onPageLoad — **FIXED** | ✅ | Layout.astro | Prevents stale refs |
| `kanban.astro` querySelector calls at top of script block | P2 | kanban.astro | Move inside astro:page-load |
| `table.astro` querySelector calls at top of script block | P2 | table.astro | Move inside astro:page-load |

### P10 — GC Pressure Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Large string concatenation for HTML templates in kanban.astro | P3 | kanban.astro | Use DOM API (createElement) instead of innerHTML where possible |
| User already fixed comment rendering to use DOM API | ✅ | Layout.astro:2351-2380 | createElement instead of template literals |

---

## Pass 3: DDD Compliance

### P11 — Domain Boundary Enforcer
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| 11 inline SQL `client.execute()` calls in page files | P1 | kanban, table, today, upcoming, calendar, settings .astro | Move to domain service layer |
| Direct `getPersistenceClient()` import in 6 page files | P1 | 6 pages | Use domain API endpoints or SSR data loading pattern |
| Ubiquitous language: "pending" vs "todo" status inconsistency | P3 | Various | Normalize to single term |

### P12 — API Surface Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `/api/tasks` CRUD endpoints well-structured | ✅ | pages/api/tasks/ | Good REST pattern |
| Missing `/api/tasks/[id]/comments` — comments loaded inline | P3 | Layout.astro | Extract to dedicated API endpoint |
| Lane management API at `/api/lanes` | ✅ | pages/api/lanes.ts | Well-structured |

### P13 — State Management Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| No client-side state store — all state in DOM | P3 | All pages | Consider lightweight store for cross-component sync |
| Board selection in localStorage — works but fragile | P3 | Layout.astro | Already using sessionStorage for navigation state |
| Settings loaded via inline SQL at page render — efficient for SSR | ✅ | settings.astro | Correct pattern for Astro MPA |

### P14 — Error Handling Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Double-submit prevention added to kanban — **FIXED** | ✅ | kanban.astro | btn-loading class + disabled |
| Missing error boundaries for API failures | P2 | All pages | Add user-facing error UI for fetch failures |
| `showToast` already provides error feedback | ✅ | toast.ts | Good pattern |

### P15 — Security Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| innerHTML usage for rendering task data | P1 | kanban.astro, Layout.astro | XSS risk — use textContent/DOM API |
| User already fixed comments to use textContent | ✅ | Layout.astro:2351 | createElement pattern |
| CSRF protection via SUPERVISOR_TOKEN | ✅ | middleware.ts | Proper validation |

---

## Pass 4: Performance

### P16 — Bundle Size Analyst
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| No code splitting for page scripts — all JS inline | P2 | All pages | Extract to importable modules for tree-shaking |
| `pageLifecycle` and `waitForFn` properly extracted | ✅ | lib/ | Good modular pattern |
| CSS well-split into domain partials | ✅ | styles/ | Proper organization |

### P17 — SQL Performance Analyst
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| kanban loads ALL tasks then filters in JS | P2 | kanban.astro:60 | Add WHERE clause to SQL |
| `ORDER BY kanban_position ASC NULLS LAST, priority ASC` — good compound ordering | ✅ | kanban.astro | Efficient |
| Comment count aggregation uses GROUP BY — efficient | ✅ | kanban.astro:77 | Good pattern |

### P18 — Render Performance Analyst
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `will-change: transform` on dragging cards — **FIXED** | ✅ | _kanban.css | GPU compositing |
| Stagger animations up to 6th child then constant — good cap | ✅ | _feedback.css | Prevents over-animation |
| Modal backdrop-filter: blur(4px) — may cause jank on low-end devices | P3 | _modal.css | Add `@media (prefers-reduced-motion)` fallback |

### P19 — Network Performance Analyst
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Sidebar prefetch changed to viewport — **FIXED** | ✅ | SidebarNavList.astro | Faster navigation |
| No request deduplication for concurrent API calls | P3 | Various | Create fetch dedup utility |
| Health check every 30s — appropriate for HA addon | ✅ | Layout.astro | Not excessive |

### P20 — CSS Performance Analyst
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `@layer components` used correctly for cascade management | ✅ | All CSS partials | Good pattern |
| `backdrop-filter` used on modal overlay AND sticky thead — double GPU layers | P3 | _modal.css, _table.css | Consider if both needed simultaneously |
| `field-sizing: content` for auto-resize — modern but not widely supported | P4 | _forms.css | Add fallback `resize: vertical` (already present) |

---

## Pass 5: UI Polish

### P21 — Visual Consistency Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Card hover lift (translateY -2px) + focus-within glow — **ADDED** | ✅ | _cards.css | Premium feel |
| Button ripple effect on primary buttons — **ADDED** | ✅ | _buttons.css | Touch feedback |
| Modal slide-in/out animations — **ADDED** | ✅ | _modal.css | Professional transitions |
| color-mix() fallback for older WebViews — **ADDED** | ✅ | Layout.astro | Compat |

### P22 — Focus Management Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Task detail panel stores/restores focus — **FIXED** | ✅ | Layout.astro | Proper A11y |
| Command palette: no focus trap — Tab can exit | P2 | Layout.astro | Add focus trap |
| New task modal: no auto-focus on first input | P2 | NewTaskModal.astro | Add `autofocus` attribute |
| Keyboard shortcuts modal: no focus trap | P3 | Layout.astro | Add focus trap |

### P23 — Color/Theme Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Dark/light theme toggle via `data-theme` attribute | ✅ | Layout.astro | Good pattern |
| Accent color customization via localStorage | ✅ | Layout.astro | User personalization |
| High-contrast mode not tested | P4 | All pages | Add `@media (prefers-contrast: more)` styles |

### P24 — Typography Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| System font stack with Inter fallback | ✅ | _base.css | Good for HA iframe context |
| Consistent text sizing via Tailwind utilities | ✅ | All components | Proper hierarchy |
| Some inline `font-size` overrides in page styles | P4 | Various | Consolidate to design tokens |

### P25 — Spacing/Layout Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Consistent gap/padding via Tailwind utilities | ✅ | All components | Good pattern |
| Kanban column equal-width via CSS grid | ✅ | kanban.astro | Responsive |
| Some hardcoded pixel values in inline styles | P4 | Various pages | Use CSS custom properties |

---

## Pass 6: Mobile UX

### P26 — Touch Target Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Minimum touch targets 44×44px enforced on form inputs | ✅ | _forms.css | min-height/min-width: 44px |
| Kanban action buttons always visible on touch devices — **FIXED** | ✅ | _responsive.css | Coarse pointer media query |
| Delete row button 32×32px — below 44px minimum | P3 | _table.css | Increase to 44px |

### P27 — Gesture Engineer
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `touch-action: manipulation` on html — **FIXED** | ✅ | _base.css | No 300ms tap delay |
| `touch-action: pan-y` on sidebar — **FIXED** | ✅ | _responsive.css | Proper scroll |
| No swipe gestures for sidebar open/close | P3 | Layout.astro | Add touchstart/touchend tracking |
| No pull-to-refresh on mobile | P4 | Layout.astro | Consider native-feel refresh |

### P28 — Responsive Layout Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Sidebar slides from left on mobile with dark overlay | ✅ | _responsive.css | Good mobile pattern |
| Kanban stacks to column layout on mobile | ✅ | _responsive.css | Readable on small screens |
| Calendar view may be cramped on narrow screens | P3 | calendar.astro | Test at 320px width |

### P29 — Text Selection/Input Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Textarea auto-resize via `field-sizing: content` — **ADDED** | ✅ | _forms.css | Modern browsers |
| Placeholder fades on focus — **ADDED** | ✅ | _forms.css | Clean typing UX |
| No auto-capitalization attributes on mobile inputs | P4 | Various | Add `autocapitalize="sentences"` |

### P30 — Scroll Behavior Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `overscroll-behavior: contain` — **FIXED** | ✅ | _base.css | No rubber-band interference |
| Sticky table header — **ADDED** | ✅ | _table.css | Readable while scrolling |
| `scrollbar-width: thin` for slim scrollbars | ✅ | _base.css | Unobtrusive |

---

## Pass 7: Accessibility

### P31 — Keyboard Navigation Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Enter/Space activation on kanban cards — **FIXED** | ✅ | Layout.astro | Keyboard accessible |
| Keyboard shortcuts (?, N, K, etc.) documented in modal | ✅ | Layout.astro | Discoverable |
| Missing `tabindex="0"` on interactive custom elements | P3 | Various | Add to non-button clickable elements |

### P32 — Screen Reader Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `role="region"` on kanban columns with `aria-label` | ✅ | kanban.astro | Proper landmarks |
| Toast notifications use `role="alert"` with `aria-live` | ✅ | toast.ts | Screen reader announced |
| `dir="ltr"` on html — **FIXED** | ✅ | Layout.astro | RTL browser compat |
| Missing `aria-label` on some icon-only buttons | P3 | Various | Add descriptive labels |

### P33 — Focus Visible Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| `:focus-visible` styles with accent ring | ✅ | _base.css | Clear focus indicators |
| Skip-to-content link missing | P3 | Layout.astro | Add for keyboard users |
| Focus visible on sidebar nav links | ✅ | _layout.css | Proper styling |

### P34 — Color Contrast Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Dark theme generally good contrast | ✅ | tokens.css | WCAG AA likely met |
| Light theme needs contrast verification | P3 | tokens.css | Run WCAG checker |
| Text-muted color may not meet AA on dark backgrounds | P3 | tokens.css | Verify 4.5:1 ratio |

### P35 — Reduced Motion Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| No `@media (prefers-reduced-motion: reduce)` anywhere | P2 | All CSS | Add reduced motion overrides |
| Card stagger, modal scale, page fade-in all animated | P2 | _feedback.css, _modal.css | Disable for motion-sensitive users |

---

## Pass 8: HA Integration

### P36 — Ingress Compatibility Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Global fetch interceptor prefixes ingress path | ✅ | Layout.astro | All API calls ingress-aware |
| `window.__ingress_path` properly typed | ✅ | types/window.d.ts | TypeScript support |
| State persistence via visibilitychange — **FIXED** | ✅ | ingress-state-persistence.ts | Reliable in HA iframe |

### P37 — Supervisor Lifecycle Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Health check endpoint at `/api/health` | ✅ | Various | Supervisor monitoring |
| Graceful degradation when HA unavailable | ✅ | Multiple catch blocks | Shows offline state |
| Connection status indicator in sidebar | ✅ | Layout.astro | Visual feedback |

### P38 — WebSocket Integration Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| HA WebSocket with subscribeEvents wrapped in try/catch | ✅ | ha-connection.ts | Crash-safe |
| Reconnect logic with timeout guard | ✅ | ha-connection.ts | Reliable reconnection |
| No WebSocket keep-alive/ping mechanism | P3 | ha-connection.ts | Add periodic ping |

### P39 — Theme/Style HA Alignment
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| CSS custom properties match HA design language | ✅ | tokens.css | Consistent feel |
| Uses HA-compatible font stack | ✅ | _base.css | System fonts |
| Card/panel styling matches HA dashboard aesthetic | ✅ | _cards.css | Consistent visual language |

### P40 — Addon Config/Options Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| config.yaml properly defines options | ✅ | meitheal-hub/config.yaml | Supervisor reads correctly |
| Backup support (hot backup mode) | ✅ | config.yaml | Zero-downtime backups |

---

## Pass 9: Onboarding UX

### P41 — First-Use Experience Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Empty states exist with EmptyState component | ✅ | ui/EmptyState.astro | CTA-driven empty states |
| No first-use onboarding flow or wizard | P3 | N/A | Add first-visit hints or welcome modal |
| Quick-add inline form is discoverable | ✅ | kanban.astro | "+" button per column |

### P42 — Discoverability Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Keyboard shortcut hint on first visit | ✅ | Layout.astro | Shows "?" hint |
| Command palette discoverable via Ctrl+K | ✅ | Layout.astro | Standard pattern |
| Settings tabs clearly labeled | ✅ | settings.astro | Obvious navigation |
| Board switcher in sidebar | ✅ | SidebarBoardSwitcher.astro | Multi-board workflow |

### P43 — Help/Tooltip Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| HelpTooltip component exists | ✅ | ui/HelpTooltip.astro | Reusable |
| RICE badge tooltips with score breakdown | ✅ | ui/RiceBadge.astro | Informative |
| No contextual help for lane management | P4 | kanban.astro | Add tooltip "Drag to reorder" |

### P44 — Error Recovery Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Error boundary component exists | ✅ | _feedback.css | Styled error state |
| 500.astro custom error page | ✅ | pages/500.astro | Branded error |
| 404.astro custom not found page | ✅ | pages/404.astro | Branded 404 |
| No "Retry" on failed API calls in the UI | P2 | Various fetch calls | Add retry button on error toast |

### P45 — Loading State Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Skeleton loading exists (.skeleton-pulse, .skeleton-row) | ✅ | _feedback.css | Shimmer animation |
| skeleton-column and skeleton-cell added — **NEW** | ✅ | _feedback.css | Kanban loading state |
| Btn-loading class with spinner | ✅ | _buttons.css | Async operation feedback |
| No loading state when navigating between pages | P3 | Layout.astro | Add page-level loading bar |

---

## Pass 10: Happiness Factors

### P46 — Delight Moments Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Button ripple effect — **ADDED** | ✅ | _buttons.css | Tactile feedback |
| Card hover lift — **ADDED** | ✅ | _cards.css | Spatial depth |
| Status celebration animation — **ADDED** | ✅ | _feedback.css | Completion reward |
| Calendar today pulse — **ADDED** | ✅ | _feedback.css | Day awareness |
| No confetti or firework animation when all tasks complete | P5 | N/A | Could add "all done" celebration |

### P47 — Frustration Point Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Double-submit prevention — **FIXED** | ✅ | kanban.astro | No duplicate tasks |
| Focus preserved on panel close — **FIXED** | ✅ | Layout.astro | No focus lost |
| Sidebar prefetch viewport — **FIXED** | ✅ | SidebarNavList.astro | Faster navigation |
| Task detail panel can't be resized | P4 | Layout.astro | Add drag-to-resize handle |
| No undo on task deletion | P2 | Various | Add undo toast with timeout |

### P48 — Visual Hierarchy Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Priority colors clearly differentiated | ✅ | priority-config.ts | Distinct hues |
| Status badges with semantic colors | ✅ | _cards.css | blue/amber/green mapping |
| Dashboard bento grid layout | ✅ | index.astro | Clear information hierarchy |
| Kanban WIP limit warning with red border | ✅ | _kanban.css | Visual constraint feedback |

### P49 — Performance Perception Auditor
| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| Page fade-in animation — **ADDED** | ✅ | _feedback.css | Smooth transitions |
| Stagger animations on lists — exists | ✅ | _feedback.css | Progressive reveal |
| No optimistic updates — all actions wait for server | P2 | kanban drag/drop, status changes | Show change instantly, rollback on error |

### P50 — Overall Happiness Score
| Category | Score | Notes |
|----------|-------|-------|
| Code Quality | 7/10 | Good structure, monolith pages need splitting |
| Memory Safety | 8/10 | Key fixes applied, some cleanup remaining |
| UI Polish | 8/10 | Premium feel with recent CSS improvements |
| Mobile UX | 7/10 | Working responsive, missing gestures |
| Accessibility | 6/10 | Basic support, needs reduced motion + focus traps |
| HA Integration | 9/10 | Excellent ingress/supervisor support |
| Onboarding | 7/10 | Good empty states, missing guided onboarding |
| Happiness | 8/10 | Good delight moments, missing undo + optimistic UI |

**Overall: 7.5/10** — Strong foundation with clear improvement areas.

---

## Priority Summary

### P0 — Critical (Address First)
- [ ] `@media (prefers-reduced-motion: reduce)` for all animations

### P1 — High
- [ ] Layout.astro: extract task-detail, command-palette to separate components
- [ ] Create shared API fetch utility (`@lib/api.ts`)
- [ ] Move inline SQL from pages to domain service layer
- [ ] innerHTML XSS audit — replace with textContent/DOM API

### P2 — Medium
- [ ] Add focus traps to command palette and modals
- [ ] Add "Undo" toast for destructive actions (delete task)
- [ ] Add optimistic updates for kanban drag/drop
- [ ] Add retry button on failed API calls
- [ ] Add `@media (prefers-reduced-motion: reduce)` overrides
- [ ] Extract kanban client JS to `kanban-client.ts`
- [ ] Missing error boundaries for API failures

### P3 — Low
- [ ] Add skip-to-content link for keyboard users
- [ ] Add WebSocket keep-alive/ping
- [ ] Add swipe gestures for sidebar
- [ ] Delete row button increase to 44px touch target
- [ ] Missing `tabindex="0"` on custom interactive elements
- [ ] Missing `aria-label` on icon-only buttons
- [ ] Add first-use onboarding hints

### P4-P5 — Enhancement
- [ ] High-contrast mode styles
- [ ] Confetti on "all complete"
- [ ] Task detail panel resize handle
- [ ] Auto-capitalization on mobile inputs

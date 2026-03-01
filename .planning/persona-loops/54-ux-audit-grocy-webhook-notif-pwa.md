# Persona Audit Iterations 17-36 — Grocy, Webhook, Notification, PWA

**Date:** 2026-03-01
**Scope:** Grocy integration, webhook wiring, notification system, PWA enhancements

## Findings

### Grocy (1-5)
| # | Finding | Fix |
|---|---------|-----|
| 1 | `save-grocy` button not wired | Persists URL, API key, sync mode via settings API |
| 2 | `save-cal` button not wired | Persists calendar entity + CalDAV URL |
| 3 | `test-cal` button not wired | Tests HA connection, checks calendar component |
| 4 | Integration settings not restored on load | IIFE restores Grocy/Cal/n8n/webhook from API |
| 5 | Badge statuses hardcoded | Dynamic based on saved config state |

### Webhook (6-10)
| # | Finding | Fix |
|---|---------|-----|
| 6 | Webhook status badge always "Active" | Dynamic: "Active"/"Not configured" |
| 7 | n8n status badge always "Not configured" | Updates to "Configured" when URL saved |
| 8 | Settings not persisted across reloads | `restoreIntegrationSettings()` IIFE |
| 9 | No test payload for webhook | Wired in previous commit |
| 10 | Webhook format not persisted | Saved as `webhook_format` setting |

### Notification (11-15)
| # | Finding | Fix |
|---|---------|-----|
| 11 | Icon path mismatch (`/icons/icon-192x192.png`) | Changed to `/icon-192.png` (matches manifest) |
| 12 | No upcoming due reminder | New `checkUpcomingReminders()` — 1 hour window |
| 13 | No push notification handler in SW | Added push + notificationclick handlers |
| 14 | Notification click doesn't focus tab | SW focuses existing tab or opens new window |
| 15 | No notification permission request flow | Notification service already has graceful flow |

### PWA (16-20)
| # | Finding | Fix |
|---|---------|-----|
| 16 | No offline fallback page | Created `offline.astro` with retry button |
| 17 | Manifest missing id/scope/orientation | Added all + app shortcuts (Today/Tasks/Calendar) |
| 18 | SW had TS annotations in public/ JS | Rewritten as pure JS |
| 19 | SW precache missing key pages | Added /today, /tasks, /kanban, /calendar |
| 20 | No SW registration in Layout | Added with auto-update (SKIP_WAITING) |

## Verification

| Check | Result |
|-------|--------|
| `astro build` | ✅ 0 errors |
| Offline page renders | ✅ `/offline` route exists |
| SW registration | ✅ In Layout.astro |
| Push handler | ✅ In sw.js |
| Manifest shortcuts | ✅ Today/Tasks/Calendar |

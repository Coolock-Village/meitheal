# Persona Audit Iterations 7-16 — Webhooks, Export, HA Integration

**Date:** 2026-03-01
**Scope:** Webhook config wiring, export completeness, HA integration, offline data portability

## Summary

10-persona audit across the integration layer: webhooks, export APIs, Home Assistant connection, n8n automation, and offline data portability.

## Findings

| # | Persona | Finding | Severity | Fix |
|---|---------|---------|----------|-----|
| 1 | Power User | Shortcut modal missing y/u/c entries | P2 | Added to settings shortcut grid |
| 2 | Data Analyst | CSV export missing Phase 31 columns | P1 | Added recurrence_rule, checklists, reminder_at |
| 3 | Data Analyst | JSON export missing Phase 31 columns | P1 | Added same 3 columns to JSON query |
| 4 | Data Analyst | CSV not Excel-friendly | P3 | Prepended UTF-8 BOM |
| 5 | Integration Engineer | Webhook save button not wired | P1 | Persists endpoint/secret/format to settings API |
| 6 | Integration Engineer | Webhook test button not wired | P1 | Sends test POST with event payload |
| 7 | Automation Builder | n8n save button not wired | P1 | Persists webhook URL + event checkboxes |
| 8 | Offline User | No CSV export for offline/local data | P2 | New `exportLocalDataAsCsv()` function |
| 9 | TypeScript | OfflineTask → Record cast lint error | P3 | Cast through `unknown` first |
| 10 | HA User | HA test connection wiring | P0 | Already functional — verified |

## Verification

| Check | Result |
|-------|--------|
| `astro build` | ✅ 0 errors |
| Webhook save handler | ✅ Wired to settings API |
| Webhook test handler | ✅ Sends POST with test payload |
| n8n save handler | ✅ Persists URL + events |
| CSV BOM | ✅ `\uFEFF` prepended |
| Export Phase 31 cols | ✅ recurrence_rule, checklists, reminder_at |

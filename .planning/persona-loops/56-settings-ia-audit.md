# Phase 56: Settings IA Overhaul — Persona Audit

**Date:** 2026-03-03
**Scope:** Settings page information architecture, card ordering, tab assignments, UX readability

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | UX Designer | IA | HA Connection card in General tab — not a "general" setting, it's an integration | ⚠️ Med | Move to Integrations tab |
| 2 | UX Designer | IA | PWA Status card too prominent — full card for a diagnostic, not a setting users configure | ⚠️ Med | Demote to compact line in System > About |
| 3 | Information Architect | IA | Sidebar Config placed after HA and PWA — but is the most-used General setting | ⚠️ Med | Move to first position in General |
| 4 | UX Writer | Copy | Test Connection output dumps raw component list (50+ items) with poor contrast | ⚠️ High | Cap display, lighter text, expandable list |
| 5 | Product Manager | IA | No in-app help/support page — user must leave app to read README | ℹ️ Med | Add Help & Support section in System tab |
| 6 | HA Addon Expert | Integration | HA Connection card uses General card style, not integration accordion style | ℹ️ Low | Adapt to match integration card pattern |
| 7 | Mobile Engineer | Responsive | Test Connection component list overflows on narrow viewports | ℹ️ Low | Truncate with "show more" |
| 8 | Accessibility Eng | A11y | PWA status dot relies on color alone (green vs amber) | ℹ️ Low | Already has text label + badge |
| 9 | KCS Author | Docs | Version shown as 0.1.33 in About card — stale, doesn't reflect deployed version | ℹ️ Info | Version sourced from config.yaml at build time |
| 10 | DDD Architect | Domains | HA connection logic (CSS + JS) lives in SettingsGeneral, not SettingsIntegrations | ⚠️ Med | Move CSS/JS to correct bounded context |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| ⚠️ High | 1 | Fix Test Connection readability |
| ⚠️ Med | 4 | IA restructure (HA → Integrations, PWA → System, Sidebar first, move JS) |
| ℹ️ Med | 1 | Add Help & Support page |
| ℹ️ Low | 3 | Style alignment, responsive, a11y |
| ℹ️ Info | 1 | No action (version is build-time) |

## Immediate Actions (This Phase)

1. **General tab**: Sidebar Config first, Custom Fields, Strategic Lenses only ✅ done
2. **Integrations tab**: Add HA Connection as first integration card (accordion style)
3. **Integrations tab**: Fix Test Connection — lighter text, capped component list, expandable
4. **System tab**: Demote PWA to compact line in About card
5. **System tab**: Add Help & Support section (rendered README content)
6. **Move JS/CSS**: HA detection + PWA detection → correct component files

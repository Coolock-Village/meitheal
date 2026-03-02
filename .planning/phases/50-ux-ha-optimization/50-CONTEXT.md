---
phase: 50
name: HA UX Optimization
goal: Optimize the Meitheal UI for seamless operation within the Home Assistant panel, including compact mode, theme sync, responsive sizing, and HA-aware connectivity
status: in_progress
---

# Phase 50 Context — HA UX Optimization

## Goal

Make Meitheal feel like a native HA panel — no duplicate nav, proper theme inheritance, works at 1024px+ panel widths, and connectivity checks that understand the HA Supervisor topology.

## Background

When running as an HA panel addon, Meitheal is embedded in an iframe within the HA frontend. The HA frontend already has its own sidebar navigation, theme system, and header. Meitheal needs to:
1. Hide its own sidebar/nav when inside the HA iframe (compact/ingress mode)
2. Inherit dark/light theme from HA
3. Work at HA panel widths (typically 1024px+)
4. Check connectivity via the Supervisor instead of direct internet checks

## Decisions

- **Compact ingress mode**: When `window.__ingress_path` is set, hide Meitheal's sidebar and rely on HA's navigation
- **Theme sync**: Read HA's theme preference from the iframe context or use `prefers-color-scheme` media query
- **Panel responsive**: Target 1024px+ viewport for panel mode, maintain mobile responsiveness for standalone
- **HA-aware connectivity**: When behind ingress, check `/api/health` relative to ingress path, not absolute

## Persona Audit Alignment

| Persona | Issue | Status |
|---------|-------|--------|
| #22 UX Designer | No visual indicator for stale data age | Address here |
| #18 Lighthouse Auditor | No apple-touch-icon | Add meta tag |
| #26 Color Vision Eng | Sync status relies on color alone | ✅ Already uses distinct icons |

## Settings Export Integration

The following must be included in settings import/export:
- `ha_compact_mode`: boolean — override for compact mode
- `ha_theme_sync`: boolean — follow HA theme
- Fields ordering preserved in export JSON

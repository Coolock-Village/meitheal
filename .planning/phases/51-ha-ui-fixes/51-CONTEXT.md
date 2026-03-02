---
phase: 51
name: HA UX Stability & Manifest Fixes
goal: Prevent 503 backend hangs from bricking the UI, resolve 401 on manifest.webmanifest, and ensure "loading" buttons recover gracefully.
status: in_progress
---

# Phase 51 Context — HA UI Resiliency

## Goal
The UI was reported as "loafing" (stuck in a loading state) and buttons like "New Task" were non-functional. Concurrently, `manifest.json` or `manifest.webmanifest` threw a 401 Unauthorized under HA Ingress. The goal is to harden the UI to recover from backend disconnects and fix the static asset authorization issues.

## Background
- **Manifest 401 Error:** When rendering through HA Ingress, standard web manifest files are fetched by the browser *without* credentials (cookies). Because HA Supervisor requires the ingress session cookie, the request fails with 401. Fixing this requires `crossorigin="use-credentials"` on the manifest `<link>` tag.
- **UI Loafing (Stuck State):** When the backend node server hangs or restarts (503 Service Unavailable), any in-progress API calls (like adding a task) might hang indefinitely or fail without resetting the button's loading state. If the UI's health check marks it as "Disconnected", optimistic updates or UI buttons should either disable gracefully with a tooltip or the fetch interceptor should cancel/timeout properly.

## Decisions
- Add `crossorigin="use-credentials"` to the manifest link.
- Review button loading states (form submissions and the "+ New Task" modal) to ensure they always reset in `finally {}` blocks.
- Add an explicit fetch timeout or generic error catching to `api()` wrappers so the UI doesn't hang.

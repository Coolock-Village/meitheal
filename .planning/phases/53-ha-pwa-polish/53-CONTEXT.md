# Phase 53: Hardening HA Connection & PWA Optimization

## Context

Following the GSD autonomous directive to cycle through continuous optimizations and the momentum built in Phases 50, 51, and 52 regarding Home Assistant integration.

Meitheal is now a highly functional piece of the HA ecosystem, complete with real-time SSE syncing, calendar bridging, actionable push notifications, and a voice assist UI. However, we have a few lingering loose ends to tie up before considering the HA integration "rock solid":

1. **HA Connection Lifecycle Management:**
   - The server-side WebSocket to HA Core (`ha-connection.ts`) auto-reconnects smoothly, but the client-side SSE connection (`/api/sse`) doesn't always handle long periods of device sleep gracefully. We need to ensure the client reconnections don't flood the server or lose sequence state.
2. **"Ask HA" UX Polish:**
   - The `AskAssistModal.astro` interface is functional but raw. The UI needs to correctly trap focus, handle Escape to close, and clear input state reliably across opening/closing. It also needs to handle HA connection errors more explicitly.
3. **PWA Offline Manifest:**
   - In Phase 51, we added `crossorigin="use-credentials"` to the manifest link to fix 401 errors under Ingress. We must verify this didn't break standard PWA installation outside of HA.
4. **Tailwind CSS Warnings:**
   - The build output shows numerous `CssSyntaxError: Tailwind CSS: ...` warnings related to arbitrary values in `global.css`. While not fatal, cleaning up the CSS parser errors improves build reliability and DX.

## Goals

1. Optimize client-side SSE reconnection logic in `connectivity.ts`.
2. Refine the UX and accessibility of `AskAssistModal.astro`.
3. Resolve Tailwind CSS build warnings in `global.css`.

## Strategy

1. **Plan 53-01:** Address the HA connection stability (SSE client-side) and Ask HA Modal UX.
2. **Plan 53-02:** Address the Tailwind CSS build warnings.

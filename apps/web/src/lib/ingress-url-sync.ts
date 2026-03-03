/**
 * Ingress URL Synchronization — keeps the HA parent window URL bar
 * in sync with sub-route navigation inside the addon iframe.
 *
 * When Meitheal runs behind HA Supervisor ingress, the addon UI loads
 * inside an iframe at `/<addon_slug>` (e.g. `/868b2fee_meitheal`).
 * Navigating within the sidebar (e.g. to `/table`) only updates the
 * iframe's location — the browser URL bar stays stuck at the panel root.
 *
 * This module calls `window.parent.history.replaceState()` on each
 * Astro page navigation to reflect the current sub-route in the
 * browser URL bar (e.g. `/868b2fee_meitheal/table`).
 *
 * Same-origin: both the HA frontend and the ingress iframe are served
 * from the same host (e.g. `ha.home.arpa:8123`), so parent access
 * is permitted without CORS issues.
 *
 * Bounded context: auth (ingress)
 */

declare global {
  interface Window {
    __ingress_path?: string;
  }
}

/**
 * Derive the HA panel slug from the ingress path.
 *
 * The Supervisor sets X-Ingress-Path to `/api/hassio_ingress/<token>`
 * but the panel URL uses the addon slug (e.g. `868b2fee_meitheal`).
 *
 * We can't derive the slug from the ingress path alone, so we read
 * the parent window's initial pathname (which IS the panel slug path).
 */
let panelBasePath: string | null = null;

function getPanelBasePath(): string | null {
  if (panelBasePath !== null) return panelBasePath;

  try {
    // Same-origin check: if parent is accessible, read its pathname
    if (window.parent && window.parent !== window && window.parent.location) {
      const parentPath = window.parent.location.pathname;
      // The panel path is the first segment: /868b2fee_meitheal or /868b2fee_meitheal/table
      // Extract just the base: /868b2fee_meitheal
      const match = parentPath.match(/^\/([^/]+)/);
      if (match) {
        panelBasePath = `/${match[1]}`;
        return panelBasePath;
      }
    }
  } catch {
    // Cross-origin: parent access denied — not running in HA ingress iframe
  }

  panelBasePath = "";
  return "";
}

/**
 * Sync the current iframe pathname to the HA parent window URL bar.
 * Called on each Astro page-load event (ViewTransitions navigation).
 */
export function syncIngressUrl(): void {
  // Only run when inside an HA ingress iframe
  if (!window.__ingress_path) return;
  if (window.parent === window) return;

  const basePath = getPanelBasePath();
  if (!basePath) return;

  const currentPath = window.location.pathname;

  // Build the parent URL: panel base + current sub-route
  // e.g. /868b2fee_meitheal + /table → /868b2fee_meitheal/table
  // Root (/) maps to just /868b2fee_meitheal
  const subRoute = currentPath === "/" ? "" : currentPath;
  const newParentPath = basePath + subRoute;

  try {
    // Only update if different to avoid unnecessary history entries
    if (window.parent.location.pathname !== newParentPath) {
      window.parent.history.replaceState(null, "", newParentPath);
    }
  } catch {
    // Cross-origin or SecurityError — silently ignore
  }
}

/**
 * Initialize ingress URL sync. Hooks into Astro ViewTransitions
 * page-load events to sync on every client-side navigation.
 *
 * Also syncs on initial load for deep-link support.
 */
export function initIngressUrlSync(): void {
  // Only run when inside an ingress iframe
  if (typeof window === "undefined") return;
  if (!window.__ingress_path) return;
  if (window.parent === window) return;

  // Initial sync
  syncIngressUrl();

  // Sync on Astro ViewTransitions navigation
  document.addEventListener("astro:page-load", () => {
    syncIngressUrl();
  });
}

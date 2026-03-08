/**
 * Sidebar Edge Swipe — MT-02
 *
 * Enables swipe-from-edge gesture to open/close the sidebar on touch devices.
 * - Swipe right from left edge (within 32px) → open sidebar
 * - Swipe left on open sidebar → close sidebar
 *
 * Only activates on coarse pointer devices (phones, tablets).
 * Passive touch listeners for zero scroll-blocking impact.
 *
 * @domain ui
 * @bounded-context layout
 */

/** Minimum horizontal swipe distance to trigger (px) */
const SWIPE_THRESHOLD = 60;
/** Maximum edge zone width to detect swipe-to-open (px) */
const EDGE_ZONE = 32;

interface SwipeState {
  startX: number;
  startY: number;
  isEdgeSwipe: boolean;
}

/**
 * Initialize sidebar edge-swipe gesture.
 * Call once on page load. Safe for SSR (no-ops if window unavailable).
 */
export function initSidebarSwipe(): void {
  if (typeof window === "undefined") return;

  // Only enable on touch/coarse pointer devices
  if (!matchMedia("(pointer: coarse)").matches) return;

  let state: SwipeState | null = null;

  document.addEventListener(
    "touchstart",
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;

      state = {
        startX: touch.clientX,
        startY: touch.clientY,
        isEdgeSwipe: touch.clientX <= EDGE_ZONE,
      };
    },
    { passive: true },
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (!state) return;

      const touch = e.changedTouches[0];
      if (!touch) {
        state = null;
        return;
      }

      const deltaX = touch.clientX - state.startX;
      const deltaY = Math.abs(touch.clientY - state.startY);

      // Ignore vertical swipes (scrolling)
      if (deltaY > Math.abs(deltaX)) {
        state = null;
        return;
      }

      const sidebar = document.getElementById("sidebar");
      const body = document.body;

      if (Math.abs(deltaX) >= SWIPE_THRESHOLD) {
        if (deltaX > 0 && state.isEdgeSwipe) {
          // Swipe right from edge → open sidebar
          body.classList.remove("sidebar-collapsed");
          sidebar?.classList.remove("sidebar-collapsed");
          localStorage.setItem("meitheal_sidebar_collapsed", "false");
        } else if (deltaX < 0 && sidebar && !body.classList.contains("sidebar-collapsed")) {
          // Swipe left on open sidebar → close it
          body.classList.add("sidebar-collapsed");
          sidebar.classList.add("sidebar-collapsed");
          localStorage.setItem("meitheal_sidebar_collapsed", "true");
        }
      }

      state = null;
    },
    { passive: true },
  );
}

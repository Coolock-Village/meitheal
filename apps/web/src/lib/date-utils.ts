/**
 * Shared Date Formatting Utilities
 *
 * Consistent date formatting across the application.
 * All functions are timezone-aware and locale-safe.
 *
 * Bounded context: lib (shared utility)
 *
 * @domain formatting
 */

/**
 * Format a date as a relative time string (e.g., "2 hours ago", "in 3 days").
 * Falls back to absolute date for dates > 30 days.
 */
export function formatRelativeTime(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = Date.now();
  const diffMs = now - d.getTime();
  const absDiff = Math.abs(diffMs);
  const isPast = diffMs > 0;

  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return isPast ? "just now" : "in a moment";
  if (minutes < 60) return isPast ? `${minutes}m ago` : `in ${minutes}m`;
  if (hours < 24) return isPast ? `${hours}h ago` : `in ${hours}h`;
  if (days < 7) return isPast ? `${days}d ago` : `in ${days}d`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return isPast ? `${weeks}w ago` : `in ${weeks}w`;
  }

  // Fallback to absolute date for older dates
  return formatShortDate(d);
}

/**
 * Format a date as a short readable string (e.g., "Mar 7", "Dec 25, 2024").
 * Omits year if same as current year.
 */
export function formatShortDate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();

  return d.toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Format a date as ISO date string (YYYY-MM-DD).
 */
export function formatISODate(date: Date | string | number): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

/**
 * Check if a date is overdue (before today, not today).
 */
export function isOverdue(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

/**
 * Check if a date is today.
 */
export function isToday(date: Date | string | number): boolean {
  const d = date instanceof Date ? date : new Date(date);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

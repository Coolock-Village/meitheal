/**
 * Performance Observer — Client-side performance metrics
 *
 * Collects Web Vitals (LCP, FID, CLS, INP) and long tasks
 * via the PerformanceObserver API. Logs to console in dev,
 * can be extended to send to analytics endpoint.
 *
 * Bounded context: lib (cross-domain utility)
 */

interface PerfMetric {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
}

type MetricCallback = (metric: PerfMetric) => void

const callbacks: MetricCallback[] = []

export function onPerfMetric(cb: MetricCallback): void {
  callbacks.push(cb)
}

function emit(metric: PerfMetric): void {
  for (const cb of callbacks) {
    try { cb(metric) } catch { /* non-fatal */ }
  }
}

export function initPerfObserver(): void {
  if (typeof PerformanceObserver === "undefined") return

  // Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        const value = last.startTime
        emit({ name: "LCP", value, rating: value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor" })
      }
    })
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
  } catch { /* not supported */ }

  // First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as PerformanceEventTiming | undefined
      if (entry) {
        const value = entry.processingStart - entry.startTime
        emit({ name: "FID", value, rating: value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor" })
      }
    })
    fidObserver.observe({ type: "first-input", buffered: true })
  } catch { /* not supported */ }

  // Cumulative Layout Shift
  try {
    let clsTotal = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsTotal += (entry as any).value ?? 0
        }
      }
      emit({ name: "CLS", value: clsTotal, rating: clsTotal <= 0.1 ? "good" : clsTotal <= 0.25 ? "needs-improvement" : "poor" })
    })
    clsObserver.observe({ type: "layout-shift", buffered: true })
  } catch { /* not supported */ }

  // Long Tasks (> 50ms)
  try {
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          emit({ name: "LongTask", value: entry.duration, rating: entry.duration <= 100 ? "good" : entry.duration <= 250 ? "needs-improvement" : "poor" })
        }
      }
    })
    longTaskObserver.observe({ type: "longtask" })
  } catch { /* not supported */ }
}

/**
 * Performance measurement utilities for Core Web Vitals tracking.
 *
 * Targets (from docs/07_PERFORMANCE.md):
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - Initial page load: < 3s
 * - Dial response: < 100ms
 */

export type WebVitalMetric = {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

const thresholds: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

const getRating = (name: string, value: number): WebVitalMetric['rating'] => {
  const threshold = thresholds[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

export const reportWebVitals = (onReport?: (metric: WebVitalMetric) => void): void => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  const callback =
    onReport ??
    ((metric: WebVitalMetric) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[WebVitals] ${metric.name}: ${metric.value} (${metric.rating})`);
      }
    });

  // LCP
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        callback({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: getRating('LCP', lastEntry.startTime),
        });
      }
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // PerformanceObserver not supported for this entry type
  }

  // FCP
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          callback({
            name: 'FCP',
            value: entry.startTime,
            rating: getRating('FCP', entry.startTime),
          });
        }
      }
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch {
    // PerformanceObserver not supported for this entry type
  }

  // CLS
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch {
    // PerformanceObserver not supported for this entry type
  }
};

/**
 * Measure interaction performance (e.g., Dial operation latency).
 * Target: < 100ms for Dial interactions.
 */
export const measureInteraction = (label: string, fn: () => void): number => {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  if (process.env.NODE_ENV === 'development') {
    const status = duration < 100 ? '✓' : '✗';
    console.log(`[Perf] ${status} ${label}: ${duration.toFixed(2)}ms`);
  }

  return duration;
};

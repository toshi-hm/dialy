/**
 * Performance measurement utilities for Core Web Vitals tracking.
 *
 * Targets (from docs/07_PERFORMANCE.md):
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FCP (First Contentful Paint): < 1.8s
 * - CLS (Cumulative Layout Shift): < 0.1
 * - Initial page load: < 3s
 * - Dial response: < 100ms
 */

export type WebVitalMetric = {
  name: 'LCP' | 'FCP' | 'CLS';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

const thresholds: Record<string, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
};

const getRating = (name: string, value: number): WebVitalMetric['rating'] => {
  const threshold = thresholds[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

const ratingIcons: Record<WebVitalMetric['rating'], string> = {
  good: '✅',
  'needs-improvement': '⚠️',
  poor: '❌',
};

const isDev = process.env.NODE_ENV === 'development';

const noopCallback = (_metric: WebVitalMetric): void => {};

const logMetric = (metric: WebVitalMetric): void => {
  const icon = ratingIcons[metric.rating];
  console.log(`[Web Vitals] ${icon} ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
};

/**
 * Register PerformanceObservers for Core Web Vitals (LCP, FCP, CLS).
 * Returns a cleanup function that disconnects all observers.
 */
export const reportWebVitals = (onReport?: (metric: WebVitalMetric) => void): (() => void) => {
  const observers: PerformanceObserver[] = [];

  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return () => {};
  }

  const callback = onReport ?? (isDev ? logMetric : noopCallback);

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
    observers.push(lcpObserver);
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
    observers.push(fcpObserver);
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
    observers.push(clsObserver);
  } catch {
    // PerformanceObserver not supported for this entry type
  }

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
  };
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
    console.log(`[Interaction] ${label}: ${duration.toFixed(2)}ms`);
  }

  return duration;
};

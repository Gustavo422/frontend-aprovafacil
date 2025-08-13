// Lightweight metrics aggregator for the Simulados feature (browser-only)
// - Tracks TTFB/TTD (approximations), query success/error, and cache hit-rate

type CounterMap = Record<string, number>;

interface MetricsState {
  counters: CounterMap;
  lastReportAt: number;
}

const state: MetricsState = {
  counters: Object.create(null) as CounterMap,
  lastReportAt: Date.now(),
};

function incr(key: string, by = 1): void {
  state.counters[key] = (state.counters[key] ?? 0) + by;
}

function get(key: string): number {
  return state.counters[key] ?? 0;
}

export function recordQuerySuccess(endpoint?: string): void {
  if (typeof window === 'undefined') return;
  incr('rq_success_total');
  if (endpoint) incr(`rq_success:${endpoint}`);
}

export function recordQueryError(endpoint?: string): void {
  if (typeof window === 'undefined') return;
  incr('rq_error_total');
  if (endpoint) incr(`rq_error:${endpoint}`);
}

export function recordCacheHit(section: 'list' | 'detail' | 'questoes'): void {
  if (typeof window === 'undefined') return;
  incr('cache_hit_total');
  incr(`cache_hit:${section}`);
}

export function recordCacheFallback(section: 'list' | 'detail' | 'questoes'): void {
  if (typeof window === 'undefined') return;
  incr('cache_fallback_total');
  incr(`cache_fallback:${section}`);
}

export function recordNetwork304(section: 'list' | 'detail' | 'questoes'): void {
  if (typeof window === 'undefined') return;
  incr('network_304_total');
  incr(`network_304:${section}`);
}

export function recordNetwork200(section: 'list' | 'detail' | 'questoes'): void {
  if (typeof window === 'undefined') return;
  incr('network_200_total');
  incr(`network_200:${section}`);
}

export function reportNavigationTimings(): void {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return;
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType('paint') as PerformanceEntry[];
    if (nav) {
      // TTFB approximation: responseStart - requestStart
      const ttfb = Math.max(0, nav.responseStart - nav.requestStart);
      // TTD approximation: First Contentful Paint relative to nav start
      const fcp = paints.find((p) => p.name === 'first-contentful-paint');
      const ttd = fcp ? Math.max(0, fcp.startTime) : Math.max(0, nav.domContentLoadedEventEnd - nav.startTime);
      // Store as counters (rounded)
      incr('ttfb_ms_sum', Math.round(ttfb));
      incr('ttd_ms_sum', Math.round(ttd));
      incr('page_load_count');
      // Also expose on window for quick inspection
      (window as any).__af_metrics__ = {
        ...(window as any).__af_metrics__,
        last_ttfb_ms: ttfb,
        last_ttd_ms: ttd,
      };
      // Console sample (dev only)
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.info('[metrics] nav timings', { ttfb_ms: Math.round(ttfb), ttd_ms: Math.round(ttd) });
      }
    }
  } catch {
    // ignore
  }
}

export function summarizeAndLog(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - state.lastReportAt < 10_000) return; // throttle to every 10s
  state.lastReportAt = now;
  const successes = get('rq_success_total');
  const errors = get('rq_error_total');
  const total = successes + errors;
  const errorRate = total > 0 ? (errors / total) * 100 : 0;
  const hit = get('cache_hit_total');
  const fallback = get('cache_fallback_total');
  const net200 = get('network_200_total');
  const net304 = get('network_304_total');
  const pageLoads = get('page_load_count');
  const ttfbAvg = pageLoads > 0 ? get('ttfb_ms_sum') / pageLoads : 0;
  const ttdAvg = pageLoads > 0 ? get('ttd_ms_sum') / pageLoads : 0;
  const cacheOps = hit + fallback + net200 + net304;
  const cacheHitRate = cacheOps > 0 ? (hit / cacheOps) * 100 : 0;
  // eslint-disable-next-line no-console
  console.info('[metrics] summary', {
    rq: { total, successes, errors, errorRate: Number(errorRate.toFixed(2)) },
    cache: { hit, fallback, net200, net304, hitRate: Number(cacheHitRate.toFixed(2)) },
    timing: { ttfbAvgMs: Math.round(ttfbAvg), ttdAvgMs: Math.round(ttdAvg) },
  });
}

// Optional: start periodic reporter in dev
export function startMetricsReporter(): void {
  if (typeof window === 'undefined') return;
  if (process.env.NODE_ENV !== 'production') {
    setInterval(summarizeAndLog, 10_000);
  }
}

export type { MetricsState };



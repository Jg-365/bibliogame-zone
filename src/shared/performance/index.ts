// =============================================================================
// PERFORMANCE OPTIMIZATION EXPORTS
// =============================================================================

// App-level Performance Monitoring
export {
  AppPerformanceProvider,
  ComponentPerformanceWrapper,
  useNavigationPerformance,
  PerformanceDebugger,
} from "./AppPerformanceProvider";

// Bundle Analysis and Optimization
export {
  useBundleAnalysis,
  BundleOptimizer,
  BundleAnalysisDisplay,
  usePerformanceBudget,
} from "./BundleAnalyzer";

// Lazy Loading Utilities
export {
  createLazyComponent,
  PageLoader,
  ComponentLoader,
  SkeletonLoader,
  LazyWrapper,
  usePreloadOnInteraction,
  usePreloadOnView,
  useDynamicChart,
  useDynamicDatePicker,
  useLoadingPerformance,
} from "../utils/lazyLoading";

// Memoization Utilities
export {
  createMemoComponent,
  shallowEqual,
  deepEqual,
  createPropsComparison,
  OptimizedListItem,
  OptimizedCard,
  useOptimizedState,
  useDebouncedValue,
  useThrottledCallback,
  useStableCallback,
  useVirtualizedList,
  useRenderPerformance,
  useMemoryMonitor,
} from "../utils/memoization";

// Code Splitting Utilities
export {
  Routes,
  Auth,
  Books,
  Profile,
  Achievements,
  useChartComponents,
  useDatePickerComponents,
  LazyRoute,
  preloadCriticalRoutes,
  useSmartPreloading,
  useBundlePerformance,
  getBundleInfo,
} from "../utils/codeSplitting";

// Virtualized Components
export {
  VirtualizedList,
  VirtualizedGrid,
  InfiniteLoader,
  VirtualizedBookList,
  VirtualizedAchievementGrid,
} from "../components/VirtualizedComponents";

// =============================================================================
// PERFORMANCE OPTIMIZATION HOOKS
// =============================================================================

import React from "react";

/**
 * Combined performance optimization hook
 */
export function usePerformanceOptimization(options?: {
  componentName?: string;
  enableMemoryMonitoring?: boolean;
  enableRenderMonitoring?: boolean;
  preloadRoutes?: boolean;
}) {
  const {
    componentName = "Component",
    enableMemoryMonitoring = false,
    enableRenderMonitoring = process.env.NODE_ENV === "development",
    preloadRoutes = true,
  } = options || {};

  // Import hooks from their respective modules
  const { useRenderPerformance, useMemoryMonitor } = require("../utils/memoization");
  const { useSmartPreloading } = require("../utils/codeSplitting");

  // Monitor render performance
  const renderCount = useRenderPerformance(componentName, enableRenderMonitoring);

  // Monitor memory usage
  useMemoryMonitor(componentName, enableMemoryMonitoring);

  // Smart preloading
  const { preloadOnHover } = useSmartPreloading();

  return {
    renderCount,
    preloadOnHover,
  };
}

/**
 * Optimized data fetching hook with intelligent caching
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    refetchOnWindowFocus?: boolean;
    enabled?: boolean;
  }
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = false,
    enabled = true,
  } = options || {};

  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const cacheRef = React.useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const cacheKey = JSON.stringify(queryKey);

  const fetchData = React.useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < staleTime) {
      setData(cached.data);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();

      // Update cache
      cacheRef.current.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      setData(result);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, queryFn, enabled, staleTime]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cleanup cache periodically
  React.useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, value] of cacheRef.current.entries()) {
        if (now - value.timestamp > cacheTime) {
          cacheRef.current.delete(key);
        }
      }
    }, cacheTime);

    return () => clearInterval(cleanup);
  }, [cacheTime]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    isStale: React.useMemo(() => {
      const cached = cacheRef.current.get(cacheKey);
      return cached ? Date.now() - cached.timestamp > staleTime : true;
    }, [cacheKey, staleTime]),
  };
}

// =============================================================================
// PERFORMANCE MONITORING UTILITIES
// =============================================================================

/**
 * Global performance monitor
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (typeof window === "undefined") return;

    // Monitor long tasks
    if ("PerformanceObserver" in window) {
      const longTaskObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ["longtask"] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        console.warn("Long task monitoring not supported");
      }

      // Monitor layout shifts
      const clsObserver = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if ((entry as any).value > 0.1) {
            console.warn(`Layout shift detected: ${(entry as any).value}`);
          }
        }
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn("Layout shift monitoring not supported");
      }
    }
  }

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name)!;
    values.push(value);

    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    }

    return result;
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitor() {
  const monitor = React.useMemo(() => PerformanceMonitor.getInstance(), []);

  React.useEffect(() => {
    monitor.startMonitoring();

    return () => {
      // Don't destroy global instance, just disconnect
    };
  }, [monitor]);

  return {
    recordMetric: monitor.recordMetric.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
  };
}

// =============================================================================
// WEB VITALS INTEGRATION
// =============================================================================

/**
 * Web Vitals monitoring hook
 */
export function useWebVitals() {
  const [vitals, setVitals] = React.useState<{
    CLS?: number;
    FID?: number;
    FCP?: number;
    LCP?: number;
    TTFB?: number;
  }>({});

  React.useEffect(() => {
    // This would integrate with web-vitals library when available
    // For now, we'll use basic performance API

    if (typeof window !== "undefined" && "performance" in window) {
      const navigation = performance.getEntriesByType("navigation")[0] as any;

      if (navigation) {
        setVitals({
          TTFB: navigation.responseStart - navigation.requestStart,
          FCP: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        });
      }
    }
  }, []);

  return vitals;
}

// =============================================================================
// PERFORMANCE BEST PRACTICES
// =============================================================================

export const PerformanceTips = {
  /**
   * Check if component should use React.memo
   */
  shouldMemoize: (componentName: string, renderCount: number): boolean => {
    if (renderCount > 10) {
      console.info(`💡 Consider memoizing ${componentName} - rendered ${renderCount} times`);
      return true;
    }
    return false;
  },

  /**
   * Check if list should be virtualized
   */
  shouldVirtualize: (itemCount: number): boolean => {
    if (itemCount > 100) {
      console.info(`💡 Consider virtualizing list with ${itemCount} items`);
      return true;
    }
    return false;
  },

  /**
   * Check if component should be lazy loaded
   */
  shouldLazyLoad: (componentSize: "small" | "medium" | "large"): boolean => {
    if (componentSize === "large") {
      console.info("💡 Consider lazy loading this large component");
      return true;
    }
    return false;
  },
};

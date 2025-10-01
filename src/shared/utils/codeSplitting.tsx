import React from "react";
import { createLazyComponent, LazyWrapper } from "../utils/lazyLoading";

// =============================================================================
// ROUTE-BASED CODE SPLITTING
// =============================================================================

// Main application routes
export const Routes = {
  Dashboard: createLazyComponent(() => import("@/pages/Dashboard"), {
    name: "Dashboard",
    retries: 3,
  }),

  Index: createLazyComponent(() => import("@/pages/Index"), { name: "Index", retries: 3 }),

  NotFound: createLazyComponent(() => import("@/pages/NotFound"), { name: "NotFound", retries: 2 }),
} as const;

// Authentication components (to be added when components exist)
export const Auth = {
  // AuthPage: createLazyComponent(
  //   () => import('@/components/auth/AuthPage'),
  //   { name: 'AuthPage' }
  // ),
} as const;

// =============================================================================
// FEATURE-BASED CODE SPLITTING
// =============================================================================

// Books feature components (when they exist)
export const Books = {
  // BookForm: createLazyComponent(
  //   () => import('@/features/books/components/BookForm'),
  //   { name: 'BookForm' }
  // ),
  // BooksList: createLazyComponent(
  //   () => import('@/features/books/components/BooksList'),
  //   { name: 'BooksList' }
  // ),
  // BookDetails: createLazyComponent(
  //   () => import('@/features/books/components/BookDetails'),
  //   { name: 'BookDetails' }
  // ),
} as const;

// Profile feature components (when they exist)
export const Profile = {
  // ProfileSettings: createLazyComponent(
  //   () => import('@/features/profile/components/ProfileSettings'),
  //   { name: 'ProfileSettings' }
  // ),
  // ProfileStats: createLazyComponent(
  //   () => import('@/features/profile/components/ProfileStats'),
  //   { name: 'ProfileStats' }
  // ),
} as const;

// Achievements feature components (when they exist)
export const Achievements = {
  // AchievementsList: createLazyComponent(
  //   () => import('@/features/achievements/components/AchievementsList'),
  //   { name: 'AchievementsList' }
  // ),
  // AchievementCard: createLazyComponent(
  //   () => import('@/features/achievements/components/AchievementCard'),
  //   { name: 'AchievementCard' }
  // ),
} as const;

// =============================================================================
// HEAVY DEPENDENCY SPLITTING
// =============================================================================

/**
 * Lazy load chart components only when needed
 */
export const useChartComponents = () => {
  const [chartComponents, setChartComponents] = React.useState<{
    Chart?: React.ComponentType<any>;
    Line?: React.ComponentType<any>;
    Bar?: React.ComponentType<any>;
    Doughnut?: React.ComponentType<any>;
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadChartComponents = React.useCallback(async () => {
    if (chartComponents) return chartComponents;

    setIsLoading(true);
    setError(null);

    try {
      // Mock components for now (will be replaced with actual chart libraries)
      const reactChart = {
        Chart: () => (
          <div className="h-64 bg-muted rounded flex items-center justify-center">Gráfico</div>
        ),
        Line: () => (
          <div className="h-64 bg-muted rounded flex items-center justify-center">
            Gráfico de Linha
          </div>
        ),
        Bar: () => (
          <div className="h-64 bg-muted rounded flex items-center justify-center">
            Gráfico de Barras
          </div>
        ),
        Doughnut: () => (
          <div className="h-64 bg-muted rounded flex items-center justify-center">
            Gráfico Rosquinha
          </div>
        ),
      };

      const components = {
        Chart: reactChart.Chart,
        Line: reactChart.Line,
        Bar: reactChart.Bar,
        Doughnut: reactChart.Doughnut,
      };

      setChartComponents(components);
      return components;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load chart components";
      setError(errorMessage);
      console.error("Failed to load chart components:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chartComponents]);

  return {
    chartComponents,
    loadChartComponents,
    isLoading,
    error,
  };
};

/**
 * Lazy load date picker components
 */
export const useDatePickerComponents = () => {
  const [dateComponents, setDateComponents] = React.useState<{
    Calendar?: React.ComponentType<any>;
    DatePicker?: React.ComponentType<any>;
    DateRangePicker?: React.ComponentType<any>;
  } | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDateComponents = React.useCallback(async () => {
    if (dateComponents) return dateComponents;

    setIsLoading(true);
    setError(null);

    try {
      // Import date components when needed
      const components = {
        Calendar: (await import("@/components/ui/calendar")).Calendar,
        // Add other date components as they become available
        DatePicker: () => (
          <input
            type="date"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
          />
        ),
        DateRangePicker: () => (
          <div className="flex gap-2">
            <input type="date" />
            <span>até</span>
            <input type="date" />
          </div>
        ),
      };

      setDateComponents(components);
      return components;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load date components";
      setError(errorMessage);
      console.error("Failed to load date components:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dateComponents]);

  return {
    dateComponents,
    loadDateComponents,
    isLoading,
    error,
  };
};

// =============================================================================
// LAZY ROUTE WRAPPER
// =============================================================================

interface LazyRouteProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ComponentType | React.ReactElement;
  errorBoundary?: boolean;
  preload?: boolean;
  name?: string;
}

export const LazyRoute: React.FC<LazyRouteProps> = ({
  component: Component,
  fallback,
  errorBoundary = true,
  preload = false,
  name = "Route",
}) => {
  // Preload component on mount if requested
  React.useEffect(() => {
    if (preload) {
      // Trigger component loading without rendering
      const componentPayload = (Component as any)._payload;
      if (componentPayload && typeof componentPayload._result === "undefined") {
        componentPayload._result = componentPayload._init();
      }
    }
  }, [Component, preload]);

  return (
    <LazyWrapper fallback={fallback} errorBoundary={errorBoundary} name={name}>
      <Component />
    </LazyWrapper>
  );
};

// =============================================================================
// PRELOADING UTILITIES
// =============================================================================

/**
 * Preload critical routes for better UX
 */
export const preloadCriticalRoutes = () => {
  const routesToPreload = [
    Routes.Dashboard,
    // Add other critical routes
  ];

  routesToPreload.forEach(LazyComponent => {
    try {
      const componentPayload = (LazyComponent as any)._payload;
      if (componentPayload && typeof componentPayload._result === "undefined") {
        componentPayload._result = componentPayload._init();
      }
    } catch (error) {
      console.warn("Failed to preload route:", error);
    }
  });
};

/**
 * Preload routes based on user behavior patterns
 */
export const useSmartPreloading = () => {
  React.useEffect(() => {
    // Preload likely next routes after 2 seconds of inactivity
    const timer = setTimeout(() => {
      preloadCriticalRoutes();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Preload on link hover
  const preloadOnHover = React.useCallback((routeName: keyof typeof Routes) => {
    const route = Routes[routeName];
    if (route) {
      try {
        const componentPayload = (route as any)._payload;
        if (componentPayload && typeof componentPayload._result === "undefined") {
          componentPayload._result = componentPayload._init();
        }
      } catch (error) {
        console.warn(`Failed to preload route ${routeName}:`, error);
      }
    }
  }, []);

  return { preloadOnHover };
};

// =============================================================================
// BUNDLE ANALYSIS UTILITIES
// =============================================================================

/**
 * Monitor bundle loading performance
 */
export const useBundlePerformance = () => {
  const [loadTimes, setLoadTimes] = React.useState<Record<string, number>>({});

  const trackBundleLoad = React.useCallback((bundleName: string, startTime: number) => {
    const endTime = performance.now();
    const loadTime = endTime - startTime;

    setLoadTimes(prev => ({ ...prev, [bundleName]: loadTime }));

    if (loadTime > 2000) {
      console.warn(`Slow bundle load: ${bundleName} took ${loadTime.toFixed(2)}ms`);
    }

    // In production, send to analytics
    if (process.env.NODE_ENV === "production") {
      // analytics.track('bundle_load_time', { bundleName, loadTime });
    }
  }, []);

  return { loadTimes, trackBundleLoad };
};

/**
 * Get bundle size estimation
 */
export const getBundleInfo = () => {
  const bundleInfo = {
    main: "Main application bundle",
    vendor: "Third-party dependencies",
    routes: "Route-based chunks",
    features: "Feature-based chunks",
  };

  if (process.env.NODE_ENV === "development") {
    console.table(bundleInfo);
  }

  return bundleInfo;
};

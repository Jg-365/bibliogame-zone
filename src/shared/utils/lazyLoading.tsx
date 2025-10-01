import React, { Suspense, ComponentType, LazyExoticComponent } from "react";
import { Loader2 } from "lucide-react";

// =============================================================================
// LAZY LOADING UTILITIES
// =============================================================================

/**
 * Enhanced lazy loading with retry functionality and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFunction: () => Promise<{ default: T }>,
  options?: {
    name?: string;
    retries?: number;
    retryDelay?: number;
    fallback?: React.ComponentType;
  }
): LazyExoticComponent<T> {
  const { name = "Component", retries = 3, retryDelay = 1000, fallback } = options || {};

  const lazyComponent = React.lazy(async () => {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const module = await importFunction();

        // Add display name for better debugging
        if (module.default.displayName === undefined) {
          module.default.displayName = `Lazy(${name})`;
        }

        return module;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Failed to load ${name} (attempt ${attempt}/${retries}):`, error);

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    // If all retries failed, throw the last error
    throw new Error(`Failed to load ${name} after ${retries} attempts: ${lastError?.message}`);
  });

  return lazyComponent;
}

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

export const PageLoader: React.FC<{ message?: string }> = ({
  message = "Carregando página...",
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
);

export const ComponentLoader: React.FC<{
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}> = ({ size = "md", message, className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const containerClasses = {
    sm: "min-h-[100px] space-y-2",
    md: "min-h-[200px] space-y-3",
    lg: "min-h-[300px] space-y-4",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {message && <p className="text-xs text-muted-foreground text-center">{message}</p>}
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  lines?: number;
  className?: string;
}> = ({ lines = 3, className = "" }) => (
  <div className={`space-y-2 ${className}`} role="status" aria-label="Carregando conteúdo">
    {Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={`h-4 bg-muted rounded animate-pulse ${index === lines - 1 ? "w-3/4" : "w-full"}`}
      />
    ))}
    <span className="sr-only">Carregando...</span>
  </div>
);

// =============================================================================
// LAZY WRAPPER COMPONENT
// =============================================================================

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType | React.ReactElement;
  errorBoundary?: boolean;
  name?: string;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  errorBoundary = true,
  name = "Component",
}) => {
  const FallbackComponent = React.useMemo(() => {
    if (React.isValidElement(fallback)) {
      return () => fallback;
    }

    if (typeof fallback === "function") {
      return fallback;
    }

    return () => <ComponentLoader message={`Carregando ${name}...`} />;
  }, [fallback, name]);

  const content = <Suspense fallback={<FallbackComponent />}>{children}</Suspense>;

  if (errorBoundary) {
    return <React.Suspense fallback={<FallbackComponent />}>{content}</React.Suspense>;
  }

  return content;
};

// =============================================================================
// PRELOADING UTILITIES
// =============================================================================

/**
 * Preload lazy components on user interaction (hover, focus)
 */
export function usePreloadOnInteraction<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
) {
  const preloadRef = React.useRef<Promise<{ default: T }> | null>(null);

  const preload = React.useCallback(() => {
    if (!preloadRef.current) {
      // Access the internal _payload to trigger loading
      const componentPayload = (lazyComponent as any)._payload;
      if (componentPayload && typeof componentPayload._result === "undefined") {
        preloadRef.current = componentPayload._result = componentPayload._init();
      }
    }
    return preloadRef.current;
  }, [lazyComponent]);

  return {
    preload,
    onMouseEnter: preload,
    onFocus: preload,
  };
}

/**
 * Preload components based on viewport intersection
 */
export function usePreloadOnView<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>,
  options?: IntersectionObserverInit
) {
  const [ref, setRef] = React.useState<Element | null>(null);
  const { preload } = usePreloadOnInteraction(lazyComponent);

  React.useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preload();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, ...options }
    );

    observer.observe(ref);

    return () => {
      observer.disconnect();
    };
  }, [ref, preload, options]);

  return setRef;
}

// =============================================================================
// ROUTE-BASED CODE SPLITTING
// =============================================================================

// Main pages - loaded lazily
export const LazyDashboard = createLazyComponent(() => import("@/pages/Dashboard"), {
  name: "Dashboard",
});

// Note: These components will be created when the actual feature modules exist
// export const LazyBookForm = createLazyComponent(
//   () => import('@/features/books/components/BookForm'),
//   { name: 'BookForm' }
// );

// =============================================================================
// DYNAMIC IMPORTS FOR HEAVY DEPENDENCIES
// =============================================================================

/**
 * Dynamically import heavy chart library only when needed
 */
export const useDynamicChart = () => {
  const [ChartComponent, setChartComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadChart = React.useCallback(async () => {
    if (ChartComponent) return ChartComponent;

    setIsLoading(true);
    setError(null);

    try {
      // Dynamic import will be added when chart library is needed
      // const { Chart } = await import('react-chartjs-2');
      const MockChart = () => <div>Chart component would load here</div>;
      setChartComponent(() => MockChart);
      return MockChart;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load chart";
      setError(errorMessage);
      console.error("Failed to load chart component:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [ChartComponent]);

  return {
    ChartComponent,
    loadChart,
    isLoading,
    error,
  };
};

/**
 * Dynamically import date picker only when needed
 */
export const useDynamicDatePicker = () => {
  const [DatePicker, setDatePicker] = React.useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadDatePicker = React.useCallback(async () => {
    if (DatePicker) return DatePicker;

    setIsLoading(true);
    try {
      const { Calendar } = await import("@/components/ui/calendar");
      setDatePicker(() => Calendar);
      return Calendar;
    } catch (err) {
      console.error("Failed to load date picker:", err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [DatePicker]);

  return { DatePicker, loadDatePicker, isLoading };
};

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Performance monitoring for lazy loading
 */
export function useLoadingPerformance(componentName: string) {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      if (loadTime > 1000) {
        console.warn(`Slow component load: ${componentName} took ${loadTime.toFixed(2)}ms`);
      }

      // In production, you could send this to analytics
      if (process.env.NODE_ENV === "production") {
        // Example: analytics.track('component_load_time', { componentName, loadTime });
      }
    };
  }, [componentName]);
}

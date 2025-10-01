import React from "react";
import { usePerformanceMonitor, useWebVitals } from "@/shared/performance";

/**
 * Performance monitoring wrapper for the entire app
 * Provides global performance tracking and metrics
 */
export const AppPerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize global performance monitoring
  const { recordMetric } = usePerformanceMonitor();

  // Track Core Web Vitals
  const vitals = useWebVitals();

  React.useEffect(() => {
    // Log vitals when they change
    if (Object.keys(vitals).length > 0) {
      console.log("Web Vitals:", vitals);

      // Send to analytics in production
      if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
        // Example: Send to Google Analytics
        if ((window as any).gtag) {
          Object.entries(vitals).forEach(([name, value]) => {
            if (value !== undefined) {
              (window as any).gtag("event", name, {
                event_category: "Web Vitals",
                value: Math.round(name === "CLS" ? value * 1000 : value),
                non_interaction: true,
              });
            }
          });
        }

        // Example: Send to custom analytics endpoint
        try {
          fetch("/api/analytics/web-vitals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vitals),
          }).catch(() => {
            // Silently fail if analytics endpoint is not available
          });
        } catch {
          // Silently fail
        }
      }
    }
  }, [vitals]);

  return <>{children}</>;
};

/**
 * Component-level performance wrapper
 * Use this to monitor specific components that are performance-critical
 */
export const ComponentPerformanceWrapper: React.FC<{
  name: string;
  children: React.ReactNode;
  logRenders?: boolean;
}> = ({ name, children, logRenders = false }) => {
  const renderCount = React.useRef(0);

  // Monitor this specific component
  const { recordMetric } = usePerformanceMonitor();

  React.useEffect(() => {
    recordMetric("component_render", {
      componentName: name,
      renderCount: renderCount.current,
      timestamp: Date.now(),
    });
  }, [name, recordMetric]);

  React.useEffect(() => {
    renderCount.current += 1;

    if (logRenders && process.env.NODE_ENV === "development") {
      console.log(`Component "${name}" rendered ${renderCount.current} times`);
    }
  });

  return <>{children}</>;
};

/**
 * Hook for monitoring page navigation performance
 */
export const useNavigationPerformance = () => {
  const navigationStartTime = React.useRef<number | null>(null);

  const startNavigation = React.useCallback((pageName: string) => {
    navigationStartTime.current = performance.now();
    console.log(`Starting navigation to ${pageName}`);
  }, []);

  const endNavigation = React.useCallback((pageName: string) => {
    if (navigationStartTime.current) {
      const navigationTime = performance.now() - navigationStartTime.current;
      console.log(`Navigation to ${pageName} completed in ${navigationTime.toFixed(2)}ms`);

      // Send to analytics
      if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
        if ((window as any).gtag) {
          (window as any).gtag("event", "page_navigation_time", {
            page_name: pageName,
            navigation_time: Math.round(navigationTime),
          });
        }
      }

      navigationStartTime.current = null;
    }
  }, []);

  return { startNavigation, endNavigation };
};

/**
 * Development-only performance debugging component
 */
export const PerformanceDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [performanceData, setPerformanceData] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Listen for performance entries
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        setPerformanceData(prev => [...prev, ...entries].slice(-50)); // Keep last 50 entries
      });

      observer.observe({ entryTypes: ["navigation", "resource", "measure", "mark"] });

      return () => observer.disconnect();
    }
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Toggle Performance Debugger"
      >
        ⚡
      </button>

      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">Performance Metrics</h3>
          <div className="space-y-2 text-sm">
            {performanceData.map((entry, index) => (
              <div key={index} className="border-b pb-1">
                <div className="font-medium">{entry.name}</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {entry.entryType}:{" "}
                  {entry.duration?.toFixed(2) || entry.value?.toFixed(2) || "N/A"}ms
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

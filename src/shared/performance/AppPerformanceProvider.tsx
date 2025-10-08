import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
}

interface AppPerformanceContextType {
  metrics: PerformanceMetrics;
  startTiming: (label: string) => void;
  endTiming: (label: string) => void;
  logMetric: (name: string, value: number) => void;
}

const AppPerformanceContext = createContext<
  AppPerformanceContextType | undefined
>(undefined);

export const AppPerformanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [metrics, setMetrics] =
    useState<PerformanceMetrics>({
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
    });

  const [timings, setTimings] = useState<
    Map<string, number>
  >(new Map());

  const startTiming = (label: string) => {
    setTimings((prev) =>
      new Map(prev).set(label, performance.now())
    );
  };

  const endTiming = (label: string) => {
    const startTime = timings.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      logMetric(label, duration);
      setTimings((prev) => {
        const newMap = new Map(prev);
        newMap.delete(label);
        return newMap;
      });
    }
  };

  const logMetric = (name: string, value: number) => {
    console.log(
      `Performance metric [${name}]: ${value.toFixed(2)}ms`
    );

    // Update relevant metrics
    if (name.includes("load")) {
      setMetrics((prev) => ({ ...prev, loadTime: value }));
    } else if (name.includes("render")) {
      setMetrics((prev) => ({
        ...prev,
        renderTime: value,
      }));
    }
  };

  useEffect(() => {
    // Monitor memory usage if available
    if ("memory" in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory;
        if (memory) {
          setMetrics((prev) => ({
            ...prev,
            memoryUsage:
              memory.usedJSHeapSize / 1024 / 1024, // Convert to MB
          }));
        }
      };

      updateMemoryUsage();
      const interval = setInterval(updateMemoryUsage, 5000);
      return () => clearInterval(interval);
    }
  }, []);

  const contextValue: AppPerformanceContextType = {
    metrics,
    startTiming,
    endTiming,
    logMetric,
  };

  return (
    <AppPerformanceContext.Provider value={contextValue}>
      {children}
    </AppPerformanceContext.Provider>
  );
};

export const useAppPerformance = () => {
  const context = useContext(AppPerformanceContext);
  if (!context) {
    throw new Error(
      "useAppPerformance must be used within AppPerformanceProvider"
    );
  }
  return context;
};

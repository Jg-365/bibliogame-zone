import React from "react";

// =============================================================================
// MEMOIZATION UTILITIES
// =============================================================================

/**
 * Enhanced React.memo with deep comparison for complex props
 */
export function createMemoComponent<P = {}>(
  Component: React.ComponentType<P>,
  options?: {
    displayName?: string;
    propsAreEqual?: (prevProps: P, nextProps: P) => boolean;
    debug?: boolean;
  }
): React.MemoExoticComponent<React.ComponentType<P>> {
  const { displayName, propsAreEqual, debug = false } = options || {};

  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    if (debug) {
      console.log(`[Memo Debug] ${displayName || Component.displayName || Component.name}:`, {
        prevProps,
        nextProps,
        areEqual: propsAreEqual ? propsAreEqual(prevProps as P, nextProps as P) : undefined,
      });
    }

    return propsAreEqual ? propsAreEqual(prevProps as P, nextProps as P) : false;
  });

  if (displayName) {
    MemoizedComponent.displayName = displayName;
  }

  return MemoizedComponent;
}

/**
 * Shallow comparison for React.memo
 */
export function shallowEqual<T extends Record<string, any>>(prevProps: T, nextProps: T): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Deep comparison for React.memo (use sparingly)
 */
export function deepEqual<T extends Record<string, any>>(prevProps: T, nextProps: T): boolean {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
}

/**
 * Custom comparison that ignores specific props
 */
export function createPropsComparison<T extends Record<string, any>>(
  ignoredProps: (keyof T)[] = []
) {
  return (prevProps: T, nextProps: T): boolean => {
    const prevFiltered = { ...prevProps };
    const nextFiltered = { ...nextProps };

    ignoredProps.forEach(prop => {
      delete prevFiltered[prop];
      delete nextFiltered[prop];
    });

    return shallowEqual(prevFiltered, nextFiltered);
  };
}

// =============================================================================
// OPTIMIZED COMPONENT PATTERNS
// =============================================================================

/**
 * Optimized list item component pattern
 */
export interface OptimizedListItemProps {
  id: string | number;
  data: any;
  index?: number;
  onAction?: (id: string | number, action: string, data?: any) => void;
}

export const OptimizedListItem = React.memo<OptimizedListItemProps>(
  ({ id, data, index, onAction }) => {
    const handleAction = React.useCallback(
      (action: string, actionData?: any) => {
        onAction?.(id, action, actionData);
      },
      [id, onAction]
    );

    return (
      <div className="optimized-list-item" data-id={id} data-index={index}>
        {/* Item content */}
        <pre>{JSON.stringify(data, null, 2)}</pre>
        <button onClick={() => handleAction("edit")}>Edit</button>
        <button onClick={() => handleAction("delete")}>Delete</button>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.index === nextProps.index &&
      shallowEqual(prevProps.data, nextProps.data)
    );
  }
);

OptimizedListItem.displayName = "OptimizedListItem";

/**
 * Optimized card component pattern
 */
export interface OptimizedCardProps {
  title: string;
  description?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "danger";
  }>;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const OptimizedCard = React.memo<OptimizedCardProps>(
  ({ title, description, actions = [], loading = false, className = "", children }) => {
    const memoizedActions = React.useMemo(
      () =>
        actions.map((action, index) => (
          <button
            key={`${action.label}-${index}`}
            onClick={action.onClick}
            className={`btn btn-${action.variant || "primary"}`}
            disabled={loading}
          >
            {action.label}
          </button>
        )),
      [actions, loading]
    );

    if (loading) {
      return (
        <div className={`card loading ${className}`}>
          <div className="skeleton-loader">
            <div className="skeleton-title" />
            <div className="skeleton-text" />
          </div>
        </div>
      );
    }

    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {description && <p className="card-description">{description}</p>}
        </div>
        <div className="card-content">{children}</div>
        {actions.length > 0 && <div className="card-actions">{memoizedActions}</div>}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.title === nextProps.title &&
      prevProps.description === nextProps.description &&
      prevProps.loading === nextProps.loading &&
      prevProps.className === nextProps.className &&
      prevProps.actions.length === nextProps.actions.length &&
      prevProps.actions.every(
        (action, index) =>
          action.label === nextProps.actions[index]?.label &&
          action.variant === nextProps.actions[index]?.variant
      )
    );
  }
);

OptimizedCard.displayName = "OptimizedCard";

// =============================================================================
// PERFORMANCE HOOKS
// =============================================================================

/**
 * Optimized useState for complex objects
 */
export function useOptimizedState<T extends Record<string, any>>(
  initialState: T
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const [state, setState] = React.useState<T>(initialState);

  const updateState = React.useCallback((updates: Partial<T> | ((prev: T) => Partial<T>)) => {
    setState(prevState => {
      const newUpdates = typeof updates === "function" ? updates(prevState) : updates;

      // Only update if there are actual changes
      const hasChanges = Object.keys(newUpdates).some(
        key => newUpdates[key as keyof T] !== prevState[key as keyof T]
      );

      return hasChanges ? { ...prevState, ...newUpdates } : prevState;
    });
  }, []);

  return [state, updateState];
}

/**
 * Debounced value hook for search inputs
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const lastRun = React.useRef<number>(0);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return React.useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRun.current = Date.now();
          callback(...args);
        }, delay - (now - lastRun.current));
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Memoized callback that only changes when dependencies change
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = React.useRef<T>(callback);

  React.useEffect(() => {
    callbackRef.current = callback;
  });

  return React.useCallback(((...args: Parameters<T>) => callbackRef.current(...args)) as T, deps);
}

/**
 * Optimized list rendering with virtual scrolling support
 */
export function useVirtualizedList<T>(
  items: T[],
  options?: {
    itemHeight?: number;
    containerHeight?: number;
    overscan?: number;
  }
) {
  const { itemHeight = 50, containerHeight = 400, overscan = 5 } = options || {};
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const visibleItems = React.useMemo(
    () =>
      items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
        item,
        index: visibleRange.start + index,
      })),
    [items, visibleRange.start, visibleRange.end]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    },
  };
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

/**
 * Component render performance monitor
 */
export function useRenderPerformance(
  componentName: string,
  enabled: boolean = process.env.NODE_ENV === "development"
) {
  const renderCount = React.useRef(0);
  const lastRenderTime = React.useRef<number>(0);

  React.useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const now = performance.now();

    if (lastRenderTime.current > 0) {
      const timeSinceLastRender = now - lastRenderTime.current;

      if (timeSinceLastRender < 16.67) {
        // Less than one frame (60fps)
        console.warn(
          `[Performance] ${componentName} is re-rendering frequently (${timeSinceLastRender.toFixed(
            2
          )}ms since last render, ${renderCount.current} total renders)`
        );
      }
    }

    lastRenderTime.current = now;
  });

  return renderCount.current;
}

/**
 * Memory usage monitor for heavy components
 */
export function useMemoryMonitor(componentName: string, enabled: boolean = false) {
  React.useEffect(() => {
    if (!enabled || !("memory" in performance)) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
        console.warn(`[Memory] High memory usage detected in ${componentName}:`, {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        });
      }
    };

    const interval = setInterval(checkMemory, 5000);
    return () => clearInterval(interval);
  }, [componentName, enabled]);
}

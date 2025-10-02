import React from "react";

/**
 * Performance Optimization Utilities
 * Comprehensive lazy loading, bundle splitting, and performance enhancements
 */

// =============================================================================
// LAZY LOADING UTILITIES
// =============================================================================

interface LazyComponentOptions {
  fallback?: React.ComponentType;
  retryCount?: number;
  minLoadingTime?: number;
}

/**
 * Enhanced lazy loading with retry mechanism and minimum loading time
 */
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
) => {
  const {
    fallback: Fallback = () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    ),
    retryCount = 3,
    minLoadingTime = 300
  } = options;

  return React.lazy(async () => {
    const startTime = Date.now();
    let lastError: Error | null = null;
    
    for (let i = 0; i <= retryCount; i++) {
      try {
        const modulePromise = importFn();
        
        // Ensure minimum loading time to prevent flashing
        const [module] = await Promise.all([
          modulePromise,
          new Promise(resolve => 
            setTimeout(resolve, Math.max(0, minLoadingTime - (Date.now() - startTime)))
          )
        ]);
        
        return module;
      } catch (error) {
        lastError = error as Error;
        if (i < retryCount) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  });
};

// =============================================================================
// BUNDLE SPLITTING
// =============================================================================

/**
 * Lazy load page components with optimized splitting
 */
export const LazyPages = {
  // Main pages
  Dashboard: createLazyComponent(
    () => import("@/pages/Dashboard"),
    { minLoadingTime: 200 }
  ),
  
  Index: createLazyComponent(
    () => import("@/pages/Dashboard"),
    { minLoadingTime: 100 }
  ),
  
  NotFound: createLazyComponent(
    () => import("@/pages/NotFound"),
    { minLoadingTime: 100 }
  ),
  
  // Auth components
  AuthPage: createLazyComponent(
    () => import("@/components/auth/AuthPage"),
    { minLoadingTime: 200 }
  ),
};

/**
 * Lazy load feature components
 */
export const LazyComponents = {
  // Dashboard features
  BookSearch: createLazyComponent(
    () => import("@/components/BookSearch")
  ),
  
  AchievementsPanel: createLazyComponent(
    () => import("@/components/AchievementsPanel")
  ),
  
  ActivityFeed: createLazyComponent(
    () => import("@/components/ActivityFeed")
  ),
  
  // User components
  UserProfile: createLazyComponent(
    () => import("@/features/user/components/UserProfile")
  ),
  
  // Reading components
  ReadingTracker: createLazyComponent(
    () => import("@/features/reading/components/ReadingTracker")
  ),
  
  BookRecommendations: createLazyComponent(
    () => import("@/features/books/components/BookRecommendations")
  ),
};

// =============================================================================
// PERFORMANCE HOOKS
// =============================================================================

/**
 * Hook for optimizing expensive computations
 */
export const useOptimizedMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  options: {
    debounce?: number;
    throttle?: number;
  } = {}
) => {
  const { debounce = 0, throttle = 0 } = options;
  
  // Debounced computation
  const debouncedDeps = React.useMemo(() => {
    if (debounce === 0) return deps;
    
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const [debouncedValue, setDebouncedValue] = React.useState(deps);
    
    React.useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(deps);
      }, debounce);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, deps);
    
    return debouncedValue;
  }, [deps, debounce]);
  
  // Throttled computation
  const throttledMemo = React.useMemo(() => {
    if (throttle === 0) return factory();
    
    const lastCall = React.useRef(0);
    const lastResult = React.useRef<T>();
    
    const now = Date.now();
    if (now - lastCall.current >= throttle || !lastResult.current) {
      lastCall.current = now;
      lastResult.current = factory();
    }
    
    return lastResult.current;
  }, [debouncedDeps, throttle]);
  
  return throttledMemo;
};

/**
 * Hook for intersection observer (lazy loading images, infinite scroll)
 */
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const [hasIntersected, setHasIntersected] = React.useState(false);
  const elementRef = React.useRef<HTMLElement>(null);
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => observer.disconnect();
  }, [hasIntersected, options]);
  
  return { elementRef, isIntersecting, hasIntersected };
};

/**
 * Hook for virtual scrolling (large lists)
 */
export const useVirtualScroll = <T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleRange = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);
  
  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent) => setScrollTop(e.currentTarget.scrollTop)
  };
};

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  lazy?: boolean;
  placeholder?: string;
  sizes?: string;
  webpSupport?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  lazy = true,
  placeholder = "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20fill='%23f3f4f6'%20viewBox='0%200%20400%20300'%3E%3Crect%20width='400'%20height='300'/%3E%3C/svg%3E",
  sizes = "100vw",
  webpSupport = true,
  className,
  ...props
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver();
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  
  const shouldLoad = !lazy || hasIntersected;
  
  // Generate optimized src sets
  const generateSrcSet = (originalSrc: string) => {
    if (!webpSupport) return originalSrc;
    
    // This would integrate with your image optimization service
    const formats = ['webp', 'jpg'];
    const sizes = [400, 800, 1200];
    
    return formats.map(format => 
      sizes.map(size => 
        `${originalSrc}?format=${format}&width=${size} ${size}w`
      ).join(', ')
    ).join(', ');
  };
  
  return (
    <div ref={elementRef} className={className}>
      {shouldLoad ? (
        <picture>
          {webpSupport && (
            <source
              srcSet={generateSrcSet(src)}
              type="image/webp"
              sizes={sizes}
            />
          )}
          <img
            {...props}
            src={hasError ? placeholder : src}
            alt={alt}
            loading={lazy ? "lazy" : "eager"}
            sizes={sizes}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            style={{
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
              ...props.style
            }}
          />
        </picture>
      ) : (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{ filter: 'blur(2px)', ...props.style }}
        />
      )}
    </div>
  );
};

// =============================================================================
// PREFETCH UTILITIES
// =============================================================================

/**
 * Prefetch resources on hover or focus
 */
export const usePrefetch = () => {
  const prefetch = React.useCallback((href: string, type: 'page' | 'image' | 'data' = 'page') => {
    if (typeof window === 'undefined') return;
    
    // Check if already prefetched
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    
    const link = document.createElement('link');
    
    switch (type) {
      case 'page':
        link.rel = 'prefetch';
        link.href = href;
        break;
      case 'image':
        link.rel = 'preload';
        link.href = href;
        link.as = 'image';
        break;
      case 'data':
        link.rel = 'prefetch';
        link.href = href;
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
        break;
    }
    
    document.head.appendChild(link);
  }, []);
  
  return { prefetch };
};

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PerformanceErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error?: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Performance Error Boundary caught an error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      const Fallback = this.props.fallback || (() => (
        <div className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Oops! Algo deu errado</h2>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </div>
      ));
      
      return <Fallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
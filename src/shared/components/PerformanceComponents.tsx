import React from "react";

/**
 * Performance React Components
 * Optimized React components for performance
 */

// =============================================================================
// OPTIMIZED IMAGE COMPONENT
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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [shouldLoad, setShouldLoad] = React.useState(!lazy);

  React.useEffect(() => {
    if (!lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "50px" }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, shouldLoad]);

  return (
    <div ref={imgRef} className={className}>
      {shouldLoad ? (
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
            transition: "opacity 0.3s ease-in-out",
            ...props.style,
          }}
        />
      ) : (
        <img
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{ filter: "blur(2px)", ...props.style }}
        />
      )}
    </div>
  );
};

// =============================================================================
// ERROR BOUNDARY
// =============================================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PerformanceErrorBoundary extends React.Component<
  React.PropsWithChildren<{
    fallback?: React.ComponentType<{ error?: Error }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }>,
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
    console.error("Performance Error Boundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const Fallback =
        this.props.fallback ||
        (() => (
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

// =============================================================================
// VIRTUAL LIST COMPONENT
// =============================================================================

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  overscan = 5,
  className = "",
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleRange = React.useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(height / itemHeight);
    const end = Math.min(items.length, start + visibleCount + overscan * 2);

    return { start, end };
  }, [scrollTop, itemHeight, height, items.length, overscan]);

  const visibleItems = React.useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      className={className}
      style={{ height, overflow: "auto" }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SUSPENSE WRAPPER
// =============================================================================

interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error?: Error }>;
}

export const SuspenseWrapper: React.FC<SuspenseWrapperProps> = ({
  children,
  fallback = (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  ),
  errorFallback,
}) => {
  return (
    <PerformanceErrorBoundary fallback={errorFallback}>
      <React.Suspense fallback={fallback}>{children}</React.Suspense>
    </PerformanceErrorBoundary>
  );
};

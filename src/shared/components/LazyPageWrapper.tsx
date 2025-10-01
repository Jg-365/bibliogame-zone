import React, { Suspense, ComponentType } from "react";
import { motion } from "framer-motion";

// Loading component for pages
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      <p className="text-muted-foreground text-sm">Loading page...</p>
    </div>
  </div>
);

// Error boundary for lazy pages
class LazyPageErrorBoundary extends React.Component<
  { children: React.ReactNode; pageName: string },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; pageName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Failed to load {this.props.pageName}
            </h2>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper for lazy pages with error boundary and loading states
export const LazyPageWrapper = ({
  children,
  pageName,
}: {
  children: React.ReactNode;
  pageName: string;
}) => (
  <LazyPageErrorBoundary pageName={pageName}>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </LazyPageErrorBoundary>
);

// HOC to make any component lazy-loadable
export const withLazyLoading = <P extends Record<string, any> = {}>(
  Component: ComponentType<P>,
  componentName: string
) => {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }));

  const WrappedComponent = (props: P) => (
    <LazyPageWrapper pageName={componentName}>
      <LazyComponent {...(props as any)} />
    </LazyPageWrapper>
  );

  WrappedComponent.displayName = `withLazyLoading(${componentName})`;
  return WrappedComponent;
};

// Performance monitoring for page loads
export const usePageLoadPerformance = (pageName: string) => {
  React.useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const loadTime = endTime - startTime;

      // Log performance metrics (can be sent to analytics)
      console.log(`Page "${pageName}" loaded in ${loadTime.toFixed(2)}ms`);

      // Optional: Send to analytics service
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "page_load_time", {
          page_name: pageName,
          load_time: Math.round(loadTime),
        });
      }
    };
  }, [pageName]);
};

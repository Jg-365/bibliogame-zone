import React, { useState, useEffect } from "react";

interface BundleInfo {
  size: string;
  chunks: number;
  assets: number;
  loadTime: number;
}

export const BundleAnalysisDisplay: React.FC = () => {
  const [bundleInfo, setBundleInfo] =
    useState<BundleInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show bundle info only in development
    if (process.env.NODE_ENV !== "development") return;

    // Mock bundle analysis data
    const analyzeBundleSize = () => {
      const scripts =
        document.querySelectorAll("script[src]");
      const styles = document.querySelectorAll(
        'link[rel="stylesheet"]'
      );

      const navigationEntry = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      setBundleInfo({
        size: "2.1MB", // This would come from build analysis
        chunks: scripts.length,
        assets: scripts.length + styles.length,
        loadTime: navigationEntry?.loadEventEnd || 0,
      });
    };

    analyzeBundleSize();

    // Toggle with Ctrl+Shift+B
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "B") {
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  if (
    !isVisible ||
    !bundleInfo ||
    process.env.NODE_ENV !== "development"
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-blue-900/90 text-white p-3 rounded-lg text-sm font-mono z-50">
      <div className="flex flex-col gap-1">
        <div className="font-bold">Bundle Analysis</div>
        <div>Size: {bundleInfo.size}</div>
        <div>Chunks: {bundleInfo.chunks}</div>
        <div>Assets: {bundleInfo.assets}</div>
        <div>Load: {bundleInfo.loadTime.toFixed(0)}ms</div>
        <div className="text-xs opacity-70">
          Ctrl+Shift+B to toggle
        </div>
      </div>
    </div>
  );
};

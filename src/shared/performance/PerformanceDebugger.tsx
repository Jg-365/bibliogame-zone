import React, { useState, useEffect } from "react";

interface PerformanceData {
  fps: number;
  memory: number;
  loadTime: number;
  renderCount: number;
}

export const PerformanceDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceData, setPerformanceData] =
    useState<PerformanceData>({
      fps: 0,
      memory: 0,
      loadTime: 0,
      renderCount: 0,
    });

  useEffect(() => {
    // Show debugger only in development
    if (process.env.NODE_ENV !== "development") return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const updateFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(
          (frameCount * 1000) / (currentTime - lastTime)
        );

        setPerformanceData((prev) => ({
          ...prev,
          fps,
          memory:
            (performance as any).memory?.usedJSHeapSize /
              1024 /
              1024 || 0,
          renderCount: prev.renderCount + 1,
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    updateFPS();

    // Toggle debugger with Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setIsVisible((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationId);
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  if (
    !isVisible ||
    process.env.NODE_ENV !== "development"
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-3 rounded-lg text-sm font-mono z-50">
      <div className="flex flex-col gap-1">
        <div>FPS: {performanceData.fps}</div>
        <div>
          Memory: {performanceData.memory.toFixed(1)}MB
        </div>
        <div>Renders: {performanceData.renderCount}</div>
        <div className="text-xs opacity-70">
          Ctrl+Shift+D to toggle
        </div>
      </div>
    </div>
  );
};

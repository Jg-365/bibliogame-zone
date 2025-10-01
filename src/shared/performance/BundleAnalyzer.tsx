import React from "react";

/**
 * Bundle size analysis and optimization recommendations
 */
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  recommendations: string[];
}

/**
 * Hook to analyze bundle performance and provide optimization suggestions
 */
export const useBundleAnalysis = (): BundleAnalysis => {
  const [analysis, setAnalysis] = React.useState<BundleAnalysis>({
    totalSize: 0,
    gzippedSize: 0,
    chunks: [],
    recommendations: [],
  });

  React.useEffect(() => {
    // In a real implementation, this would integrate with webpack-bundle-analyzer
    // or similar tools. For now, we'll provide basic analysis

    const analyzeBundle = async () => {
      // Simulate bundle analysis
      const mockAnalysis: BundleAnalysis = {
        totalSize: 1024 * 1024 * 2.5, // 2.5MB
        gzippedSize: 1024 * 512, // 512KB
        chunks: [
          {
            name: "main",
            size: 1024 * 1024 * 1.8,
            modules: ["react", "react-dom", "framer-motion", "@tanstack/react-query"],
          },
          {
            name: "vendor",
            size: 1024 * 512,
            modules: ["supabase-js", "zod", "react-hook-form"],
          },
          {
            name: "components",
            size: 1024 * 200,
            modules: ["@/components/ui/*", "@/shared/components/*"],
          },
        ],
        recommendations: [
          "Consider lazy loading heavy components like Dashboard",
          "Split vendor libraries into separate chunks",
          "Implement tree shaking for unused exports",
          "Optimize images and use WebP format",
          "Enable gzip compression on server",
        ],
      };

      setAnalysis(mockAnalysis);
    };

    analyzeBundle();
  }, []);

  return analysis;
};

/**
 * Bundle optimization utilities
 */
export const BundleOptimizer = {
  /**
   * Analyze current bundle and provide recommendations
   */
  analyze: (): Promise<BundleAnalysis> => {
    return new Promise(resolve => {
      // Simulate async analysis
      setTimeout(() => {
        resolve({
          totalSize: 1024 * 1024 * 2.5,
          gzippedSize: 1024 * 512,
          chunks: [],
          recommendations: [
            "Implement code splitting for routes",
            "Use dynamic imports for heavy dependencies",
            "Optimize bundle with webpack-bundle-analyzer",
          ],
        });
      }, 1000);
    });
  },

  /**
   * Get size recommendations based on current bundle
   */
  getSizeRecommendations: (currentSize: number): string[] => {
    const recommendations: string[] = [];

    if (currentSize > 1024 * 1024 * 3) {
      // > 3MB
      recommendations.push("Bundle is too large (>3MB). Consider aggressive code splitting.");
    } else if (currentSize > 1024 * 1024 * 1.5) {
      // > 1.5MB
      recommendations.push(
        "Bundle is moderately large. Consider lazy loading non-critical components."
      );
    }

    if (currentSize > 1024 * 512) {
      // > 512KB
      recommendations.push("Enable gzip compression to reduce transfer size.");
    }

    return recommendations;
  },

  /**
   * Generate webpack configuration for optimal bundling
   */
  generateWebpackConfig: () => ({
    optimization: {
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
          common: {
            minChunks: 2,
            chunks: "all",
            enforce: true,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
    },
    resolve: {
      alias: {
        // Add aliases for better tree shaking
        lodash: "lodash-es",
      },
    },
  }),
};

/**
 * Component to display bundle analysis in development
 */
export const BundleAnalysisDisplay: React.FC = () => {
  const analysis = useBundleAnalysis();
  const [isVisible, setIsVisible] = React.useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    const kb = bytes / 1024;

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Toggle Bundle Analysis"
      >
        📊
      </button>

      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg p-4 max-w-lg max-h-96 overflow-auto">
          <h3 className="font-bold mb-4">Bundle Analysis</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Size Overview</h4>
              <div className="text-sm space-y-1">
                <div>Total: {formatSize(analysis.totalSize)}</div>
                <div>Gzipped: {formatSize(analysis.gzippedSize)}</div>
                <div className="text-green-600">
                  Compression: {((1 - analysis.gzippedSize / analysis.totalSize) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Chunks</h4>
              <div className="text-sm space-y-1">
                {analysis.chunks.map((chunk, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-2">
                    <div className="font-medium">{chunk.name}</div>
                    <div className="text-gray-600">{formatSize(chunk.size)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Performance budget checker
 */
export const usePerformanceBudget = (budget: {
  maxBundleSize: number;
  maxChunkSize: number;
  maxLoadTime: number;
}) => {
  const [violations, setViolations] = React.useState<string[]>([]);

  React.useEffect(() => {
    const checkBudget = async () => {
      const analysis = await BundleOptimizer.analyze();
      const newViolations: string[] = [];

      if (analysis.totalSize > budget.maxBundleSize) {
        newViolations.push(
          `Bundle size (${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB) exceeds budget (${(
            budget.maxBundleSize /
            1024 /
            1024
          ).toFixed(2)}MB)`
        );
      }

      analysis.chunks.forEach(chunk => {
        if (chunk.size > budget.maxChunkSize) {
          newViolations.push(
            `Chunk "${chunk.name}" (${(chunk.size / 1024).toFixed(2)}KB) exceeds budget (${(
              budget.maxChunkSize / 1024
            ).toFixed(2)}KB)`
          );
        }
      });

      setViolations(newViolations);
    };

    checkBudget();
  }, [budget]);

  return {
    violations,
    isWithinBudget: violations.length === 0,
  };
};

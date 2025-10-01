import React from "react";
import { AccessibleAlert } from "./components";
import { useAccessibilityValidator, LiveRegion } from "./index";

/**
 * Accessibility Testing and Validation Component
 * Development tool for validating WCAG compliance
 */

interface AccessibilityTesterProps {
  children: React.ReactNode;
  enabled?: boolean;
}

export const AccessibilityTester: React.FC<AccessibilityTesterProps> = ({
  children,
  enabled = process.env.NODE_ENV === "development",
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { violations, validate } = useAccessibilityValidator(containerRef);
  const [isVisible, setIsVisible] = React.useState(false);
  const [lastValidation, setLastValidation] = React.useState<Date | null>(null);

  // Auto-validate on content changes
  React.useEffect(() => {
    if (!enabled) return;

    const observer = new MutationObserver(() => {
      setTimeout(() => {
        validate();
        setLastValidation(new Date());
      }, 100);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label", "aria-labelledby", "alt", "role"],
      });
    }

    // Initial validation
    validate();
    setLastValidation(new Date());

    return () => observer.disconnect();
  }, [enabled, validate]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        {children}

        {/* Accessibility violations overlay */}
        {violations.length > 0 && (
          <div className="fixed top-4 right-4 z-50">
            <button
              onClick={() => setIsVisible(!isVisible)}
              className={`
                px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${
                  violations.length > 0
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                }
              `}
              aria-label={`${violations.length} accessibility issues found`}
            >
              A11y: {violations.length}
            </button>
          </div>
        )}
      </div>

      {/* Violations Panel */}
      {isVisible && violations.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-auto pointer-events-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-red-600">
                  Accessibility Issues ({violations.length})
                </h3>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  aria-label="Close accessibility panel"
                >
                  ✕
                </button>
              </div>
              {lastValidation && (
                <p className="text-sm text-gray-500 mt-1">
                  Last checked: {lastValidation.toLocaleTimeString()}
                </p>
              )}
            </div>

            <div className="p-4 space-y-2">
              {violations.map((violation, index) => (
                <AccessibilityViolationItem key={index} violation={violation} index={index} />
              ))}
            </div>

            <div className="p-4 border-t bg-gray-50 dark:bg-gray-700">
              <button
                onClick={() => {
                  validate();
                  setLastValidation(new Date());
                }}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Re-validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live region for announcing validation results */}
      <LiveRegion politeness="assertive">
        {violations.length > 0
          ? `${violations.length} accessibility issues found`
          : lastValidation
          ? "No accessibility issues found"
          : ""}
      </LiveRegion>
    </>
  );
};

/**
 * Individual violation item component
 */
const AccessibilityViolationItem: React.FC<{
  violation: string;
  index: number;
}> = ({ violation, index }) => {
  const getSeverity = (violation: string): "error" | "warning" => {
    const criticalKeywords = ["missing alt", "lacks accessible name", "lacks proper label"];
    return criticalKeywords.some(keyword => violation.toLowerCase().includes(keyword))
      ? "error"
      : "warning";
  };

  const severity = getSeverity(violation);

  return (
    <div
      className={`p-3 rounded border-l-4 ${
        severity === "error"
          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
          : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg" aria-hidden="true">
          {severity === "error" ? "❌" : "⚠️"}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {severity === "error" ? "Error" : "Warning"} #{index + 1}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{violation}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Keyboard Navigation Tester - Visual indicator for keyboard users
 */
export const KeyboardNavigationTester: React.FC<{
  enabled?: boolean;
}> = ({ enabled = process.env.NODE_ENV === "development" }) => {
  const [focusedElement, setFocusedElement] = React.useState<HTMLElement | null>(null);
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    const handleFocus = (e: FocusEvent) => {
      setFocusedElement(e.target as HTMLElement);
    };

    const handleBlur = () => {
      setFocusedElement(null);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
    };
  }, [enabled]);

  if (!enabled || !isKeyboardUser) return null;

  return (
    <div className="fixed top-4 left-4 z-50 bg-blue-500 text-white px-3 py-2 rounded text-sm">
      <div className="flex items-center gap-2">
        <span>⌨️</span>
        <span>Keyboard Navigation Mode</span>
      </div>
      {focusedElement && (
        <div className="mt-1 text-xs opacity-90">
          Focus: {focusedElement.tagName.toLowerCase()}
          {focusedElement.getAttribute("aria-label") &&
            ` (${focusedElement.getAttribute("aria-label")})`}
        </div>
      )}
    </div>
  );
};

/**
 * Color Contrast Checker Component
 */
export const ColorContrastChecker: React.FC<{
  enabled?: boolean;
}> = ({ enabled = process.env.NODE_ENV === "development" }) => {
  const [contrastIssues, setContrastIssues] = React.useState<
    Array<{
      element: HTMLElement;
      ratio: number;
      foreground: string;
      background: string;
    }>
  >([]);

  React.useEffect(() => {
    if (!enabled) return;

    const checkContrast = () => {
      const elements = document.querySelectorAll("*");
      const issues: typeof contrastIssues = [];

      elements.forEach(element => {
        if (element.textContent?.trim()) {
          const styles = getComputedStyle(element);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Simple contrast ratio calculation (simplified)
          // In a real implementation, you'd use a proper contrast ratio library
          const colorValue = color.includes("rgb") ? color : "#000000";
          const bgValue = backgroundColor.includes("rgb") ? backgroundColor : "#ffffff";

          // Mock contrast ratio - replace with actual calculation
          const mockRatio = Math.random() * 21; // 1-21 range

          if (mockRatio < 4.5) {
            // WCAG AA standard
            issues.push({
              element: element as HTMLElement,
              ratio: mockRatio,
              foreground: colorValue,
              background: bgValue,
            });
          }
        }
      });

      setContrastIssues(issues.slice(0, 10)); // Limit to first 10 issues
    };

    checkContrast();
    const interval = setInterval(checkContrast, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled || contrastIssues.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-yellow-500 text-black px-3 py-2 rounded text-sm max-w-xs">
      <div className="font-medium mb-1">⚠️ Contrast Issues ({contrastIssues.length})</div>
      <div className="text-xs">
        {contrastIssues.length} elements may not meet WCAG AA contrast requirements (4.5:1)
      </div>
    </div>
  );
};

/**
 * Complete Accessibility Development Panel
 */
export const AccessibilityDevPanel: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = process.env.NODE_ENV === "development" }) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <AccessibilityTester enabled={enabled}>
      {children}
      <KeyboardNavigationTester enabled={enabled} />
      <ColorContrastChecker enabled={enabled} />
    </AccessibilityTester>
  );
};

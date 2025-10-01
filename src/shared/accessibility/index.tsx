import React from "react";

/**
 * WCAG 2.1 AA Accessibility Utilities
 * Comprehensive toolkit for ensuring accessibility compliance
 */

// =============================================================================
// ARIA UTILITIES
// =============================================================================

/**
 * Hook for managing ARIA announcements for screen readers
 */
export const useAnnouncer = () => {
  const [announcement, setAnnouncement] = React.useState("");
  const announcerRef = React.useRef<HTMLDivElement>(null);

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      setAnnouncement(message);

      // Clear after announcement to allow re-announcements of the same message
      setTimeout(() => setAnnouncement(""), 1000);

      // Update aria-live region priority
      if (announcerRef.current) {
        announcerRef.current.setAttribute("aria-live", priority);
      }
    },
    []
  );

  const AnnouncerComponent = React.useCallback(
    () => (
      <div
        ref={announcerRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcement}
      </div>
    ),
    [announcement]
  ) as React.FC;

  return { announce, AnnouncerComponent };
};

// =============================================================================
// KEYBOARD NAVIGATION UTILITIES
// =============================================================================

/**
 * Hook for managing keyboard navigation within a container
 */
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: {
    focusableSelector?: string;
    loop?: boolean;
    autoFocus?: boolean;
  } = {}
) => {
  const {
    focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    loop = true,
    autoFocus = false,
  } = options;

  const getCurrentFocusableElements = React.useCallback(() => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll(focusableSelector)) as HTMLElement[];
  }, [containerRef, focusableSelector]);

  const focusFirst = React.useCallback(() => {
    const elements = getCurrentFocusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }
  }, [getCurrentFocusableElements]);

  const focusLast = React.useCallback(() => {
    const elements = getCurrentFocusableElements();
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getCurrentFocusableElements]);

  const focusNext = React.useCallback(() => {
    const elements = getCurrentFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    } else if (loop && elements.length > 0) {
      elements[0].focus();
    }
  }, [getCurrentFocusableElements, loop]);

  const focusPrevious = React.useCallback(() => {
    const elements = getCurrentFocusableElements();
    const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

    if (currentIndex > 0) {
      elements[currentIndex - 1].focus();
    } else if (loop && elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }, [getCurrentFocusableElements, loop]);

  React.useEffect(() => {
    if (autoFocus) {
      focusFirst();
    }
  }, [autoFocus, focusFirst]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getCurrentFocusableElements,
  };
};

/**
 * Hook for handling escape key to close modals/dropdowns
 */
export const useEscapeKey = (callback: () => void, isActive: boolean = true) => {
  React.useEffect(() => {
    if (!isActive) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [callback, isActive]);
};

// =============================================================================
// FOCUS MANAGEMENT
// =============================================================================

/**
 * Hook for managing focus trapping within a modal or dialog
 */
export const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement>) => {
  const { focusFirst, focusLast, getCurrentFocusableElements } =
    useKeyboardNavigation(containerRef);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isActive) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus the first element in the trap
    focusFirst();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusableElements = getCurrentFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab - moving backwards
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab - moving forwards
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus to the previously focused element
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, focusFirst, getCurrentFocusableElements]);
};

/**
 * Hook for managing focus indicators and visibility
 */
export const useFocusVisible = () => {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

// =============================================================================
// SCREEN READER UTILITIES
// =============================================================================

/**
 * Component for providing screen reader only text
 */
export const ScreenReaderOnly: React.FC<{
  children: React.ReactNode;
  id?: string;
  className?: string;
}> = ({ children, id, className }) => (
  <span id={id} className={`sr-only ${className || ""}`}>
    {children}
  </span>
);

// =============================================================================
// COLOR AND CONTRAST UTILITIES
// =============================================================================

/**
 * Hook for managing high contrast mode detection
 */
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");

    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isHighContrast;
};

/**
 * Hook for managing reduced motion preferences
 */
export const useReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    setShouldReduceMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return shouldReduceMotion;
};

// =============================================================================
// ARIA LIVE REGIONS
// =============================================================================

/**
 * Component for creating ARIA live regions for dynamic content
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  politeness?: "polite" | "assertive" | "off";
  atomic?: boolean;
  relevant?: "additions" | "removals" | "text" | "all";
  className?: string;
}> = ({
  children,
  politeness = "polite",
  atomic = true,
  relevant = "all",
  className = "sr-only",
}) => (
  <div
    aria-live={politeness}
    aria-atomic={atomic}
    aria-relevant={relevant}
    className={className}
    role="status"
  >
    {children}
  </div>
);

// =============================================================================
// ACCESSIBILITY VALIDATION
// =============================================================================

/**
 * Hook for validating accessibility requirements
 */
export const useAccessibilityValidator = (elementRef: React.RefObject<HTMLElement>) => {
  const [violations, setViolations] = React.useState<string[]>([]);

  const validate = React.useCallback(() => {
    if (!elementRef.current) return;

    const newViolations: string[] = [];
    const element = elementRef.current;

    // Check for missing alt text on images
    const images = element.querySelectorAll("img");
    images.forEach((img, index) => {
      if (!img.getAttribute("alt") && img.getAttribute("alt") !== "") {
        newViolations.push(`Image ${index + 1} is missing alt text`);
      }
    });

    // Check for proper heading hierarchy
    const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let lastHeadingLevel = 0;
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > lastHeadingLevel + 1) {
        newViolations.push(`Heading level ${level} skips levels (heading ${index + 1})`);
      }
      lastHeadingLevel = level;
    });

    // Check for buttons without accessible names
    const buttons = element.querySelectorAll("button");
    buttons.forEach((button, index) => {
      const hasAccessibleName =
        button.textContent?.trim() ||
        button.getAttribute("aria-label") ||
        button.getAttribute("aria-labelledby") ||
        button.querySelector("img")?.getAttribute("alt");

      if (!hasAccessibleName) {
        newViolations.push(`Button ${index + 1} lacks accessible name`);
      }
    });

    // Check for form inputs without labels
    const inputs = element.querySelectorAll("input, select, textarea");
    inputs.forEach((input, index) => {
      const hasLabel =
        input.getAttribute("aria-label") ||
        input.getAttribute("aria-labelledby") ||
        element.querySelector(`label[for="${input.id}"]`) ||
        input.closest("label");

      if (!hasLabel) {
        newViolations.push(`Form input ${index + 1} lacks proper label`);
      }
    });

    setViolations(newViolations);
    return newViolations;
  }, [elementRef]);

  return { violations, validate };
};

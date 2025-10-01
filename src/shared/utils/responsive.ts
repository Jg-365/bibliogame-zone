import React from "react";

/**
 * Universal Responsive System for BiblioGame Zone
 * Provides consistent breakpoints, spacing, and responsive utilities
 */

// =============================================================================
// BREAKPOINTS AND CONSTANTS
// =============================================================================

export const BREAKPOINTS = {
  xs: 320, // Small phones
  sm: 480, // Large phones
  md: 768, // Tablets portrait
  lg: 1024, // Tablets landscape / Small desktop
  xl: 1200, // Desktop
  "2xl": 1920, // Large desktop
} as const;

export const BREAKPOINT_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.xs}px)`,
  sm: `(max-width: ${BREAKPOINTS.sm}px)`,
  md: `(max-width: ${BREAKPOINTS.md}px)`,
  lg: `(max-width: ${BREAKPOINTS.lg}px)`,
  xl: `(max-width: ${BREAKPOINTS.xl}px)`,
  "2xl": `(min-width: ${BREAKPOINTS["2xl"]}px)`,
  "md-up": `(min-width: ${BREAKPOINTS.md + 1}px)`,
  "lg-up": `(min-width: ${BREAKPOINTS.lg + 1}px)`,
  "xl-up": `(min-width: ${BREAKPOINTS.xl + 1}px)`,
} as const;

// =============================================================================
// RESPONSIVE HOOKS
// =============================================================================

/**
 * Universal responsive hook with comprehensive breakpoint detection
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { width } = screenSize;

  // Device type detection
  const isMobile = width <= BREAKPOINTS.md;
  const isTablet = width > BREAKPOINTS.md && width <= BREAKPOINTS.lg;
  const isDesktop = width > BREAKPOINTS.lg;

  // Specific breakpoints
  const isXs = width <= BREAKPOINTS.xs;
  const isSm = width <= BREAKPOINTS.sm && width > BREAKPOINTS.xs;
  const isMd = width <= BREAKPOINTS.md && width > BREAKPOINTS.sm;
  const isLg = width <= BREAKPOINTS.lg && width > BREAKPOINTS.md;
  const isXl = width <= BREAKPOINTS.xl && width > BREAKPOINTS.lg;
  const is2Xl = width > BREAKPOINTS.xl;

  // Grid system
  const getColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    if (width <= BREAKPOINTS.xl) return 3;
    return 4;
  };

  // Spacing system
  const getSpacing = () => {
    if (isMobile) return "sm";
    if (isTablet) return "md";
    return "lg";
  };

  // Typography scale
  const getFontSize = () => {
    if (isMobile) return "sm";
    if (isTablet) return "base";
    return "lg";
  };

  return {
    // Screen dimensions
    screenSize,

    // Device types
    isMobile,
    isTablet,
    isDesktop,

    // Specific breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,

    // Responsive utilities
    columns: getColumns(),
    spacing: getSpacing(),
    fontSize: getFontSize(),

    // Helper functions
    getColumns,
    getSpacing,
    getFontSize,
  };
};

/**
 * Hook for media query matching
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial state
    setMatches(media.matches);

    // Listen for changes
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

/**
 * Hook for responsive values based on breakpoints
 */
export const useBreakpointValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  "2xl"?: T;
  base?: T;
}): T => {
  const { isXs, isSm, isMd, isLg, isXl, is2Xl } = useResponsive();

  if (is2Xl && values["2xl"] !== undefined) return values["2xl"];
  if (isXl && values.xl !== undefined) return values.xl;
  if (isLg && values.lg !== undefined) return values.lg;
  if (isMd && values.md !== undefined) return values.md;
  if (isSm && values.sm !== undefined) return values.sm;
  if (isXs && values.xs !== undefined) return values.xs;

  return values.base as T;
};

// =============================================================================
// RESPONSIVE UTILITIES
// =============================================================================

/**
 * Get responsive classes based on screen size
 */
export const getResponsiveClasses = {
  container: (responsive: ReturnType<typeof useResponsive>) => {
    const { isMobile, isTablet } = responsive;
    return `
      ${isMobile ? "px-4 py-2" : ""}
      ${isTablet ? "px-6 py-4" : ""}
      ${!isMobile && !isTablet ? "px-8 py-6" : ""}
    `.trim();
  },

  grid: (responsive: ReturnType<typeof useResponsive>) => {
    const { columns } = responsive;
    return `grid grid-cols-${columns} gap-${
      responsive.spacing === "sm" ? "4" : responsive.spacing === "md" ? "6" : "8"
    }`;
  },

  text: (responsive: ReturnType<typeof useResponsive>) => {
    const { fontSize } = responsive;
    return `text-${fontSize}`;
  },

  spacing: (responsive: ReturnType<typeof useResponsive>) => {
    const { spacing } = responsive;
    return {
      sm: "space-y-2",
      md: "space-y-4",
      lg: "space-y-6",
    }[spacing];
  },
};

/**
 * Touch target utilities for mobile accessibility
 */
export const getTouchTargetClasses = (isMobile: boolean) => {
  return isMobile ? "min-h-[44px] min-w-[44px]" : "";
};

/**
 * Safe area utilities for mobile devices
 */
export const getSafeAreaClasses = () => {
  return "pb-safe-area-inset-bottom pl-safe-area-inset-left pr-safe-area-inset-right";
};

// =============================================================================
// RESPONSIVE HOOKS FOR SPECIFIC USE CASES
// =============================================================================

/**
 * Hook for responsive navigation
 */
export const useResponsiveNavigation = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    isMobileNav: isMobile,
    showHamburger: isMobile,
    showSidebar: !isMobile && !isTablet,
    showBottomNav: isMobile,
    navItemsVisible: isMobile ? 4 : isTablet ? 6 : 8,
  };
};

/**
 * Hook for responsive modal behavior
 */
export const useResponsiveModal = () => {
  const { isMobile } = useResponsive();

  return {
    isFullscreen: isMobile,
    maxWidth: isMobile ? "100vw" : "80vw",
    maxHeight: isMobile ? "100vh" : "80vh",
    position: isMobile ? "fixed" : "fixed",
    inset: isMobile ? "0" : "auto",
    padding: isMobile ? "0" : "1rem",
  };
};

/**
 * Hook for responsive table behavior
 */
export const useResponsiveTable = () => {
  const { isMobile, isTablet } = useResponsive();

  return {
    shouldStack: isMobile,
    shouldScroll: isTablet,
    visibleColumns: isMobile ? 2 : isTablet ? 4 : 6,
    showPagination: !isMobile,
    itemsPerPage: isMobile ? 5 : isTablet ? 10 : 20,
  };
};

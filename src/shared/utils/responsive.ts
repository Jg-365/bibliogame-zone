import { useState, useEffect } from "react";

// Breakpoints configuration
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

// Media queries
export const MEDIA_QUERIES = {
  mobile: `(max-width: ${BREAKPOINTS.mobile - 1}px)`,
  tablet: `(min-width: ${
    BREAKPOINTS.mobile
  }px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`,
  desktop: `(min-width: ${BREAKPOINTS.tablet}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
} as const;

// Hook for responsive behavior
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width:
      typeof window !== "undefined"
        ? window.innerWidth
        : 1024,
    height:
      typeof window !== "undefined"
        ? window.innerHeight
        : 768,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = screenSize.width < BREAKPOINTS.mobile;
  const isTablet =
    screenSize.width >= BREAKPOINTS.mobile &&
    screenSize.width < BREAKPOINTS.tablet;
  const isDesktop = screenSize.width >= BREAKPOINTS.tablet;
  const isWide = screenSize.width >= BREAKPOINTS.wide;

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    // Alias for common usage
    breakpoint: isMobile
      ? "mobile"
      : isTablet
      ? "tablet"
      : isDesktop
      ? "desktop"
      : "wide",
    // Grid columns based on screen size
    columns: isMobile
      ? 1
      : isTablet
      ? 2
      : isDesktop
      ? 3
      : 4,
  };
};

// Hook for responsive values
export const useBreakpointValue = <T>(values: {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
  default: T;
}): T => {
  const { isMobile, isTablet, isDesktop, isWide } =
    useResponsive();

  if (isWide && values.wide !== undefined)
    return values.wide;
  if (isDesktop && values.desktop !== undefined)
    return values.desktop;
  if (isTablet && values.tablet !== undefined)
    return values.tablet;
  if (isMobile && values.mobile !== undefined)
    return values.mobile;

  return values.default;
};

// Utility for touch target classes
export const getTouchTargetClasses = (
  size: "sm" | "md" | "lg" = "md"
) => {
  const sizeMap = {
    sm: "min-h-[32px] min-w-[32px]",
    md: "min-h-[44px] min-w-[44px]",
    lg: "min-h-[56px] min-w-[56px]",
  };

  return `${sizeMap[size]} touch-manipulation`;
};

// Utility for responsive padding/margin
export const getResponsiveSpacing = (
  mobile: string,
  desktop?: string
) => {
  const { isMobile } = useResponsive();
  return isMobile ? mobile : desktop || mobile;
};

// Check if device supports hover
export const useHoverSupport = () => {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover)").matches
  );
};

// Check if device supports touch
export const useTouchSupport = () => {
  return (
    typeof window !== "undefined" &&
    ("ontouchstart" in window ||
      navigator.maxTouchPoints > 0)
  );
};

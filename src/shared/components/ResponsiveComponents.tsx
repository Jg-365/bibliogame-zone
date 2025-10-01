import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive, useBreakpointValue, getTouchTargetClasses } from "../utils/responsive";

/**
 * Responsive Components for BiblioGame Zone
 * Universal components that adapt to all screen sizes
 */

// =============================================================================
// RESPONSIVE CONTAINER
// =============================================================================

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = "",
  maxWidth = "xl",
  padding = true,
}) => {
  const { isMobile, isTablet } = useResponsive();

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    full: "max-w-full",
  };

  const paddingClasses = padding
    ? `${isMobile ? "px-4 py-2" : isTablet ? "px-6 py-4" : "px-8 py-6"}`
    : "";

  return (
    <div className={cn("mx-auto w-full", maxWidthClasses[maxWidth], paddingClasses, className)}>
      {children}
    </div>
  );
};

// =============================================================================
// RESPONSIVE GRID
// =============================================================================

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = "",
  columns,
  gap = "md",
}) => {
  const { columns: defaultColumns } = useResponsive();

  const responsiveColumns = columns
    ? useBreakpointValue({ base: defaultColumns, ...columns })
    : defaultColumns;

  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  return (
    <div
      className={cn(
        "grid",
        `grid-cols-${Math.min(responsiveColumns, 12)}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

// =============================================================================
// RESPONSIVE TEXT
// =============================================================================

interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "small" | "caption";
  responsive?: boolean;
  weight?: "normal" | "medium" | "semibold" | "bold";
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className = "",
  variant = "body",
  responsive = true,
  weight = "normal",
}) => {
  const { isMobile, isTablet } = useResponsive();

  const getVariantClasses = () => {
    if (!responsive) {
      return {
        h1: "text-4xl",
        h2: "text-3xl",
        h3: "text-2xl",
        h4: "text-xl",
        body: "text-base",
        small: "text-sm",
        caption: "text-xs",
      }[variant];
    }

    // Responsive variants
    const variants = {
      h1: isMobile ? "text-2xl" : isTablet ? "text-3xl" : "text-4xl",
      h2: isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl",
      h3: isMobile ? "text-lg" : isTablet ? "text-xl" : "text-2xl",
      h4: isMobile ? "text-base" : isTablet ? "text-lg" : "text-xl",
      body: isMobile ? "text-sm" : "text-base",
      small: "text-xs",
      caption: "text-xs",
    };

    return variants[variant];
  };

  const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const Component = variant.startsWith("h") ? (variant as keyof JSX.IntrinsicElements) : "p";

  return React.createElement(
    Component,
    {
      className: cn(getVariantClasses(), weightClasses[weight], className),
    },
    children
  );
};

// =============================================================================
// RESPONSIVE BUTTON
// =============================================================================

interface ResponsiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) => {
  const { isMobile } = useResponsive();

  const variants = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2 text-sm",
    lg: "h-11 px-8 text-base",
    xl: "h-12 px-10 text-lg",
  };

  const mobileSize = isMobile && size === "sm" ? "md" : size;
  const touchTargetClass = getTouchTargetClasses(isMobile);

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "ring-offset-background transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[mobileSize],
        touchTargetClass,
        fullWidth && "w-full",
        loading && "cursor-not-allowed opacity-70",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// =============================================================================
// RESPONSIVE CARD
// =============================================================================

interface ResponsiveCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  className = "",
  padding = "md",
  hover = false,
  clickable = false,
  onClick,
}) => {
  const { isMobile } = useResponsive();

  const paddingClasses = {
    none: "",
    sm: isMobile ? "p-3" : "p-4",
    md: isMobile ? "p-4" : "p-6",
    lg: isMobile ? "p-6" : "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        paddingClasses[padding],
        hover && "transition-shadow hover:shadow-lg",
        clickable && "cursor-pointer transition-all hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
};

// =============================================================================
// RESPONSIVE MODAL
// =============================================================================

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = "",
  size = "md",
}) => {
  const { isMobile } = useResponsive();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: isMobile ? "max-w-full" : "max-w-md",
    md: isMobile ? "max-w-full" : "max-w-lg",
    lg: isMobile ? "max-w-full" : "max-w-2xl",
    xl: isMobile ? "max-w-full" : "max-w-4xl",
    full: "max-w-full",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full bg-background shadow-lg",
          isMobile ? "h-full" : "max-h-[90vh] rounded-lg",
          sizes[size],
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div
            className={cn("flex items-center justify-between border-b", isMobile ? "p-4" : "p-6")}
          >
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "rounded-sm opacity-70 ring-offset-background transition-opacity",
                "hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                getTouchTargetClasses(isMobile)
              )}
              aria-label="Close modal"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto", isMobile ? "p-4" : "p-6")}>{children}</div>
      </div>
    </div>
  );
};

// =============================================================================
// RESPONSIVE TABLE
// =============================================================================

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  stackOnMobile?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  children,
  className = "",
  stackOnMobile = true,
}) => {
  const { isMobile } = useResponsive();

  if (isMobile && stackOnMobile) {
    return <div className={cn("space-y-4", className)}>{children}</div>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="min-w-full divide-y divide-border">{children}</table>
    </div>
  );
};

// =============================================================================
// RESPONSIVE NAVIGATION
// =============================================================================

interface ResponsiveNavigationProps {
  children: React.ReactNode;
  className?: string;
  variant?: "horizontal" | "vertical" | "bottom";
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  children,
  className = "",
  variant = "horizontal",
}) => {
  const { isMobile } = useResponsive();

  const variants = {
    horizontal: cn("flex", isMobile ? "flex-col space-y-2" : "flex-row space-x-4"),
    vertical: "flex flex-col space-y-2",
    bottom: cn(
      "fixed bottom-0 left-0 right-0 z-40",
      "flex items-center justify-around",
      "bg-background border-t p-2",
      getSafeAreaClasses()
    ),
  };

  return <nav className={cn(variants[variant], className)}>{children}</nav>;
};

// =============================================================================
// RESPONSIVE INPUT
// =============================================================================

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = "",
  id,
  ...props
}) => {
  const { isMobile } = useResponsive();
  const inputId = id || `input-${React.useId()}`;

  return (
    <div className={cn("space-y-2", fullWidth && "w-full")}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block font-medium",
            isMobile ? "text-sm" : "text-base",
            error ? "text-destructive" : "text-foreground"
          )}
        >
          {label}
        </label>
      )}

      <input
        id={inputId}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2",
          "text-sm ring-offset-background file:border-0 file:bg-transparent",
          "file:text-sm file:font-medium placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isMobile && "min-h-[44px] text-base", // Larger touch targets on mobile
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        {...props}
      />

      {helperText && !error && (
        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
          {helperText}
        </p>
      )}

      {error && <p className={cn("text-destructive", isMobile ? "text-xs" : "text-sm")}>{error}</p>}
    </div>
  );
};

// =============================================================================
// UTILITIES
// =============================================================================

const getSafeAreaClasses = () => {
  return "pb-safe-area-inset-bottom pl-safe-area-inset-left pr-safe-area-inset-right";
};

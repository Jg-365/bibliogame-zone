import React from "react";

/**
 * Accessibility React Components
 * WCAG 2.1 AA compliant React components
 */

// =============================================================================
// ACCESSIBILITY COMPONENTS
// =============================================================================

/**
 * Skip link for keyboard navigation
 */
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children,
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  >
    {children}
  </a>
);

/**
 * Visually hidden text for screen readers
 */
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

/**
 * Live region for dynamic content announcements
 */
export const LiveRegion: React.FC<{
  children: React.ReactNode;
  level?: "polite" | "assertive";
  atomic?: boolean;
}> = ({ children, level = "polite", atomic = true }) => (
  <div aria-live={level} aria-atomic={atomic} className="sr-only">
    {children}
  </div>
);

/**
 * Focus trap container for modals and dialogs
 */
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  active: boolean;
  className?: string;
}> = ({ children, active, className = "" }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        // Shift + Tab: moving backwards
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab: moving forwards
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [active]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

/**
 * Heading component with proper hierarchy
 */
export const Heading: React.FC<{
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ level, children, className = "", id }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  );
};

/**
 * Landmark region component
 */
export const Landmark: React.FC<{
  role: "main" | "navigation" | "banner" | "contentinfo" | "complementary" | "region";
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ role, children, className = "", ...ariaProps }) => (
  <section role={role} className={className} {...ariaProps}>
    {children}
  </section>
);

/**
 * Accessible button with loading and disabled states
 */
export const AccessibleButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
}> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  ...ariaProps
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={className}
    aria-disabled={disabled || loading}
    {...ariaProps}
  >
    {loading && <VisuallyHidden>Carregando... </VisuallyHidden>}
    {children}
  </button>
);

/**
 * Progress indicator with accessibility
 */
export const AccessibleProgress: React.FC<{
  value: number;
  max?: number;
  label?: string;
  valuetext?: string;
  className?: string;
}> = ({ value, max = 100, label, valuetext, className = "" }) => {
  const percentage = Math.round((value / max) * 100);
  const defaultValueText = `${percentage} por cento`;

  return (
    <div className={className}>
      {label && <div className="mb-2 text-sm font-medium">{label}</div>}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valuetext || defaultValueText}
        aria-label={label}
        className="w-full bg-secondary rounded-full h-3"
      >
        <div
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Status message for screen readers
 */
export const StatusMessage: React.FC<{
  type: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
  className?: string;
}> = ({ type, children, className = "" }) => {
  const typeConfig = {
    success: { role: "status", icon: "✓" },
    error: { role: "alert", icon: "✗" },
    warning: { role: "alert", icon: "⚠" },
    info: { role: "status", icon: "ℹ" },
  };

  const config = typeConfig[type];

  return (
    <div role={config.role} className={className}>
      <VisuallyHidden>
        {type === "success" && "Sucesso: "}
        {type === "error" && "Erro: "}
        {type === "warning" && "Aviso: "}
        {type === "info" && "Informação: "}
      </VisuallyHidden>
      <span aria-hidden="true" className="mr-2">
        {config.icon}
      </span>
      {children}
    </div>
  );
};

import React from "react";
import { cn } from "@/lib/utils";
import {
  useKeyboardNavigation,
  useFocusTrap,
  useEscapeKey,
  ScreenReaderOnly,
  LiveRegion,
  useAnnouncer,
} from "../accessibility";

/**
 * Accessible Button Component with comprehensive WCAG compliance
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = "primary",
  size = "default",
  loading = false,
  loadingText = "Loading",
  className,
  children,
  disabled,
  ...props
}) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const variants = {
    primary: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
    ghost: "bg-transparent hover:bg-accent hover:text-accent-foreground focus:ring-accent",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
  };

  const sizes = {
    sm: "h-8 px-3 text-sm",
    default: "h-10 px-4 py-2",
    lg: "h-12 px-8 text-lg",
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={loading ? `${props.id || "button"}-loading` : undefined}
      {...props}
    >
      {loading && (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
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
          <ScreenReaderOnly id={`${props.id || "button"}-loading`}>{loadingText}</ScreenReaderOnly>
        </>
      )}
      {loading ? loadingText : children}
    </button>
  );
};

/**
 * Accessible Modal/Dialog Component with focus trapping
 */
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const { announce } = useAnnouncer();

  // Focus trap management
  useFocusTrap(isOpen, modalRef);

  // Escape key handling
  useEscapeKey(onClose, isOpen);

  // Announce modal opening/closing
  React.useEffect(() => {
    if (isOpen) {
      announce(`Dialog opened: ${title}`, "assertive");
    } else {
      announce("Dialog closed", "polite");
    }
  }, [isOpen, title, announce]);

  // Prevent body scroll when modal is open
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className={cn(
          "relative bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6",
          "transform transition-all duration-200",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Close dialog"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {description && (
          <p id="modal-description" className="text-muted-foreground mb-4">
            {description}
          </p>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
};

/**
 * Accessible Form Input with proper labeling and error handling
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  label,
  error,
  helperText,
  required,
  id,
  className,
  ...props
}) => {
  const inputId = id || `input-${React.useId()}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={cn("block text-sm font-medium", error ? "text-destructive" : "text-foreground")}
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        className={cn(
          "w-full px-3 py-2 border rounded-md shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          error
            ? "border-destructive focus:ring-destructive"
            : "border-input focus:ring-purple-500",
          className
        )}
        aria-invalid={!!error}
        aria-describedby={cn(error && errorId, helperText && helperId).trim() || undefined}
        {...props}
      />

      {helperText && (
        <p id={helperId} className="text-sm text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

/**
 * Accessible Skip Link Component
 */
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ href, children }) => (
  <a
    href={href}
    className={cn(
      "sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0",
      "z-50 p-2 bg-purple-600 text-white font-medium",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    )}
  >
    {children}
  </a>
);

/**
 * Accessible Navigation Menu with keyboard support
 */
interface AccessibleMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "left" | "right";
}

export const AccessibleMenu: React.FC<AccessibleMenuProps> = ({
  trigger,
  children,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const { focusFirst } = useKeyboardNavigation(menuRef);
  useEscapeKey(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, isOpen);

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusFirst();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, focusFirst]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={e => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="focus:outline-none focus:ring-2 focus:ring-purple-500"
      >
        {trigger}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />

          {/* Menu */}
          <div
            ref={menuRef}
            role="menu"
            className={cn(
              "absolute z-20 mt-1 w-48 bg-background border rounded-md shadow-lg",
              "focus:outline-none",
              align === "right" ? "right-0" : "left-0"
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Accessible Menu Item
 */
interface AccessibleMenuItemProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const AccessibleMenuItem: React.FC<AccessibleMenuItemProps> = ({
  onClick,
  disabled,
  children,
}) => (
  <button
    role="menuitem"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full text-left px-4 py-2 text-sm hover:bg-accent",
      "focus:outline-none focus:bg-accent",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "first:rounded-t-md last:rounded-b-md"
    )}
  >
    {children}
  </button>
);

/**
 * Accessible Status/Alert Component
 */
interface AccessibleAlertProps {
  variant?: "info" | "warning" | "error" | "success";
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const AccessibleAlert: React.FC<AccessibleAlertProps> = ({
  variant = "info",
  title,
  children,
  dismissible,
  onDismiss,
}) => {
  const alertRef = React.useRef<HTMLDivElement>(null);

  const variants = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    error: "bg-red-50 text-red-800 border-red-200",
    success: "bg-green-50 text-green-800 border-green-200",
  };

  const icons = {
    info: "ℹ️",
    warning: "⚠️",
    error: "❌",
    success: "✅",
  };

  return (
    <div ref={alertRef} role="alert" className={cn("border rounded-md p-4", variants[variant])}>
      <div className="flex items-start">
        <span className="mr-2 text-lg" aria-hidden="true">
          {icons[variant]}
        </span>

        <div className="flex-1">
          {title && <h4 className="font-medium mb-1">{title}</h4>}
          <div>{children}</div>
        </div>

        {dismissible && (
          <button
            onClick={onDismiss}
            className="ml-2 hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
            aria-label="Dismiss alert"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

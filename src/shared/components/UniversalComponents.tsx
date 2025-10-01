import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useResponsive } from "../utils/responsive";

/**
 * Universal Components - Consolidated and optimized components
 * Eliminates code duplication with comprehensive, reusable components
 */

// =============================================================================
// UNIVERSAL LOADER
// =============================================================================

interface UniversalLoaderProps {
  variant?: "page" | "component" | "inline" | "button";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  message?: string;
  className?: string;
}

export const UniversalLoader: React.FC<UniversalLoaderProps> = ({
  variant = "component",
  size = "md",
  message,
  className = "",
}) => {
  const { isMobile } = useResponsive();

  const sizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const variants = {
    page: "min-h-screen flex items-center justify-center",
    component: "flex items-center justify-center py-8",
    inline: "inline-flex items-center gap-2",
    button: "inline-flex items-center gap-2",
  };

  const Spinner = () => (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={cn("border-2 border-primary border-t-transparent rounded-full", sizes[size])}
    />
  );

  if (variant === "inline" || variant === "button") {
    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <Spinner />
        {message && (
          <span className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-base")}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn(variants[variant], className)}>
      <div className="text-center space-y-4">
        <Spinner />
        {message && (
          <p className={cn("text-muted-foreground", isMobile ? "text-sm" : "text-base")}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// BASE CARD
// =============================================================================

interface BaseCardProps {
  variant?: "stats" | "book" | "user" | "achievement" | "default";
  data?: any;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export const BaseCard: React.FC<BaseCardProps> = ({
  variant = "default",
  data,
  actions,
  children,
  className = "",
  hover = false,
  clickable = false,
  onClick,
}) => {
  const { isMobile } = useResponsive();

  const variants = {
    stats:
      "p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20",
    book: "p-4 bg-card hover:shadow-lg transition-shadow",
    user: "p-4 bg-card border border-border",
    achievement:
      "p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20",
    default: "p-6 bg-card",
  };

  const renderContent = () => {
    if (children) return children;

    switch (variant) {
      case "stats":
        return (
          <div className="space-y-2">
            <h3 className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
              {data?.title}
            </h3>
            <p className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>{data?.value}</p>
            {data?.subtitle && <p className="text-xs text-muted-foreground">{data.subtitle}</p>}
          </div>
        );

      case "book":
        return (
          <div className="space-y-3">
            {data?.cover && (
              <img src={data.cover} alt={data.title} className="w-full h-32 object-cover rounded" />
            )}
            <div>
              <h3 className={cn("font-semibold line-clamp-2", isMobile ? "text-sm" : "text-base")}>
                {data?.title}
              </h3>
              {data?.author && <p className="text-sm text-muted-foreground">{data.author}</p>}
            </div>
            {data?.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso</span>
                  <span>{data.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "user":
        return (
          <div className="flex items-center space-x-3">
            {data?.avatar && (
              <img src={data.avatar} alt={data.name} className="w-10 h-10 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-semibold truncate", isMobile ? "text-sm" : "text-base")}>
                {data?.name}
              </h3>
              {data?.subtitle && (
                <p className="text-sm text-muted-foreground truncate">{data.subtitle}</p>
              )}
            </div>
            {data?.badge && (
              <div className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {data.badge}
              </div>
            )}
          </div>
        );

      case "achievement":
        return (
          <div className="text-center space-y-2">
            {data?.icon && <div className="text-3xl">{data.icon}</div>}
            <h3 className={cn("font-semibold", isMobile ? "text-sm" : "text-base")}>
              {data?.title}
            </h3>
            {data?.description && (
              <p className="text-xs text-muted-foreground">{data.description}</p>
            )}
            {data?.points && (
              <div className="text-sm font-medium text-primary">+{data.points} pontos</div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        variants[variant],
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
      {renderContent()}
      {actions && (
        <div
          className={cn(
            "flex items-center justify-between gap-2 pt-3 mt-3 border-t",
            isMobile && "flex-col space-y-2"
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// FORM BUILDER
// =============================================================================

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "textarea" | "select" | "checkbox";
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

interface FormBuilderProps {
  fields: FormField[];
  variant?: "login" | "book" | "profile" | "default";
  onSubmit: (data: Record<string, any>) => void;
  className?: string;
  submitLabel?: string;
  loading?: boolean;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  variant = "default",
  onSubmit,
  className = "",
  submitLabel = "Enviar",
  loading = false,
}) => {
  const { isMobile } = useResponsive();
  const [formData, setFormData] = React.useState<Record<string, any>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = formData[field.name];

      if (field.required && (!value || value.toString().trim() === "")) {
        newErrors[field.name] = `${field.label} é obrigatório`;
      }

      if (field.validation && value) {
        const { min, max, pattern, message } = field.validation;

        if (min && value.toString().length < min) {
          newErrors[field.name] = message || `Mínimo ${min} caracteres`;
        }

        if (max && value.toString().length > max) {
          newErrors[field.name] = message || `Máximo ${max} caracteres`;
        }

        if (pattern && !pattern.test(value.toString())) {
          newErrors[field.name] = message || "Formato inválido";
        }
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const renderField = (field: FormField) => {
    const baseClassName = cn(
      "w-full px-3 py-2 border rounded-md",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
      isMobile && "min-h-[44px]",
      errors[field.name] && "border-destructive"
    );

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange(field.name, e.target.value)
            }
            className={baseClassName}
            placeholder={field.placeholder}
            rows={isMobile ? 3 : 4}
          />
        );

      case "select":
        return (
          <select
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              handleChange(field.name, e.target.value)
            }
            className={baseClassName}
          >
            <option value="">{field.placeholder || "Selecione..."}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!formData[field.name]}
              onChange={e => handleChange(field.name, e.target.checked)}
              className="rounded"
            />
            <span className={cn(isMobile ? "text-sm" : "text-base")}>{field.label}</span>
          </label>
        );

      default:
        return (
          <input
            id={field.name}
            value={formData[field.name] || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(field.name, e.target.value)
            }
            className={baseClassName}
            type={field.type}
            placeholder={field.placeholder}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {fields.map(field => (
        <div key={field.name} className="space-y-2">
          {field.type !== "checkbox" && (
            <label
              htmlFor={field.name}
              className={cn(
                "block font-medium",
                isMobile ? "text-sm" : "text-base",
                errors[field.name] && "text-destructive"
              )}
            >
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
          )}

          {renderField(field)}

          {errors[field.name] && <p className="text-sm text-destructive">{errors[field.name]}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className={cn(
          "w-full py-2 px-4 bg-primary text-primary-foreground rounded-md",
          "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          isMobile && "min-h-[44px]"
        )}
      >
        {loading ? (
          <UniversalLoader variant="inline" size="sm" message={submitLabel} />
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
};

// =============================================================================
// UNIVERSAL MODAL
// =============================================================================

interface UniversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: "confirmation" | "form" | "info" | "fullscreen";
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  responsive?: boolean;
}

export const UniversalModal: React.FC<UniversalModalProps> = ({
  isOpen,
  onClose,
  type = "info",
  title,
  children,
  actions,
  className = "",
  responsive = true,
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

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFullscreen = type === "fullscreen" || (responsive && isMobile);

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
          "relative bg-background shadow-lg",
          isFullscreen ? "w-full h-full" : "max-w-lg w-full max-h-[90vh] rounded-lg",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {/* Header */}
        {title && (
          <div
            className={cn(
              "flex items-center justify-between border-b p-4",
              isFullscreen && "sticky top-0 bg-background z-10"
            )}
          >
            <h2 id="modal-title" className="text-lg font-semibold">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "rounded-sm opacity-70 hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                isMobile && "min-h-[44px] min-w-[44px]"
              )}
              aria-label="Fechar modal"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "flex-1 overflow-y-auto p-4",
            isFullscreen && "pb-20" // Space for actions
          )}
        >
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className={cn("border-t p-4", isFullscreen && "sticky bottom-0 bg-background")}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

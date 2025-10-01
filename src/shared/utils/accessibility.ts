import React from "react";

/**
 * Accessibility Configuration and Utilities
 * WCAG 2.1 AA compliant accessibility system
 */

// =============================================================================
// ACCESSIBILITY CONSTANTS
// =============================================================================

export const ARIA_LABELS = {
  // Navigation
  mainNav: "Navegação principal",
  breadcrumb: "Caminho de navegação",
  skipToContent: "Pular para o conteúdo principal",

  // Reading
  bookProgress: "Progresso de leitura",
  readingGoal: "Meta de leitura",
  bookRating: "Avaliação do livro",

  // User actions
  search: "Pesquisar livros",
  filter: "Filtrar resultados",
  sort: "Ordenar resultados",

  // Status
  loading: "Carregando conteúdo",
  error: "Erro no carregamento",
  success: "Operação realizada com sucesso",

  // Forms
  required: "Campo obrigatório",
  optional: "Campo opcional",
  invalid: "Valor inválido",

  // Dashboard
  stats: "Estatísticas de leitura",
  achievements: "Conquistas desbloqueadas",
  activityFeed: "Feed de atividades recentes",
} as const;

export const KEYBOARD_SHORTCUTS = {
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: " ",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  TAB: "Tab",
  HOME: "Home",
  END: "End",
} as const;

export const FOCUS_TRAP_SELECTORS = [
  "a[href]:not([disabled])",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input[type="text"]:not([disabled])',
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
].join(",");

// =============================================================================
// ACCESSIBILITY HOOKS
// =============================================================================

/**
 * Hook for managing focus trap in modals/dialogs
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(FOCUS_TRAP_SELECTORS);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when trap activates
    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== KEYBOARD_SHORTCUTS.TAB) return;

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
  }, [isActive]);

  return containerRef;
};

/**
 * Hook for screen reader announcements
 */
export const useScreenReader = () => {
  const announceRef = React.useRef<HTMLDivElement>(null);

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      if (!announceRef.current) return;

      announceRef.current.setAttribute("aria-live", priority);
      announceRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = "";
        }
      }, 1000);
    },
    []
  );

  const ScreenReaderAnnouncer = React.useCallback(() => {
    return React.createElement("div", {
      ref: announceRef,
      "aria-live": "polite",
      "aria-atomic": "true",
      className: "sr-only",
    });
  }, []);

  return { announce, ScreenReaderAnnouncer };
};

/**
 * Hook for keyboard navigation
 */
export const useKeyboardNavigation = (
  items: React.RefObject<HTMLElement>[],
  options: {
    loop?: boolean;
    orientation?: "horizontal" | "vertical";
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { loop = true, orientation = "vertical", onSelect } = options;
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;

      const isVertical = orientation === "vertical";
      const nextKey = isVertical ? KEYBOARD_SHORTCUTS.ARROW_DOWN : KEYBOARD_SHORTCUTS.ARROW_RIGHT;
      const prevKey = isVertical ? KEYBOARD_SHORTCUTS.ARROW_UP : KEYBOARD_SHORTCUTS.ARROW_LEFT;

      switch (key) {
        case nextKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev + 1;
            return loop ? next % items.length : Math.min(next, items.length - 1);
          });
          break;

        case prevKey:
          e.preventDefault();
          setActiveIndex(prev => {
            const next = prev - 1;
            return loop ? (next < 0 ? items.length - 1 : next) : Math.max(next, 0);
          });
          break;

        case KEYBOARD_SHORTCUTS.HOME:
          e.preventDefault();
          setActiveIndex(0);
          break;

        case KEYBOARD_SHORTCUTS.END:
          e.preventDefault();
          setActiveIndex(items.length - 1);
          break;

        case KEYBOARD_SHORTCUTS.ENTER:
        case KEYBOARD_SHORTCUTS.SPACE:
          e.preventDefault();
          onSelect?.(activeIndex);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, items.length, loop, orientation, onSelect]);

  // Focus active item
  React.useEffect(() => {
    items[activeIndex]?.current?.focus();
  }, [activeIndex, items]);

  return { activeIndex, setActiveIndex };
};

/**
 * Hook for reduced motion preference
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
};

// =============================================================================
// ACCESSIBILITY UTILITIES
// =============================================================================

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0;
export const generateId = (prefix: string = "id") => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Format text for screen readers
 */
export const formatForScreenReader = (text: string | number): string => {
  if (typeof text === "number") {
    return text.toLocaleString("pt-BR");
  }

  // Remove extra whitespace and normalize
  return text.replace(/\s+/g, " ").trim();
};

/**
 * Create ARIA description for progress
 */
export const createProgressDescription = (
  current: number,
  total: number,
  label?: string
): string => {
  const percentage = Math.round((current / total) * 100);
  const baseText = `${current} de ${total}`;
  const percentageText = `${percentage} por cento`;

  if (label) {
    return `${label}: ${baseText}, ${percentageText}`;
  }

  return `${baseText}, ${percentageText}`;
};

/**
 * Validate color contrast ratio
 */
export const validateColorContrast = (
  foreground: string,
  background: string
): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} => {
  // This is a simplified implementation
  // In a real app, you'd use a proper color contrast library

  const getLuminance = (color: string): number => {
    // Simplified luminance calculation
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length !== 3) return 0;

    const [r, g, b] = rgb.map(Number);
    const sRGB = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7,
  };
};

// Components are exported from separate accessibility components file
export type {} from "../components/AccessibilityComponents";

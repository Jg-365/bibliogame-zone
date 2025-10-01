import React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useResponsive } from "../utils/responsive";

/**
 * Universal Navigation System for BiblioGame Zone
 * Optimized navigation with breadcrumbs, transitions, and accessibility
 */

// =============================================================================
// TYPES
// =============================================================================

export type NavigationPage = "dashboard" | "social" | "ranking" | "profile";

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  isActive?: boolean;
}

export interface NavigationState {
  currentPage: NavigationPage;
  previousPage?: NavigationPage;
  breadcrumbs: BreadcrumbItem[];
  isTransitioning: boolean;
  transitionDirection: "forward" | "backward";
}

// =============================================================================
// NAVIGATION CONTEXT
// =============================================================================

interface NavigationContextValue {
  navigationState: NavigationState;
  navigate: (page: NavigationPage, breadcrumbs?: BreadcrumbItem[]) => void;
  goBack: () => void;
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
}

const NavigationContext = React.createContext<NavigationContextValue | null>(null);

export const useNavigation = () => {
  const context = React.useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within NavigationProvider");
  }
  return context;
};

// =============================================================================
// NAVIGATION PROVIDER
// =============================================================================

interface NavigationProviderProps {
  children: React.ReactNode;
  initialPage?: NavigationPage;
  onPageChange?: (page: NavigationPage) => void;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialPage = "dashboard",
  onPageChange,
}) => {
  const [navigationState, setNavigationState] = React.useState<NavigationState>({
    currentPage: initialPage,
    breadcrumbs: [],
    isTransitioning: false,
    transitionDirection: "forward",
  });

  const navigate = React.useCallback(
    (page: NavigationPage, breadcrumbs: BreadcrumbItem[] = []) => {
      setNavigationState(prev => ({
        ...prev,
        previousPage: prev.currentPage,
        currentPage: page,
        breadcrumbs,
        isTransitioning: true,
        transitionDirection: "forward",
      }));

      // Reset transitioning state
      setTimeout(() => {
        setNavigationState(prev => ({ ...prev, isTransitioning: false }));
      }, 300);

      onPageChange?.(page);
    },
    [onPageChange]
  );

  const goBack = React.useCallback(() => {
    const { previousPage } = navigationState;
    if (previousPage) {
      setNavigationState(prev => ({
        ...prev,
        currentPage: previousPage,
        previousPage: prev.currentPage,
        isTransitioning: true,
        transitionDirection: "backward",
      }));

      setTimeout(() => {
        setNavigationState(prev => ({ ...prev, isTransitioning: false }));
      }, 300);

      onPageChange?.(previousPage);
    }
  }, [navigationState.previousPage, onPageChange]);

  const updateBreadcrumbs = React.useCallback((breadcrumbs: BreadcrumbItem[]) => {
    setNavigationState(prev => ({ ...prev, breadcrumbs }));
  }, []);

  const value = React.useMemo(
    () => ({
      navigationState,
      navigate,
      goBack,
      updateBreadcrumbs,
    }),
    [navigationState, navigate, goBack, updateBreadcrumbs]
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

// =============================================================================
// BREADCRUMBS COMPONENT
// =============================================================================

interface BreadcrumbsProps {
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
}

export const NavigationBreadcrumbs: React.FC<BreadcrumbsProps> = ({
  className = "",
  separator = "/",
  showHome = true,
}) => {
  const { navigationState } = useNavigation();
  const { breadcrumbs } = navigationState;
  const { isMobile } = useResponsive();

  if (breadcrumbs.length === 0 && !showHome) return null;

  const allBreadcrumbs = showHome
    ? [{ id: "home", label: "Home", href: "#dashboard" }, ...breadcrumbs]
    : breadcrumbs;

  return (
    <nav
      className={cn("flex items-center space-x-2 text-sm text-muted-foreground", className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-2">
        {allBreadcrumbs.map((item, index) => (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <li className="flex items-center">
                <span className="mx-2 text-muted-foreground/50">{separator}</span>
              </li>
            )}
            <li>
              {item.href && !item.isActive ? (
                <a
                  href={item.href}
                  className={cn(
                    "hover:text-foreground transition-colors",
                    isMobile && "min-h-[44px] flex items-center"
                  )}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {item.label}
                </a>
              ) : (
                <span
                  className={cn(
                    item.isActive ? "text-foreground font-medium" : "text-muted-foreground",
                    isMobile && "min-h-[44px] flex items-center"
                  )}
                  aria-current={item.isActive ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

// =============================================================================
// PAGE TRANSITION WRAPPER
// =============================================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className = "" }) => {
  const { navigationState } = useNavigation();
  const { currentPage, isTransitioning, transitionDirection } = navigationState;

  const variants = {
    initial: {
      opacity: 0,
      x: transitionDirection === "forward" ? 20 : -20,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: transitionDirection === "forward" ? -20 : 20,
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={cn("w-full", className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// =============================================================================
// BACK BUTTON COMPONENT
// =============================================================================

interface BackButtonProps {
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  className = "",
  label = "Voltar",
  showIcon = true,
}) => {
  const { navigationState, goBack } = useNavigation();
  const { previousPage } = navigationState;
  const { isMobile } = useResponsive();

  if (!previousPage) return null;

  return (
    <button
      onClick={goBack}
      className={cn(
        "inline-flex items-center text-sm text-muted-foreground hover:text-foreground",
        "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isMobile && "min-h-[44px] min-w-[44px]",
        className
      )}
      aria-label={`${label} para página anterior`}
    >
      {showIcon && (
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      )}
      {label}
    </button>
  );
};

// =============================================================================
// NAVIGATION ANNOUNCER
// =============================================================================

export const NavigationAnnouncer: React.FC = () => {
  const { navigationState } = useNavigation();
  const { currentPage } = navigationState;
  const announcerRef = React.useRef<HTMLDivElement>(null);

  const pageNames = {
    dashboard: "Dashboard",
    social: "Feed Social",
    ranking: "Rankings",
    profile: "Perfil",
  };

  React.useEffect(() => {
    const announcement = `Navegou para ${pageNames[currentPage]}`;

    if (announcerRef.current) {
      announcerRef.current.textContent = announcement;

      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = "";
        }
      }, 1000);
    }
  }, [currentPage]);

  return (
    <div
      ref={announcerRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    />
  );
};

// =============================================================================
// KEYBOARD NAVIGATION HANDLER
// =============================================================================

interface KeyboardNavigationProps {
  children: React.ReactNode;
}

export const KeyboardNavigationHandler: React.FC<KeyboardNavigationProps> = ({ children }) => {
  const { navigate, goBack, navigationState } = useNavigation();
  const { currentPage } = navigationState;

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      switch (event.key) {
        case "Escape":
          goBack();
          break;
        case "1":
          if (event.altKey) {
            event.preventDefault();
            navigate("dashboard");
          }
          break;
        case "2":
          if (event.altKey) {
            event.preventDefault();
            navigate("social");
          }
          break;
        case "3":
          if (event.altKey) {
            event.preventDefault();
            navigate("ranking");
          }
          break;
        case "4":
          if (event.altKey) {
            event.preventDefault();
            navigate("profile");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate, goBack]);

  return <>{children}</>;
};

// =============================================================================
// SKIP NAVIGATION LINKS
// =============================================================================

interface SkipNavigationProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = [
    { href: "#main-content", label: "Pular para conteúdo principal" },
    { href: "#navigation", label: "Pular para navegação" },
    { href: "#footer", label: "Pular para rodapé" },
  ],
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      {links.map(link => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            "fixed top-0 left-0 z-50 p-2 bg-primary text-primary-foreground",
            "focus:relative focus:z-auto focus:outline-none focus:ring-2",
            "focus:ring-ring focus:ring-offset-2 transition-all"
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// =============================================================================
// RESPONSIVE NAVIGATION TABS
// =============================================================================

interface NavigationTabsProps {
  className?: string;
  variant?: "pills" | "underline" | "buttons";
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  className = "",
  variant = "pills",
}) => {
  const { navigationState, navigate } = useNavigation();
  const { currentPage } = navigationState;
  const { isMobile, isTablet } = useResponsive();

  const pages: Array<{
    id: NavigationPage;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      ),
    },
    {
      id: "social",
      label: "Social",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
    },
    {
      id: "ranking",
      label: "Rankings",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.228a25.628 25.628 0 012.92.52 6.003 6.003 0 01-5.395 5.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0"
          />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Perfil",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      ),
    },
  ];

  const variantStyles = {
    pills: {
      container: isMobile ? "flex overflow-x-auto pb-2" : "flex flex-wrap gap-2",
      item: "px-4 py-2 rounded-full transition-all duration-200",
      active: "bg-primary text-primary-foreground shadow-sm",
      inactive: "text-muted-foreground hover:text-foreground hover:bg-accent",
    },
    underline: {
      container: "flex border-b",
      item: "px-4 py-2 border-b-2 transition-all duration-200",
      active: "border-primary text-primary",
      inactive:
        "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground",
    },
    buttons: {
      container: isMobile ? "grid grid-cols-2 gap-2" : "flex gap-2",
      item: "px-4 py-2 border rounded-md transition-all duration-200",
      active: "bg-primary border-primary text-primary-foreground",
      inactive:
        "border-input text-muted-foreground hover:text-foreground hover:border-muted-foreground",
    },
  };

  const styles = variantStyles[variant];

  return (
    <nav className={cn(styles.container, className)} role="tablist">
      {pages.map(page => (
        <button
          key={page.id}
          onClick={() => navigate(page.id)}
          className={cn(
            styles.item,
            "flex items-center gap-2 font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isMobile && "min-h-[44px] justify-center",
            currentPage === page.id ? styles.active : styles.inactive
          )}
          role="tab"
          aria-selected={currentPage === page.id}
          aria-controls={`panel-${page.id}`}
        >
          {page.icon}
          {(!isMobile || !isTablet) && page.label}
        </button>
      ))}
    </nav>
  );
};

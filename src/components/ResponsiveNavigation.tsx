import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Trophy,
  User,
  Menu,
  X,
  MessageCircle,
  Search,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export type NavigationPage =
  | "dashboard"
  | "social"
  | "ranking"
  | "profile"
  | "social-feed"
  | "search"
  | "library";

interface ResponsiveNavigationProps {
  currentPage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  className?: string;
}

// Desktop/Tablet navigation (keeping original structure)
const navigationItems = [
  {
    id: "dashboard" as NavigationPage,
    label: "Dashboard",
    icon: Home,
    description: "Sua leitura",
  },
  {
    id: "social" as NavigationPage,
    label: "Social",
    icon: Users,
    description: "Feed e amigos",
  },
  {
    id: "ranking" as NavigationPage,
    label: "Ranking",
    icon: Trophy,
    description: "Classificação",
  },
  {
    id: "profile" as NavigationPage,
    label: "Perfil",
    icon: User,
    description: "Sua conta",
  },
];

// Mobile-specific navigation with new structure
const mobileNavigationItems = [
  {
    id: "social-feed" as NavigationPage,
    label: "Início",
    icon: Home,
    description: "Feed e Ranking",
  },
  {
    id: "search" as NavigationPage,
    label: "Buscar",
    icon: Search,
    description: "Livros e Usuários",
  },
  {
    id: "library" as NavigationPage,
    label: "Biblioteca",
    icon: Library,
    description: "Seus livros",
  },
  {
    id: "profile" as NavigationPage,
    label: "Perfil",
    icon: User,
    description: "Sua conta",
  },
];

const ResponsiveNavigation = ({
  currentPage,
  onNavigate,
  className,
}: ResponsiveNavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [previousLayout, setPreviousLayout] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  // Track layout changes for smooth transitions
  useEffect(() => {
    const currentLayout = isMobile
      ? "mobile"
      : isTablet
      ? "tablet"
      : "desktop";
    if (currentLayout !== previousLayout) {
      // Close mobile menu when transitioning away from mobile
      if (
        previousLayout === "mobile" &&
        currentLayout !== "mobile"
      ) {
        setIsMobileMenuOpen(false);
      }
      setPreviousLayout(currentLayout);
    }
  }, [isMobile, isTablet, isDesktop, previousLayout]);

  const handleNavigate = (page: NavigationPage) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      // swallow - auth provider handles errors; optionally show toast elsewhere
      console.error("Error signing out:", error);
      navigate("/");
    }
  };

  // Desktop Navigation (lg and above)
  if (isDesktop) {
    return (
      <motion.nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b",
          className
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  RQ
                </span>
              </div>
              <span className="font-bold text-xl">
                ReadQuest
              </span>
            </motion.div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-1">
              {mobileNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground hover:scale-105"
                    )}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">
                      {item.label}
                    </span>

                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-primary rounded-lg -z-10"
                        layoutId="activeDesktopTab"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
            {/* Logout button on desktop */}
            <div className="ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>
    );
  }

  // Tablet Navigation (md to lg)
  if (isTablet) {
    return (
      <>
        <motion.header
          className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  RQ
                </span>
              </div>
              <span className="font-bold text-xl">
                ReadQuest
              </span>
            </motion.div>

            <motion.button
              onClick={toggleMobileMenu}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* Tablet Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="fixed inset-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="pt-20 px-6 grid grid-cols-2 gap-4 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {mobileNavigationItems.map(
                  (item, index) => {
                    const Icon = item.icon;
                    const isActive =
                      currentPage === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        onClick={() =>
                          handleNavigate(item.id)
                        }
                        className={cn(
                          "flex flex-col items-center space-y-3 p-6 rounded-xl transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground hover:scale-105 bg-card"
                        )}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1,
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-8 h-8" />
                        <div className="text-center">
                          <div className="font-semibold text-lg">
                            {item.label}
                          </div>
                          <div
                            className={cn(
                              "text-sm mt-1",
                              isActive
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.description}
                          </div>
                        </div>
                      </motion.button>
                    );
                  }
                )}
              </motion.div>
              {/* Logout action */}
              <div className="max-w-2xl mx-auto px-6 mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                >
                  Sair
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Mobile Navigation (below md)
  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">
                RQ
              </span>
            </div>
            <span className="font-bold text-lg">
              ReadQuest
            </span>
          </motion.div>

          <motion.button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="pt-20 px-4 space-y-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {mobileNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;

                return (
                  <motion.button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 text-left",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div className="font-medium">
                        {item.label}
                      </div>
                      <div
                        className={cn(
                          "text-sm",
                          isActive
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.description}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mobileNavigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:scale-110"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: index * 0.1,
                }}
                whileTap={{ scale: 0.9 }}
              >
                <motion.div
                  animate={
                    isActive ? { scale: 1.1 } : { scale: 1 }
                  }
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-xs font-medium">
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
};

export default ResponsiveNavigation;

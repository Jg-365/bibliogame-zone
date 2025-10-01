import React, { useState, Suspense, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useAccountGuard } from "./hooks/useAccountGuard";
import { AuthPage } from "./components/auth/AuthPage";
import { Navigation, NavigationPage } from "@/components/Navigation";
import { motion, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PageLoader } from "@/shared/utils/lazyLoading";
import {
  usePerformanceMonitor,
  AppPerformanceProvider,
  PerformanceDebugger,
  BundleAnalysisDisplay,
} from "@/shared/performance";
import { SkipLink } from "@/shared/accessibility/components";
import { AccessibilityDevPanel } from "@/shared/accessibility/testing";
import { useAnnouncer } from "@/shared/accessibility";
import { usePageLoadPerformance } from "@/shared/components/LazyPageWrapper";

// Import components directly for now (will be made lazy when components support it)
import { SocialPage } from "@/pages/Social";
import { RankingPage } from "@/pages/Ranking";
import { ProfilePage } from "@/pages/Profile";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 },
};

const pageTransition = {
  duration: 0.4,
};

const AppRouter = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>("dashboard");

  // Use account guard to check for deleted accounts
  useAccountGuard();

  // Monitor page load performance
  usePageLoadPerformance(currentPage);

  // Accessibility announcements
  const { announce, AnnouncerComponent } = useAnnouncer();

  // Announce page changes for screen readers
  React.useEffect(() => {
    const pageNames = {
      dashboard: "Dashboard",
      social: "Social Feed",
      ranking: "Rankings",
      profile: "Profile",
    };

    announce(`Navigated to ${pageNames[currentPage] || currentPage} page`);
  }, [currentPage, announce]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-reading flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "social":
        return <SocialPage />;
      case "ranking":
        return <RankingPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Skip Navigation Links */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>

      {/* Accessibility Announcer */}
      {AnnouncerComponent && <AnnouncerComponent />}

      <nav id="navigation" aria-label="Main navigation">
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      </nav>

      <main id="main-content" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            {renderCurrentPage()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => (
  <AccessibilityDevPanel>
    <AppPerformanceProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRouter />
            <PerformanceDebugger />
            <BundleAnalysisDisplay />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppPerformanceProvider>
  </AccessibilityDevPanel>
);

export default App;

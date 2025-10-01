import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useAccountGuard } from "./hooks/useAccountGuard";
import { AuthPage } from "./components/auth/AuthPage";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import {
  AppPerformanceProvider,
  PerformanceDebugger,
  BundleAnalysisDisplay,
} from "@/shared/performance";
import { AccessibilityDevPanel } from "@/shared/accessibility/testing";
import { useAnnouncer } from "@/shared/accessibility";
import { useResponsive } from "@/shared/utils/responsive";
import {
  NavigationProvider,
  NavigationTabs,
  PageTransition,
  NavigationAnnouncer,
  KeyboardNavigationHandler,
  SkipNavigation,
  type NavigationPage,
  useNavigation,
} from "@/shared/components/NavigationSystem";
import { ResponsiveContainer } from "@/shared/components/ResponsiveComponents";

// Lazy load pages for better performance
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const SocialPage = lazy(() => import("./pages/Social").then(m => ({ default: m.SocialPage })));
const RankingPage = lazy(() => import("./pages/Ranking").then(m => ({ default: m.RankingPage })));
const ProfilePage = lazy(() => import("./pages/Profile").then(m => ({ default: m.ProfilePage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRouter = () => {
  const { user, isLoading } = useAuth();
  const { isMobile } = useResponsive();

  // Use account guard to check for deleted accounts
  useAccountGuard();

  // Accessibility announcements
  const { announce, AnnouncerComponent } = useAnnouncer();

  if (isLoading) {
    return (
      <ResponsiveContainer className="min-h-screen flex items-center justify-center">
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
      </ResponsiveContainer>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <NavigationProvider initialPage="dashboard">
      <KeyboardNavigationHandler>
        <div className="min-h-screen bg-background">
          {/* Skip Navigation Links */}
          <SkipNavigation />

          {/* Accessibility Announcer */}
          <NavigationAnnouncer />
          {AnnouncerComponent && <AnnouncerComponent />}

          {/* Navigation */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <ResponsiveContainer>
              <div className="flex h-16 items-center justify-between">
                <h1 className="text-xl font-bold">BiblioGame Zone</h1>
                <NavigationTabs variant={isMobile ? "buttons" : "pills"} />
              </div>
            </ResponsiveContainer>
          </header>

          {/* Main Content */}
          <main id="main-content" className="flex-1" tabIndex={-1}>
            <PageTransition>
              <AppContent />
            </PageTransition>
          </main>
        </div>
      </KeyboardNavigationHandler>
    </NavigationProvider>
  );
};

// Content component to handle page rendering
const AppContent = () => {
  const { navigationState } = useNavigation();
  const { currentPage } = navigationState;

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        );
      case "social":
        return (
          <Suspense fallback={<PageLoader />}>
            <SocialPage />
          </Suspense>
        );
      case "ranking":
        return (
          <Suspense fallback={<PageLoader />}>
            <RankingPage />
          </Suspense>
        );
      case "profile":
        return (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        );
    }
  };

  return <ErrorBoundary>{renderPage()}</ErrorBoundary>;
};

// Simple page loader component
const PageLoader = () => (
  <ResponsiveContainer className="flex items-center justify-center py-20">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"
      />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </ResponsiveContainer>
);

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

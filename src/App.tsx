import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useAccountGuard } from "./hooks/useAccountGuard";
import { AuthPage } from "./components/auth/AuthPage";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppPerformanceProvider } from "@/shared/performance";
import { useAnnouncer } from "@/shared/accessibility";
import { useResponsive } from "@/shared/utils/responsive";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

import ResponsiveNavigation, { type NavigationPage } from "./components/ResponsiveNavigation";
import NotificationSystemSimple from "./components/NotificationSystemSimple";

// Route-level code splitting — each page loads only when first visited
const SocialFeed = lazy(() => import("./pages/SocialFeed"));
const SearchPage = lazy(() =>
  import("./pages/Search").then((m) => ({
    default: m.SearchPage,
  })),
);
const LibraryPage = lazy(() =>
  import("./pages/Library").then((m) => ({
    default: m.LibraryPage,
  })),
);
const CopilotPage = lazy(() => import("./pages/Copilot"));
const ProfilePage = lazy(() => import("./pages/Profile"));
const UserProfilePage = lazy(() =>
  import("./pages/UserProfile").then((m) => ({
    default: m.UserProfilePage,
  })),
);
const ResetPasswordPage = lazy(() => import("./pages/ResetPassword"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPassword"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        if (err?.status !== undefined && err.status >= 400 && err.status < 500) return false;
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: unknown) => {
        const err = error as {
          message?: string;
          status?: number;
        };
        if (err?.message?.includes("fetch") || (err?.status !== undefined && err.status >= 500)) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

/** Full-page loader shown while lazy-loaded route chunks are fetching. */
const PageLoader = () => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="flex min-h-[100svh] min-h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
          <m.div
            animate={shouldReduceMotion ? undefined : { rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary"
          />
        </div>
      </div>
    </div>
  );
};

// Component that uses Router hooks - MUST be inside Router
const AppContent = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<NavigationPage>("social-feed");

  useAccountGuard();

  const { announce, AnnouncerComponent } = useAnnouncer();

  // Sync active nav tab with URL and announce route change to screen readers
  useEffect(() => {
    const path = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const isRankingTab = searchParams.get("tab") === "ranking";
    const routeToPage: Record<string, NavigationPage> = {
      "/social-feed": "social-feed",
      "/": "social-feed",
      "/search": "search",
      "/library": "library",
      "/copilot": "copilot",
      "/profile": "profile",
    };
    const page = routeToPage[path];
    if (page) setCurrentPage(isRankingTab ? "ranking" : page);

    // Move focus to main content on every route change (SPA accessibility)
    const main = document.getElementById("main-content");
    if (main) main.focus();

    announce(`Navegando para ${path.replace("/", "") || "início"}`, "polite");
  }, [location.pathname, location.search, announce]);

  useEffect(() => {
    if (!user?.id) return;
    const day = new Date().toISOString().slice(0, 10);
    const key = `rq:route-view:${location.pathname}:${day}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    void trackEvent({
      userId: user.id,
      eventName: "route_viewed",
      eventCategory: "navigation",
      payload: { path: location.pathname },
    });
  }, [location.pathname, user?.id]);

  const handleNavigate = (page: NavigationPage) => {
    const pageToRoute: Record<NavigationPage, string> = {
      "social-feed": "/social-feed",
      search: "/search",
      library: "/library",
      copilot: "/copilot",
      profile: "/profile",
      // legacy entries still referenced by type
      dashboard: "/social-feed",
      social: "/social-feed",
      ranking: "/social-feed?tab=ranking",
    };
    setCurrentPage(page);
    navigate(pageToRoute[page] ?? "/social-feed");
  };

  if (!user) {
    return <AuthPage />;
  }

  return (
    <NotificationSystemSimple>
      <div className="min-h-[100svh] min-h-dvh bg-background">
        {AnnouncerComponent && <AnnouncerComponent />}

        <ResponsiveNavigation currentPage={currentPage} onNavigate={handleNavigate} />

        <main
          id="main-content"
          className={cn(
            "flex-1 transition-all [transition-duration:var(--duration-normal)] [transition-timing-function:var(--easing-standard)]",
            isMobile
              ? "pb-[calc(5rem+env(safe-area-inset-bottom))] pt-[calc(3.5rem+env(safe-area-inset-top))]"
              : "pt-[calc(4rem+env(safe-area-inset-top))]",
          )}
          tabIndex={-1}
        >
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Navigate to="/social-feed" replace />} />
                <Route path="/social-feed" element={<SocialFeed />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/copilot" element={<CopilotPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/user/:userId" element={<UserProfilePage />} />
                {/* Legacy route redirects */}
                <Route path="/dashboard" element={<Navigate to="/social-feed" replace />} />
                <Route path="/social" element={<Navigate to="/social-feed" replace />} />
                <Route path="/ranking" element={<Navigate to="/social-feed" replace />} />
                <Route path="*" element={<Navigate to="/social-feed" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </NotificationSystemSimple>
  );
};

/** Handles auth-initialisation gate. AppContent owns all authenticated routing. */
const AppRouter = () => {
  const { loading } = useAuth();

  if (loading?.isLoading) {
    return <PageLoader />;
  }

  return <AppContent />;
};

const App = () => (
  <LazyMotion features={domAnimation} strict>
    <AppPerformanceProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRouter />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </AppPerformanceProvider>
  </LazyMotion>
);

export default App;

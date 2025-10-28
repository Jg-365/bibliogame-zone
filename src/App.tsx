import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useAccountGuard } from "./hooks/useAccountGuard";
import { AuthPage } from "./components/auth/AuthPage";
import { motion } from "framer-motion";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  AppPerformanceProvider,
  PerformanceDebugger,
  BundleAnalysisDisplay,
} from "@/shared/performance";
import { useAnnouncer } from "@/shared/accessibility";
import { useResponsive } from "@/shared/utils/responsive";

import { ResponsiveContainer } from "@/shared/components/ResponsiveComponents";

// Import types
import type { NavigationPage } from "./components/ResponsiveNavigation";

// Import components directly to avoid lazy loading issues
import SocialFeed from "./pages/SocialFeed";
import { SearchPage } from "./pages/Search";
import { LibraryPage } from "./pages/Library";
import ProfilePage from "./pages/Profile";
import { UserProfilePage } from "./pages/UserProfile";
import ResponsiveNavigation from "./components/ResponsiveNavigation";
import NotificationSystemSimple from "./components/NotificationSystemSimple";
import ResetPasswordPage from "./pages/ResetPassword";
import ForgotPasswordPage from "./pages/ForgotPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos - dados frescos por mais tempo
      gcTime: 15 * 60 * 1000, // 15 minutos - cache mais longo
      retry: (failureCount, error: any) => {
        // Não retry para erros 4xx (cliente)
        if (error?.status >= 400 && error?.status < 500)
          return false;
        // Retry até 3 vezes para erros de rede/servidor
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Retry mutations apenas para erros de rede
        if (
          error?.message?.includes("fetch") ||
          error?.status >= 500
        ) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 5000),
    },
  },
});

// Component that uses Router hooks - MUST be inside Router
const AppContent = () => {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] =
    useState<NavigationPage>("dashboard");

  // Use account guard to check for deleted accounts
  useAccountGuard();

  // Accessibility announcements
  const { announce, AnnouncerComponent } = useAnnouncer();

  // Update currentPage based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/" || path === "/social-feed") {
      setCurrentPage("social-feed");
    } else if (path === "/search") {
      setCurrentPage("search");
    } else if (path === "/library") {
      setCurrentPage("library");
    } else if (path === "/profile") {
      setCurrentPage("profile");
    }
  }, [location.pathname]);

  // Handle navigation
  const handleNavigate = (page: NavigationPage) => {
    setCurrentPage(page);
    switch (page) {
      case "social-feed":
        navigate("/social-feed");
        break;
      case "search":
        navigate("/search");
        break;
      case "library":
        navigate("/library");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        navigate("/social-feed");
        break;
    }
  };

  // Removed isLoading check since it does not exist in AuthContextType

  if (!user) {
    return <AuthPage />;
  }

  return (
    <NotificationSystemSimple>
      <div className="min-h-screen bg-background">
        {/* Accessibility Announcer */}
        {AnnouncerComponent && <AnnouncerComponent />}

        {/* Navigation */}
        <ResponsiveNavigation
          currentPage={currentPage}
          onNavigate={handleNavigate}
        />

        {/* Main Content */}
        <main
          id="main-content"
          className={`
          flex-1 
          ${isMobile ? "pb-20 pt-16" : "pt-20"}
          transition-all duration-300 ease-in-out
        `}
          tabIndex={-1}
        >
          <ErrorBoundary>
            <Routes>
              {/* Main Routes */}
              <Route
                path="/"
                element={
                  <Navigate to="/social-feed" replace />
                }
              />
              <Route
                path="/social-feed"
                element={<SocialFeed />}
              />
              <Route
                path="/search"
                element={<SearchPage />}
              />
              <Route
                path="/library"
                element={<LibraryPage />}
              />
              <Route
                path="/profile"
                element={<ProfilePage />}
              />

              <Route
                path="/reset-password"
                element={<ResetPasswordPage />}
              />
              <Route
                path="/forgot-password"
                element={<ForgotPasswordPage />}
              />

              {/* User Profile Route */}
              <Route
                path="/user/:userId"
                element={<UserProfilePage />}
              />

              {/* Redirect old routes to new structure */}
              <Route
                path="/dashboard"
                element={
                  <Navigate to="/social-feed" replace />
                }
              />
              <Route
                path="/social"
                element={
                  <Navigate to="/social-feed" replace />
                }
              />
              <Route
                path="/ranking"
                element={
                  <Navigate to="/social-feed" replace />
                }
              />

              {/* Catch all - redirect to social feed */}
              <Route
                path="*"
                element={
                  <Navigate to="/social-feed" replace />
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </NotificationSystemSimple>
  );
};

// Main App Router component
const AppRouter = () => {
  // Use both user and loading state from auth so we render correctly
  const { user, loading } = useAuth();

  // While auth is initializing, show a loading spinner
  if (loading?.isLoading) {
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
          <p className="text-muted-foreground">
            Carregando...
          </p>
        </div>
      </ResponsiveContainer>
    );
  }

  // If not authenticated, show the AuthPage so user can sign in
  if (!user) {
    // Public routes available when not authenticated
    return (
      <ErrorBoundary>
        <Routes>
          <Route
            path="/forgot-password"
            element={<ForgotPasswordPage />}
          />
          <Route
            path="/reset-password"
            element={<ResetPasswordPage />}
          />
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </ErrorBoundary>
    );
  }

  // Render main app content if user exists
  return <AppContent />;
};

const App = () => (
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
);

export default App;

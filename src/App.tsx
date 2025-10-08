import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
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

// Component that uses Router hooks - MUST be inside Router
const AppContent = () => {
  const { user, isLoading } = useAuth();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<NavigationPage>("dashboard");

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
    <NotificationSystemSimple>
      <div className="min-h-screen bg-background">
        {/* Accessibility Announcer */}
        {AnnouncerComponent && <AnnouncerComponent />}

        {/* Navigation */}
        <ResponsiveNavigation currentPage={currentPage} onNavigate={handleNavigate} />

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
              <Route path="/" element={<Navigate to="/social-feed" replace />} />
              <Route path="/social-feed" element={<SocialFeed />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* User Profile Route */}
              <Route path="/user/:userId" element={<UserProfilePage />} />

              {/* Redirect old routes to new structure */}
              <Route path="/dashboard" element={<Navigate to="/social-feed" replace />} />
              <Route path="/social" element={<Navigate to="/social-feed" replace />} />
              <Route path="/ranking" element={<Navigate to="/social-feed" replace />} />

              {/* Catch all - redirect to social feed */}
              <Route path="*" element={<Navigate to="/social-feed" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </NotificationSystemSimple>
  );
};

// Main App Router component
const AppRouter = () => {
  const { user, isLoading } = useAuth();

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
    <Router>
      <AppContent />
    </Router>
  );
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

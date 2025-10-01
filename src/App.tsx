import { useState } from "react";
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
import {
  Navigation,
  NavigationPage,
} from "@/components/Navigation";
import { SocialPage } from "@/pages/Social";
import { RankingPage } from "@/pages/Ranking";
import { ProfilePage } from "@/pages/Profile";
import Dashboard from "./pages/Dashboard";
import { motion, AnimatePresence } from "framer-motion";

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
  const [currentPage, setCurrentPage] =
    useState<NavigationPage>("dashboard");

  // Use account guard to check for deleted accounts
  useAccountGuard();

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
          <p className="text-muted-foreground">
            Carregando...
          </p>
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
      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
      />

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
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRouter />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

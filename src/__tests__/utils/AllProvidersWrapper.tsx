import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Wraps components with all required providers for testing.
 * - TanStack Query with retry disabled
 * - React Router (MemoryRouter)
 * - Tooltip accessibility provider
 * - LazyMotion for framer-motion tests
 *
 * Note: useAuth is mocked via vi.mock in individual tests that need it.
 */
export function AllProvidersWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  return (
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <LazyMotion features={domAnimation}>
          <TooltipProvider>{children}</TooltipProvider>
        </LazyMotion>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';

// Test utilities for consistent test setup

/**
 * Custom render function that includes common providers
 */
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock data generators for testing
 */
export const mockData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: null,
    },
  },
  
  book: {
    id: 'test-book-id',
    title: 'Test Book',
    author: 'Test Author',
    pages: 300,
    cover_url: 'https://example.com/cover.jpg',
    description: 'A test book for testing purposes',
    genre: 'Fiction',
    isbn: '978-0000000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  
  readingSession: {
    id: 'test-session-id',
    user_id: 'test-user-id',
    book_id: 'test-book-id',
    pages_read: 50,
    session_duration: 3600, // 1 hour in seconds
    notes: 'Great chapter!',
    created_at: new Date().toISOString(),
  },
  
  achievement: {
    id: 'test-achievement-id',
    title: 'First Book',
    description: 'Read your first book',
    icon: '📚',
    criteria: { books_read: 1 },
    reward_points: 100,
    is_hidden: false,
    created_at: new Date().toISOString(),
  },
  
  userAchievement: {
    id: 'test-user-achievement-id',
    user_id: 'test-user-id',
    achievement_id: 'test-achievement-id',
    unlocked_at: new Date().toISOString(),
    is_new: true,
  },
  
  profile: {
    id: 'test-user-id',
    username: 'testuser',
    display_name: 'Test User',
    avatar_url: null,
    bio: 'Test user bio',
    reading_goal: 12,
    privacy_setting: 'public' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

/**
 * Utility functions for testing async operations
 */
export const waitForAsync = (ms: number = 0): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

/**
 * Mock sessionStorage for testing
 */
export const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

/**
 * Utility to mock user authentication state
 */
export const mockAuthUser = (user = mockData.user) => {
  // This would be implemented to work with your auth provider
  return {
    user,
    isLoading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  };
};

/**
 * Utility to create mock query responses
 */
export const createMockQueryResponse = <T>(data: T, options?: {
  isLoading?: boolean;
  error?: Error | null;
}) => ({
  data,
  isLoading: options?.isLoading ?? false,
  error: options?.error ?? null,
  isError: !!options?.error,
  isSuccess: !options?.isLoading && !options?.error,
  refetch: jest.fn(),
  fetchStatus: 'idle' as const,
  status: options?.isLoading ? 'loading' as const : 
          options?.error ? 'error' as const : 'success' as const,
});

/**
 * Utility to mock mutations
 */
export const createMockMutation = <T, V>(options?: {
  isLoading?: boolean;
  error?: Error | null;
}) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isLoading: options?.isLoading ?? false,
  error: options?.error ?? null,
  isError: !!options?.error,
  isSuccess: !options?.isLoading && !options?.error,
  reset: jest.fn(),
  status: options?.isLoading ? 'loading' as const : 
          options?.error ? 'error' as const : 'idle' as const,
});

/**
 * Test helpers for form validation
 */
export const fillForm = async (form: HTMLFormElement, values: Record<string, string>) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  for (const [name, value] of Object.entries(values)) {
    const field = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
    if (field) {
      await user.clear(field);
      await user.type(field, value);
    }
  }
};

/**
 * Utility to test accessibility
 */
export const checkAccessibility = async (container: HTMLElement) => {
  // This would integrate with axe-core for accessibility testing
  // For now, we'll do basic checks
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  return {
    focusableElements: focusableElements.length,
    hasHeadings: container.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
    hasAltText: Array.from(container.querySelectorAll('img')).every(
      img => img.getAttribute('alt') !== null
    ),
  };
};
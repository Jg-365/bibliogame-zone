import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { AllProvidersWrapper } from "@/__tests__/utils/AllProvidersWrapper";
import { BookSearch } from "@/components/BookSearch";

vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
vi.stubEnv("VITE_SUPABASE_ANON_KEY", "test-key");

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

vi.mock("@/providers/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    session: null,
    isAuthenticated: false,
    loading: { isLoading: false, error: null },
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    checkAccountStatus: vi.fn(),
  }),
}));

const searchGoogleBooksMock = vi.fn().mockResolvedValue({
  items: [
    {
      id: "book-1",
      volumeInfo: { title: "Result Book", authors: ["Test Author"] },
    },
  ],
  totalItems: 24,
});

vi.mock("@tanstack/react-query", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-query")>("@tanstack/react-query");

  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  };
});

vi.mock("@/hooks/useBooks", () => ({
  useBooks: () => ({
    books: [],
    addBook: vi.fn(),
    isAddingBook: false,
  }),
  searchGoogleBooks: (...args: Parameters<typeof searchGoogleBooksMock>) =>
    searchGoogleBooksMock(...args),
}));

describe("BookSearch", () => {
  beforeEach(() => {
    searchGoogleBooksMock.mockClear();
  });

  it("only searches after explicit submit", async () => {
    renderBookSearch();

    const input = screen.getByPlaceholderText(/Pesquisar livros/i);
    const user = userEvent.setup({ delay: null });

    await user.type(input, "abc");
    expect(searchGoogleBooksMock).toHaveBeenCalledTimes(0);

    await user.keyboard("{Enter}");

    await waitFor(() => expect(searchGoogleBooksMock).toHaveBeenCalledTimes(1));
    expect(searchGoogleBooksMock).toHaveBeenLastCalledWith("abc", 0, 12);
  });

  it("reuses the active query when paginating", async () => {
    renderBookSearch();

    const input = screen.getByPlaceholderText(/Pesquisar livros/i);
    const user = userEvent.setup({ delay: null });

    await user.type(input, "space");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(searchGoogleBooksMock).toHaveBeenCalledTimes(1));

    const nextButton = await screen.findByRole("button", { name: /Próxima/i });
    await waitFor(() => expect(nextButton).not.toBeDisabled());

    await user.click(nextButton);

    await waitFor(() => expect(searchGoogleBooksMock).toHaveBeenCalledTimes(2));
    expect(searchGoogleBooksMock).toHaveBeenLastCalledWith("space", 1, 12);
  });
});

function renderBookSearch() {
  return render(
    <AllProvidersWrapper>
      <BookSearch />
    </AllProvidersWrapper>,
  );
}

import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, it, expect, vi } from "vitest";
import { BookCard } from "@/components/BookCard";
import type { Book } from "@/shared/types";
import { AllProvidersWrapper } from "@/__tests__/utils/AllProvidersWrapper";

// Prevent Supabase client from throwing (no .env in test env)
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock useAuth to return unauthenticated state (no provider needed)
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null as null,
    session: null as null,
    isAuthenticated: false,
    loading: { isLoading: false, error: null as null },
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    checkAccountStatus: vi.fn(),
  }),
}));

// Extend jest matchers with axe
expect.extend(toHaveNoViolations);

const mockBook: Book = {
  id: "book-1",
  user_id: "user-1",
  title: "O Senhor dos Anéis",
  author: "J.R.R. Tolkien",
  total_pages: 1200,
  pages_read: 300,
  status: "reading",
  cover_url: "https://example.com/cover.jpg",
  google_books_id: "abc123",
  isbn: "978-0-261-10235-4",
  description: "Uma épica aventura da Terra-Média.",
  published_date: "1954",
  genres: ["Fantasy"],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  date_added: new Date().toISOString(),
};

function renderBookCard(book: Book = mockBook) {
  return render(
    <AllProvidersWrapper>
      <BookCard book={book} />
    </AllProvidersWrapper>,
  );
}

describe("BookCard", () => {
  it("renders the book title", () => {
    renderBookCard();
    expect(screen.getByText("O Senhor dos Anéis")).toBeDefined();
  });

  it("renders the author name", () => {
    renderBookCard();
    expect(screen.getByText(/J\.R\.R\. Tolkien/i)).toBeDefined();
  });

  it("shows reading progress", () => {
    renderBookCard();
    // 300/1200 = 25%
    expect(screen.getByText(/25%/i)).toBeDefined();
  });

  it("renders cover information (genre badge or progress)", () => {
    renderBookCard();
    // The card should render progress percentage
    expect(screen.getByText(/25/)).toBeDefined();
  });

  it("has no axe accessibility violations", async () => {
    const { container } = renderBookCard();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

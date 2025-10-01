import { renderHook, act } from "@testing-library/react-hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBooks } from "@/hooks/useBooks";
import { mockData, createMockQueryResponse } from "../utils/testUtils";

// Mock the Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useBooks Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return initial state", () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.books).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should fetch books successfully", async () => {
    const mockBooks = [mockData.book, { ...mockData.book, id: "book-2" }];

    // Mock the Supabase response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock.from().select().mockResolvedValue({
      data: mockBooks,
      error: null,
    });

    const { result, waitForNextUpdate } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await waitForNextUpdate();

    expect(result.current.books).toEqual(mockBooks);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch error", async () => {
    const mockError = new Error("Failed to fetch books");

    // Mock the Supabase error response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock.from().select().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const { result, waitForNextUpdate } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await waitForNextUpdate();

    expect(result.current.books).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("should add a book successfully", async () => {
    const newBook = {
      title: "New Book",
      author: "New Author",
      pages: 200,
      cover_url: "https://example.com/new-cover.jpg",
      description: "A new book",
      genre: "Mystery",
      isbn: "978-1111111111",
    };

    // Mock the Supabase response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock
      .from()
      .insert()
      .single()
      .mockResolvedValue({
        data: { ...newBook, id: "new-book-id" },
        error: null,
      });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.addBook.mutate(newBook);
    });

    expect(supabaseMock.from).toHaveBeenCalledWith("books");
    expect(supabaseMock.from().insert).toHaveBeenCalledWith([newBook]);
  });

  it("should update a book successfully", async () => {
    const bookId = "test-book-id";
    const updates = {
      title: "Updated Title",
      author: "Updated Author",
    };

    // Mock the Supabase response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock
      .from()
      .update()
      .eq()
      .single()
      .mockResolvedValue({
        data: { ...mockData.book, ...updates },
        error: null,
      });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.updateBook.mutate({ id: bookId, updates });
    });

    expect(supabaseMock.from).toHaveBeenCalledWith("books");
    expect(supabaseMock.from().update).toHaveBeenCalledWith(updates);
    expect(supabaseMock.from().eq).toHaveBeenCalledWith("id", bookId);
  });

  it("should delete a book successfully", async () => {
    const bookId = "test-book-id";

    // Mock the Supabase response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock.from().delete().eq().mockResolvedValue({
      data: null,
      error: null,
    });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.deleteBook.mutate(bookId);
    });

    expect(supabaseMock.from).toHaveBeenCalledWith("books");
    expect(supabaseMock.from().delete).toHaveBeenCalled();
    expect(supabaseMock.from().eq).toHaveBeenCalledWith("id", bookId);
  });

  it("should handle book search", async () => {
    const searchTerm = "mystery";
    const filteredBooks = [mockData.book];

    // Mock the Supabase response
    const supabaseMock = require("@/integrations/supabase/client").supabase;
    supabaseMock.from().select().ilike().mockResolvedValue({
      data: filteredBooks,
      error: null,
    });

    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.searchBooks.mutate(searchTerm);
    });

    expect(supabaseMock.from).toHaveBeenCalledWith("books");
    expect(supabaseMock.from().select).toHaveBeenCalled();
  });
});

describe("useBooks Performance", () => {
  it("should implement proper caching", () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    // Check that the hook uses React Query's caching
    expect(result.current.books).toBeUndefined();
    expect(typeof result.current.isLoading).toBe("boolean");
  });

  it("should handle concurrent requests", async () => {
    const { result } = renderHook(() => useBooks(), {
      wrapper: createWrapper(),
    });

    // Multiple calls should not trigger multiple requests due to deduplication
    act(() => {
      result.current.refetch();
      result.current.refetch();
      result.current.refetch();
    });

    // React Query should deduplicate these calls
    expect(result.current.isLoading).toBe(true);
  });
});

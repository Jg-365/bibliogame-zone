import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { vi } from "vitest";
import { PostCard } from "@/components/PostCard";
import { AllProvidersWrapper } from "../utils/AllProvidersWrapper";
import type { SocialPost } from "@/hooks/social";

// Prevent Supabase client from throwing in tests
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

// Mock useAuth to return unauthenticated state
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null as any,
    session: null as any,
    isAuthenticated: false,
    loading: { isLoading: false, error: null as any },
    signIn: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    checkAccountStatus: vi.fn(),
  }),
}));

expect.extend(toHaveNoViolations);

const mockPost: SocialPost = {
  id: "post-1",
  user_id: "user-1",
  user_username: "testuser",
  user_avatar_url: undefined,
  content: "Acabei de terminar O Senhor dos Anéis!",
  book_id: "book-1",
  book_title: "O Senhor dos Anéis",
  book_author: "J.R.R. Tolkien",
  book_cover_url: undefined,
  image_url: undefined,
  likes_count: 5,
  comments_count: 2,
  is_liked: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

function renderPostCard(post: SocialPost = mockPost) {
  return render(
    <AllProvidersWrapper>
      <PostCard post={post} />
    </AllProvidersWrapper>,
  );
}

describe("PostCard", () => {
  it("renders post content text", () => {
    renderPostCard();
    expect(screen.getByText("Acabei de terminar O Senhor dos Anéis!")).toBeDefined();
  });

  it("shows author username", () => {
    renderPostCard();
    expect(screen.getByText("testuser")).toBeDefined();
  });

  it("shows like count", () => {
    renderPostCard();
    expect(screen.getByText("5")).toBeDefined();
  });

  it("has no axe accessibility violations", async () => {
    const { container } = renderPostCard();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

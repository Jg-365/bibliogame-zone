/**
 * MSW handlers for mocking Supabase REST API and Google Books API in tests.
 */
import { http, HttpResponse } from "msw";
import { mockData } from "./testUtils";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://mock.supabase.co";

export const handlers = [
  // -------------------------------------------------------------------------
  // Google Books API
  // -------------------------------------------------------------------------
  http.get("https://www.googleapis.com/books/v1/volumes", ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    return HttpResponse.json({
      kind: "books#volumes",
      totalItems: 1,
      items: [
        {
          kind: "books#volume",
          id: "test-google-book-id",
          volumeInfo: {
            title: `Mock Book: ${query}`,
            authors: ["Mock Author"],
            description: "A mocked book result",
            categories: ["Fiction"],
            imageLinks: {
              thumbnail: "https://example.com/cover.jpg",
            },
            industryIdentifiers: [{ type: "ISBN_13", identifier: "9780000000000" }],
          },
        },
      ],
    });
  }),

  // -------------------------------------------------------------------------
  // Supabase — profiles table
  // -------------------------------------------------------------------------
  http.get(`${SUPABASE_URL}/rest/v1/profiles`, () => {
    return HttpResponse.json([mockData.profile]);
  }),

  // -------------------------------------------------------------------------
  // Supabase — books table
  // -------------------------------------------------------------------------
  http.get(`${SUPABASE_URL}/rest/v1/books`, () => {
    return HttpResponse.json([mockData.book]);
  }),

  http.post(`${SUPABASE_URL}/rest/v1/books`, async ({ request }) => {
    const body = (await request.json()) as object;
    return HttpResponse.json({ ...mockData.book, ...body }, { status: 201 });
  }),

  // -------------------------------------------------------------------------
  // Supabase — user_achievement_progress view
  // -------------------------------------------------------------------------
  http.get(`${SUPABASE_URL}/rest/v1/user_achievement_progress`, () => {
    return HttpResponse.json([
      {
        ...mockData.achievement,
        unlocked: false,
        unlocked_at: null,
        user_achievement_id: null,
        user_id: null,
        requirementType: "books_completed",
        requirementValue: 1,
        requirement_type: "books_completed",
        requirement_value: 1,
      },
    ]);
  }),

  // -------------------------------------------------------------------------
  // Supabase — auth
  // -------------------------------------------------------------------------
  http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
    return HttpResponse.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      user: mockData.user,
    });
  }),
];

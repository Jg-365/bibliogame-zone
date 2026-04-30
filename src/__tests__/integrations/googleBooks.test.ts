import { http, HttpResponse } from "msw";
import { server } from "../utils/mswServer";
import {
  resetGoogleBooksSearchStateForTests,
  searchGoogleBooks,
} from "@/integrations/googleBooks/client";

describe("searchGoogleBooks", () => {
  beforeEach(() => {
    resetGoogleBooksSearchStateForTests();
  });
  it("returns ranked results from the Google Books API", async () => {
    const result = await searchGoogleBooks("Harry Potter");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.totalItems).toBe(1);
    expect(result.items[0].volumeInfo?.title).toContain("Mock Book");
  });

  it("throws a useful error on API error", async () => {
    server.use(
      http.get("https://www.googleapis.com/books/v1/volumes", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    await expect(searchGoogleBooks("error case")).rejects.toThrow(
      "A busca de livros falhou com erro HTTP 500.",
    );
  });

  it("throws a useful error on rate limit", async () => {
    server.use(
      http.get("https://www.googleapis.com/books/v1/volumes", () => {
        return new HttpResponse(null, { status: 429 });
      }),
    );

    await expect(searchGoogleBooks("rate limited case")).rejects.toThrow(
      "A busca de livros atingiu o limite de requisições. Tente novamente em instantes.",
    );
  });

  it("paginates using page and pageSize parameters", async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get("https://www.googleapis.com/books/v1/volumes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ kind: "books#volumes", totalItems: 0, items: [] });
      }),
    );

    await searchGoogleBooks("test", 2, 5);
    expect(capturedUrl).toContain("startIndex=10"); // page 2 × pageSize 5
    expect(capturedUrl).toContain("maxResults=5");
  });

  it("encodes special characters in query", async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get("https://www.googleapis.com/books/v1/volumes", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ kind: "books#volumes", totalItems: 0, items: [] });
      }),
    );

    await searchGoogleBooks("O Senhor dos Anéis");
    expect(capturedUrl).toContain(encodeURIComponent("O Senhor dos Anéis"));
  });
});

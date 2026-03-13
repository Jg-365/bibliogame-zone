import { http, HttpResponse } from "msw";
import { server } from "../utils/mswServer";
import { searchGoogleBooks } from "@/integrations/googleBooks/client";

describe("searchGoogleBooks", () => {
  it("returns ranked results from the Google Books API", async () => {
    const result = await searchGoogleBooks("Harry Potter");
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.totalItems).toBe(1);
    expect(result.items[0].volumeInfo?.title).toContain("Mock Book");
  });

  it("returns empty arrays on API error", async () => {
    server.use(
      http.get("https://www.googleapis.com/books/v1/volumes", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const result = await searchGoogleBooks("error case");
    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
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

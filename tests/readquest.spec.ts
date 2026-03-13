/**
 * ReadQuest E2E smoke tests.
 *
 * Auth strategy: intercept Supabase REST/auth endpoints at the network layer
 * using page.route() instead of patching localStorage (the old v1 token key
 * is not used by Supabase JS v2).
 *
 * These tests validate that pages load, are navigable, and are responsive.
 * They do NOT require a real Supabase backend.
 */
import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mock the Supabase auth REST endpoints so the app considers the user signed
 * in without a real backend.  Call this before page.goto().
 */
async function mockSupabaseAuth(page: Page) {
  const mockUser = {
    id: "e2e-test-user-id",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@readquest.test",
    email_confirmed_at: new Date().toISOString(),
    user_metadata: { full_name: "E2E User", avatar_url: null },
    app_metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockSession = {
    access_token: "e2e-mock-access-token",
    refresh_token: "e2e-mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUser,
  };

  // Intercept the token/session endpoint Supabase JS v2 uses on startup
  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({ json: mockSession, status: 200 });
  });

  // Intercept the user endpoint
  await page.route("**/auth/v1/user**", async (route) => {
    await route.fulfill({ json: mockUser, status: 200 });
  });

  // Return empty data for all REST queries to avoid runtime errors
  await page.route("**/rest/v1/**", async (route) => {
    const method = route.request().method();
    if (method === "GET") {
      await route.fulfill({ json: [], status: 200 });
    } else {
      await route.fulfill({ json: {}, status: 200 });
    }
  });

  // Persist the Supabase v2 token key in localStorage so the client picks it up
  await page.addInitScript((session) => {
    const storageKey =
      Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token")) ??
      "sb-mock-auth-token";
    localStorage.setItem(storageKey, JSON.stringify(session));
  }, mockSession);
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

test.describe("ReadQuest — Public (unauthenticated)", () => {
  test("authentication page renders email and password fields", async ({ page }) => {
    await page.goto("/");

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible();
  });

  test("login form is accessible (has labels)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });

    const labelCount = await page.locator("label").count();
    const ariaLabels = await page.locator("[aria-label]").count();
    expect(labelCount + ariaLabels).toBeGreaterThan(0);
  });
});

test.describe("ReadQuest — Navigation", () => {
  test("navigating to /social does not result in blank page", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/social");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("navigating to /profile does not result in blank page", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/profile");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test("navigating to /library does not result in blank page", async ({ page }) => {
    await mockSupabaseAuth(page);
    await page.goto("/library");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(0);
  });
});

test.describe("ReadQuest — Responsive layout", () => {
  const viewports = [
    { name: "Mobile 375", width: 375, height: 667 },
    { name: "Tablet 768", width: 768, height: 1024 },
    { name: "Desktop 1280", width: 1280, height: 800 },
  ] as const;

  for (const { name, width, height } of viewports) {
    test(`page fits viewport on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      const scrollWidth: number = await page
        .locator("body")
        .evaluate((el: HTMLElement) => el.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(width + 20);
    });
  }
});

test.describe("ReadQuest — Accessibility basics", () => {
  test("home page has a heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1, h2")).toBeVisible({ timeout: 10_000 });
  });

  test("page has a lang attribute on the html element", async ({ page }) => {
    await page.goto("/");
    const lang = await page.locator("html").getAttribute("lang");
    expect(lang).toBeTruthy();
  });
});


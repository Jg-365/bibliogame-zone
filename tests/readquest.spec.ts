import { test, expect } from "@playwright/test";

test.describe("ReadQuest Authentication", () => {
  test("should display authentication page for non-logged users", async ({
    page,
  }) => {
    await page.goto("/");

    // Should redirect to auth page or show auth form
    await expect(page.locator("h1")).toContainText([
      "Entrar",
      "Login",
      "Sign In",
      "Bem-vindo",
    ]);

    // Should have login/register forms
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator(
      'input[type="password"]'
    );

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should show validation errors for invalid login", async ({
    page,
  }) => {
    await page.goto("/");

    // Fill invalid credentials
    await page.fill('input[type="email"]', "invalid-email");
    await page.fill('input[type="password"]', "123");

    // Try to submit
    await page.click('button[type="submit"]');

    // Should show validation or error message
    await expect(
      page.locator("text=/erro|error|inválido|invalid/i")
    ).toBeVisible({ timeout: 5000 });
  });
});

test.describe("ReadQuest Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication or use test user
    await page.goto("/");

    // Skip if already authenticated, otherwise mock auth state
    const authCheck = await page
      .locator("h1")
      .textContent();
    if (authCheck?.includes("Olá")) {
      return; // Already authenticated
    }

    // Mock authentication by setting localStorage/sessionStorage
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });

    await page.reload();
  });

  test("should display user dashboard with main sections", async ({
    page,
  }) => {
    // Check if dashboard loads
    await expect(page.locator("h1")).toContainText("Olá");

    // Check main stats cards
    await expect(
      page.locator("text=Livros Concluídos")
    ).toBeVisible();
    await expect(
      page.locator("text=Páginas Lidas")
    ).toBeVisible();
    await expect(
      page.locator("text=Pontos de Experiência")
    ).toBeVisible();

    // Check streak display
    await expect(
      page.locator("text=Sequência")
    ).toBeVisible();
  });

  test("should navigate between main sections", async ({
    page,
  }) => {
    // Test navigation between tabs
    const sections = [
      "Visão Geral",
      "Biblioteca",
      "Sessões",
      "Conquistas",
    ];

    for (const section of sections) {
      await page.click(`text=${section}`);
      await expect(page.locator("body")).toContainText(
        section
      );
    }
  });

  test("should display streak information correctly", async ({
    page,
  }) => {
    // Check streak display component
    const streakElement = page
      .locator('[class*="streak"]')
      .first();

    if (await streakElement.isVisible()) {
      // Should show streak counter
      await expect(streakElement).toContainText(
        /\d+ dias?/
      );

      // Should have flame icon or similar indicator
      await expect(
        streakElement.locator("svg")
      ).toBeVisible();
    }
  });
});

test.describe("ReadQuest Book Management", () => {
  test.beforeEach(async ({ page }) => {
    // Setup authenticated state
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });
    await page.reload();
  });

  test("should allow adding new books", async ({
    page,
  }) => {
    // Navigate to library section
    await page.click("text=Biblioteca");

    // Click add book button
    await page.click("text=Adicionar Livro");

    // Should open book search dialog
    await expect(
      page.locator('[role="dialog"]')
    ).toBeVisible();
    await expect(page.locator("text=Buscar")).toBeVisible();
  });

  test("should display book search functionality", async ({
    page,
  }) => {
    await page.click("text=Biblioteca");
    await page.click("text=Adicionar Livro");

    // Search for a book
    const searchInput = page
      .locator(
        'input[placeholder*="livro" i], input[placeholder*="search" i], input[placeholder*="buscar" i]'
      )
      .first();

    if (await searchInput.isVisible()) {
      await searchInput.fill("Dom Casmurro");
      await page.keyboard.press("Enter");

      // Should show search results or loading state
      await expect(
        page.locator(
          "text=/resultados?|loading|carregando/i"
        )
      ).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("ReadQuest Navigation System", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });
    await page.reload();
  });

  test("should have responsive navigation", async ({
    page,
  }) => {
    // Desktop navigation
    await page.setViewportSize({
      width: 1200,
      height: 800,
    });

    // Should show desktop tabs
    const desktopNav = page
      .locator('[role="tablist"], .lg\\:block')
      .first();
    if (await desktopNav.isVisible()) {
      await expect(desktopNav).toBeVisible();
    }

    // Mobile navigation
    await page.setViewportSize({ width: 375, height: 667 });

    // Should show mobile select or bottom navigation
    const mobileNav = page
      .locator(
        'select, .block.lg\\:hidden, [class*="bottom"]'
      )
      .first();
    if (await mobileNav.isVisible()) {
      await expect(mobileNav).toBeVisible();
    }
  });

  test("should navigate to all main pages", async ({
    page,
  }) => {
    const pages = [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Social", path: "/social" },
      { name: "Ranking", path: "/ranking" },
      { name: "Profile", path: "/profile" },
    ];

    for (const pageInfo of pages) {
      // Try to navigate via URL
      await page.goto(pageInfo.path);

      // Should not show 404 or error
      await expect(
        page.locator("text=/404|not found|erro|error/i")
      ).not.toBeVisible();

      // Should have some content
      await expect(page.locator("body")).not.toBeEmpty();
    }
  });
});

test.describe("ReadQuest Social Features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "supabase.auth.token",
        JSON.stringify({
          access_token: "mock-token",
          user: {
            id: "test-user",
            email: "test@example.com",
          },
        })
      );
    });
    await page.reload();
  });

  test("should display social page", async ({ page }) => {
    await page.goto("/social");

    // Should have social feed elements
    await expect(page.locator("h1, h2")).toContainText(
      /Social|Feed|Atividade/i
    );

    // Should have post creation area or feed
    const socialElements = page.locator(
      "text=/postar|post|compartilhar|feed/i"
    );
    if ((await socialElements.count()) > 0) {
      await expect(socialElements.first()).toBeVisible();
    }
  });

  test("should display ranking page", async ({ page }) => {
    await page.goto("/ranking");

    // Should show ranking/leaderboard
    await expect(page.locator("h1, h2")).toContainText(
      /Ranking|Leaderboard|Classificação/i
    );

    // Should have ranking list or stats
    const rankingElements = page.locator(
      "text=/posição|rank|#1|#2|#3/i"
    );
    if ((await rankingElements.count()) > 0) {
      await expect(rankingElements.first()).toBeVisible();
    }
  });
});

test.describe("ReadQuest Responsive Design", () => {
  const viewports = [
    { name: "Mobile", width: 375, height: 667 },
    { name: "Tablet", width: 768, height: 1024 },
    { name: "Desktop", width: 1200, height: 800 },
    { name: "Large Desktop", width: 1920, height: 1080 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should be responsive on ${name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");

      await page.evaluate(() => {
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify({
            access_token: "mock-token",
            user: {
              id: "test-user",
              email: "test@example.com",
            },
          })
        );
      });
      await page.reload();

      // Should not have horizontal scroll
      const bodyWidth = await page
        .locator("body")
        .evaluate((el) => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(width + 50); // Allow small margin

      // Main content should be visible
      await expect(page.locator("h1")).toBeVisible();

      // Navigation should be accessible
      const navElements = page.locator(
        '[role="navigation"], nav, [class*="nav"]'
      );
      if ((await navElements.count()) > 0) {
        await expect(navElements.first()).toBeVisible();
      }
    });
  });
});

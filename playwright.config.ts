import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * Tests run against the dev server (started automatically).
 */
export default defineConfig({
  testDir: "./tests",
  // Run tests in parallel within a file
  fullyParallel: true,
  // Fail the build if any test.only is committed
  forbidOnly: !!process.env.CI,
  // Retry once on CI
  retries: process.env.CI ? 1 : 0,
  // Single worker in CI to avoid resource contention
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    // Base URL to use in tests
    baseURL: "http://localhost:5173",
    // Collect traces on first retry
    trace: "on-first-retry",
    // Short navigation timeout
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Start dev server before running tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

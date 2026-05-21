import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://localhost:3000";
const isProduction = process.env.PW_PRODUCTION === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "dev",
      testIgnore: /production guards/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "production",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /shell-navigation\.spec\.ts/,
      grep: /production guards/,
    },
  ],
  webServer: isProduction
    ? {
        command: "pnpm build && pnpm start",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : {
        command: "pnpm dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});

import fs from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

const baseURL = "http://localhost:3000";
const isProduction = process.env.PW_PRODUCTION === "1";

function webServerEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }
  env.E2E_DISABLE_RATE_LIMIT = "1";
  return env;
}

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : hasSupabaseEnv() ? 1 : undefined,
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
        reuseExistingServer: !process.env.CI && !hasSupabaseEnv(),
        timeout: 180_000,
        env: webServerEnv(),
      },
});

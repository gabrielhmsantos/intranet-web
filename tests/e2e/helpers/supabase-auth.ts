import { expect, type BrowserContext, type Page } from "@playwright/test";

export const DEV_PASSWORD = "DevSeedEP0!ChangeMe";
export const AUTH_NAV_TIMEOUT = 30_000;

export const hasSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const SEED_EMAIL: Record<
  "employee" | "hr" | "tenant_admin" | "platform_admin",
  string
> = {
  employee: "employee@alpha-dev.test",
  hr: "hr@alpha-dev.test",
  tenant_admin: "admin@alpha-dev.test",
  platform_admin: "platform@intranet-dev.test",
};

export async function loginSupabase(
  page: Page,
  email: string,
  expectedUrl: RegExp = /\/(dashboard|plataforma\/dashboard)/,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Palavra-passe").fill(DEV_PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(expectedUrl, { timeout: AUTH_NAV_TIMEOUT });
}

export async function authenticateAs(
  page: Page,
  context: BrowserContext,
  role: keyof typeof SEED_EMAIL,
  setDevCookies: (ctx: BrowserContext, devRole: string) => Promise<void>,
): Promise<void> {
  if (hasSupabase) {
    const dest =
      role === "platform_admin"
        ? /\/plataforma\/dashboard/
        : /\/dashboard/;
    await loginSupabase(page, SEED_EMAIL[role], dest);
    return;
  }
  await setDevCookies(context, role);
}

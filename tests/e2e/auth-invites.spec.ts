import { test, expect } from "@playwright/test";
import {
  AUTH_NAV_TIMEOUT,
  DEV_PASSWORD,
  hasSupabase,
  loginSupabase,
} from "./helpers/supabase-auth";

const PENDING_EMPLOYEE_ID = "c0000000-0000-4000-8000-000000000099";
const ACTIVATE_PASSWORD = "Teste1234";

test.describe("auth invites (Supabase)", () => {
  test.skip(!hasSupabase, "Requires Supabase env in webServer");

  test("BFF-04 login tenant admin reaches dashboard", async ({ page }) => {
    await loginSupabase(page, "admin@alpha-dev.test", /\/dashboard$/);
  });

  test("BFF-04 platform admin reaches plataforma dashboard", async ({ page }) => {
    await loginSupabase(
      page,
      "platform@intranet-dev.test",
      /\/plataforma\/dashboard$/,
    );
  });

  test("invalid credentials show generic error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("admin@alpha-dev.test");
    await page.getByLabel("Palavra-passe").fill("wrong-password");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByTestId("login-error")).toContainText(
      "Credenciais inválidas",
    );
  });

  test("BFF-06 invalid convite shows D-09", async ({ page }) => {
    await page.goto("/convite/token-invalido-test");
    await expect(page.getByTestId("convite-invalid")).toBeVisible();
    await expect(page.getByLabel("Palavra-passe")).toHaveCount(0);
  });

  test("BFF-07 RH blocked from configuracao", async ({ page }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/configuracao");
    await expect(page).toHaveURL(/\/sem-permissao/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
  });

  test("BFF-08 platform admin tenant dashboard redirects", async ({ page }) => {
    await loginSupabase(page, "platform@intranet-dev.test", /\/plataforma\/dashboard/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/plataforma\/dashboard/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
  });

  test("T061 evil redirect after login stays on app origin", async ({ page }) => {
    await page.goto(
      "/login?redirect=https://evil.example/phish",
    );
    await page.getByLabel("E-mail").fill("admin@alpha-dev.test");
    await page.getByLabel("Palavra-passe").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
    expect(page.url()).toMatch(/^http:\/\/localhost:3000\//);
  });

  test("T061 tenant_admin can open configuracao", async ({ page }) => {
    await loginSupabase(page, "admin@alpha-dev.test");
    await page.goto("/configuracao");
    await expect(page).toHaveURL(/\/configuracao/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
    await expect(page.getByTestId("tenant-shell")).toBeVisible();
  });

  test("T061 employee blocked from eventos/novo", async ({ page }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/eventos/novo");
    await expect(page).toHaveURL(/\/sem-permissao/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
  });

  test("SC-008 login page has no criar conta", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText(/criar conta/i)).toHaveCount(0);
  });

  test("CS-007 orphan user cannot stay authenticated", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("orphan@intranet-dev.test");
    await page.getByLabel("Palavra-passe").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByTestId("login-error")).toContainText(
      "Credenciais inválidas",
    );
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/, { timeout: AUTH_NAV_TIMEOUT });
  });

  test("BFF-05 convite feliz: gerar, activar e login", async ({
    page,
    browser,
  }) => {
    test.setTimeout(120_000);

    await loginSupabase(page, "hr@alpha-dev.test");

    const inviteRes = await page.request.post("/api/invites", {
      data: { employeeId: PENDING_EMPLOYEE_ID },
    });

    async function signOutCurrentUser() {
      await page.getByTestId("user-menu-trigger").click();
      await page.getByRole("menuitem", { name: "Terminar sessão" }).click();
      await expect(page).toHaveURL(/\/login/, { timeout: AUTH_NAV_TIMEOUT });
    }

    async function loginAsPending() {
      await signOutCurrentUser();
      await page.getByLabel("E-mail").fill("pendente@alpha-dev.test");
      await page.getByLabel("Palavra-passe").fill(ACTIVATE_PASSWORD);
      await page.getByRole("button", { name: "Entrar" }).click();
      await expect(page).toHaveURL(/\/dashboard$/, {
        timeout: AUTH_NAV_TIMEOUT,
      });
    }

    if (inviteRes.status() === 409) {
      await loginAsPending();
      return;
    }

    expect(inviteRes.status()).toBe(201);
    const { inviteUrl } = (await inviteRes.json()) as { inviteUrl: string };

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(inviteUrl, { waitUntil: "networkidle" });
    await guestPage.getByLabel("Palavra-passe").first().fill(ACTIVATE_PASSWORD);
    await guestPage
      .getByLabel("Confirmar palavra-passe")
      .fill(ACTIVATE_PASSWORD);
    await guestPage.getByRole("button", { name: "Activar conta" }).click();
    await expect(guestPage.getByTestId("convite-success")).toBeVisible({
      timeout: AUTH_NAV_TIMEOUT,
    });
    await guestPage.getByRole("button", { name: "Ir para o login" }).click();
    await expect(guestPage).toHaveURL(/\/login/, { timeout: AUTH_NAV_TIMEOUT });
    await guest.close();

    await signOutCurrentUser();
    await page.getByLabel("E-mail").fill("pendente@alpha-dev.test");
    await page.getByLabel("Palavra-passe").fill(ACTIVATE_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/dashboard$/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
  });
});

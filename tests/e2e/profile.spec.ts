import { test, expect } from "@playwright/test";
import {
  authenticateAs,
  DEV_PASSWORD,
  hasSupabase,
} from "./helpers/supabase-auth";

const DEV_AUTH = "dev_auth";
const DEV_ROLE = "dev_role";
const EP6_INVITE_TOKEN = "e2e-ep6-invite-seed-token";
const NEW_PASSWORD = "Teste1234";

async function setDevCookies(
  context: import("@playwright/test").BrowserContext,
  role: string,
) {
  await context.addCookies([
    { name: DEV_AUTH, value: "1", url: "http://localhost:3000" },
    { name: DEV_ROLE, value: role, url: "http://localhost:3000" },
  ]);
}

test.describe("perfil", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("campos nome intranet, email e cadastro", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/perfil", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("profile-form")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("profile-display-name")).toBeVisible();
    await expect(page.getByTestId("profile-email")).toBeDisabled();
    await expect(page.getByTestId("profile-cadastro-name")).toHaveValue(
      "João Pinto Silva",
    );
  });

  test("alterar nome de exibição reflecte no header", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-display-name")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("profile-display-name").fill("João Silva");
    await page.getByRole("button", { name: "Guardar nome" }).click();
    await expect(page.getByText("Nome de exibição actualizado.")).toBeVisible({
      timeout: 10_000,
    });
    await page.reload();
    await page.getByTestId("user-menu-trigger").click();
    await expect(page.getByText("João Silva")).toBeVisible();
  });

  test("ficha RH mantém cadastro após editar perfil", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    test.setTimeout(90_000);
    await page.goto("/perfil");
    await expect(page.getByTestId("profile-display-name")).toBeVisible({
      timeout: 15_000,
    });
    await page.getByTestId("profile-display-name").fill("João Silva");
    await page.getByRole("button", { name: "Guardar nome" }).click();
    await expect(page.getByText("Nome de exibição actualizado.")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByTestId("user-menu-trigger").click();
    await page.getByRole("menuitem", { name: "Terminar sessão" }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });
    await context.clearCookies();
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000012");
    await expect(page.getByText("João Pinto Silva")).toBeVisible();

    await page.goto("/colaboradores");
    await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("João Silva")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Maria Santos")).toBeVisible();
  });

  test("password sucesso e erro de confirmação", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/perfil");
    await page.getByTestId("profile-current-password").fill(DEV_PASSWORD);
    await page.getByTestId("profile-new-password").fill(NEW_PASSWORD);
    await page.getByTestId("profile-confirm-password").fill("mismatch");
    await page.getByRole("button", { name: "Alterar palavra-passe" }).click();
    await expect(
      page.getByText("A confirmação não coincide com a nova palavra-passe."),
    ).toBeVisible();

    await page.getByTestId("profile-confirm-password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Alterar palavra-passe" }).click();
    await expect(page.getByText("Palavra-passe actualizada.")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("profile-current-password").fill(NEW_PASSWORD);
    await page.getByTestId("profile-new-password").fill(DEV_PASSWORD);
    await page.getByTestId("profile-confirm-password").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Alterar palavra-passe" }).click();
    await expect(page.getByText("Palavra-passe actualizada.")).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe("perfil — convite EP-6", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    test.skip(!hasSupabase, "Requer Supabase");
    const { spawnSync } = await import("node:child_process");
    const result = spawnSync("node", ["scripts/reset-dev-passwords.mjs"], {
      cwd: process.cwd(),
      stdio: "inherit",
    });
    if (result.status !== 0) {
      throw new Error("reset-dev-passwords.mjs failed");
    }
  });

  test("activar convite inicializa nome na lista", async ({ page, browser }) => {
    test.skip(!hasSupabase, "Requer Supabase e seed EP-6");

    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    await guestPage.goto(`/convite/${EP6_INVITE_TOKEN}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(guestPage.getByLabel("Palavra-passe").first()).toBeVisible({
      timeout: 15_000,
    });
    await guestPage.getByLabel("Palavra-passe").first().fill(NEW_PASSWORD);
    await guestPage.getByLabel("Confirmar palavra-passe").fill(NEW_PASSWORD);
    await guestPage.getByRole("button", { name: "Activar conta" }).click();
    await expect(guestPage.getByTestId("convite-success")).toBeVisible({
      timeout: 30_000,
    });
    await guest.close();

    await authenticateAs(page, page.context(), "hr", setDevCookies);
    await page.goto("/colaboradores");
    await expect(page.getByText("Alpha Pending Invite")).toBeVisible();
  });
});

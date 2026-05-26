import { test, expect } from "@playwright/test";
import {
  authenticateAs,
  hasSupabase,
  loginSupabase,
} from "./helpers/supabase-auth";

const DEV_AUTH = "dev_auth";
const DEV_ROLE = "dev_role";

async function setDevCookies(
  context: import("@playwright/test").BrowserContext,
  role: string,
) {
  await context.addCookies([
    { name: DEV_AUTH, value: "1", url: "http://localhost:3000" },
    { name: DEV_ROLE, value: role, url: "http://localhost:3000" },
  ]);
}

test.describe("internal events — RH", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "hr", setDevCookies);
  });

  test("lista com botão Novo evento", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await page.goto("/eventos");
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo evento" })).toBeVisible();
    await expect(page.getByText("All hands Alpha")).toBeVisible();
  });
});

test.describe("internal events — gestor/colaborador", () => {
  test("lista sem Novo evento (gestor)", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "manager", setDevCookies);
    await page.goto("/eventos");
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo evento" })).toHaveCount(0);
  });

  test("detalhe read-only (colaborador)", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/eventos/e0000000-0000-4000-8000-000000000010");
    await expect(page.getByRole("heading", { name: "All hands Alpha" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Cancelar evento" })).toHaveCount(0);
  });

  test("/eventos/novo negado para colaborador", async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/eventos/novo");
    if (hasSupabase) {
      await expect(page).toHaveURL(/sem-permissao/);
    } else {
      await expect(page).toHaveURL(/sem-permissao|eventos\/novo/);
    }
  });
});

test.describe("SC-003 role matrix", () => {
  test("RH pode mutar; gestor só leitura", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto("/eventos/e0000000-0000-4000-8000-000000000010");
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();

    await authenticateAs(page, context, "manager", setDevCookies);
    await page.goto("/eventos/e0000000-0000-4000-8000-000000000010");
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  });
});

test.describe("cross-tenant CS-01", () => {
  test("hr beta não vê evento alpha", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await loginSupabase(page, "hr@beta-dev.test");
    const res = await page.request.get(
      "http://localhost:3000/api/events/e0000000-0000-4000-8000-000000000010",
    );
    expect(res.status()).toBe(404);
  });
});

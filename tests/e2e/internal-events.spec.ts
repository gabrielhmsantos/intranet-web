import { test, expect } from "@playwright/test";
import {
  authenticateAs,
  hasSupabase,
  loginSupabase,
} from "./helpers/supabase-auth";

const DEV_AUTH = "dev_auth";
const DEV_ROLE = "dev_role";

const RH_DEPT = "d0000000-0000-4000-8000-000000000011";
const ALL_HANDS_ID = "e0000000-0000-4000-8000-000000000010";

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
  test("lista sem Novo evento (colaborador)", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/eventos");
    await expect(page.getByRole("heading", { name: "Eventos" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo evento" })).toHaveCount(0);
  });

  test("detalhe read-only (colaborador)", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto(`/eventos/${ALL_HANDS_ID}`);
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
  test("RH pode mutar; gestor só leitura em evento RH", async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto(`/eventos/${ALL_HANDS_ID}`);
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();

    await authenticateAs(page, context, "manager", setDevCookies);
    await page.goto(`/eventos/${ALL_HANDS_ID}`);
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  });
});

test.describe("EP-9 manager events", () => {
  test("gestor vê Novo evento (Supabase)", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto("/eventos");
    await expect(page.getByRole("link", { name: "Novo evento" })).toBeVisible();
  });

  test("formulário gestor sem Toda a empresa", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto("/eventos/novo");
    await expect(page.getByText("Toda a empresa")).toHaveCount(0);
    await expect(page.getByText("Departamento")).toBeVisible();
  });

  test("gestor cria evento para Engenharia", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto("/eventos/novo");

    const title = `Standup EP9 ${Date.now()}`;
    await page.getByLabel("Título").fill(title);

    const now = new Date();
    now.setDate(now.getDate() + 2);
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T10:00`;

    await page.getByLabel("Início").fill(local);
    await page.getByLabel("Fim").fill(local.replace("T10:00", "T11:00"));

    await page.getByText("Departamento", { exact: true }).click();
    await page.getByLabel("Departamento").click();
    await page.getByRole("option", { name: "Engenharia" }).click();

    await page.getByRole("button", { name: "Criar evento" }).click();
    await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 15000 });
  });

  test("gestor não edita evento RH (All hands)", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto(`/eventos/${ALL_HANDS_ID}`);
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
  });

  test("RH mantém Toda a empresa", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/eventos/novo");
    await expect(page.getByText("Toda a empresa")).toBeVisible();
  });

  test("POST create com departamento não gerido → 403", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");

    const starts = new Date(Date.now() + 86400000).toISOString();
    const ends = new Date(Date.now() + 90000000).toISOString();

    const res = await page.request.post("http://localhost:3000/api/events", {
      data: {
        title: "RH only",
        startsAt: starts,
        endsAt: ends,
        audience: { type: "department", departmentId: RH_DEPT },
      },
    });
    expect(res.status()).toBe(403);
  });

  test("gestor PATCH evento RH → 403", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-9");
    await loginSupabase(page, "manager@alpha-dev.test");
    const res = await page.request.patch(
      `http://localhost:3000/api/events/${ALL_HANDS_ID}`,
      { data: { title: "Hack" } },
    );
    expect(res.status()).toBe(403);
  });
});

test.describe("cross-tenant CS-01", () => {
  test("hr beta não vê evento alpha", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e migração EP-4");
    await loginSupabase(page, "hr@beta-dev.test");
    const res = await page.request.get(
      `http://localhost:3000/api/events/${ALL_HANDS_ID}`,
    );
    expect(res.status()).toBe(404);
  });
});

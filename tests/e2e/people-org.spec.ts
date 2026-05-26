import { test, expect } from "@playwright/test";
import {
  AUTH_NAV_TIMEOUT,
  DEV_PASSWORD,
  loginSupabase,
  hasSupabase,
} from "./helpers/supabase-auth";

test.describe("people org (EP-3)", () => {
  test.skip(!hasSupabase, "Requires Supabase env in webServer");

  test("quickstart §3 #1 — employee lists active colleagues and opens profile", async ({
    page,
  }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/colaboradores");
    await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo colaborador" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Conta" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Convite" })).toHaveCount(0);
    await expect(page.getByRole("table")).toBeVisible();
    await page.getByRole("row").filter({ hasText: "Alpha HR Lead" }).click();
    await expect(page).toHaveURL(/\/colaboradores\/[0-9a-f-]+$/, {
      timeout: AUTH_NAV_TIMEOUT,
    });
  });

  test("quickstart §3 #2 — employee views colleague profile without edit or invite", async ({
    page,
  }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000011");
    await expect(page.getByText("Alpha HR Lead")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Acesso" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Editar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Gerar convite" })).toHaveCount(0);
  });

  test("quickstart §3 #3 — employee organograma read-only", async ({ page }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("heading", { name: "Organograma" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toHaveCount(0);
    await expect(page.getByText("Engenharia")).toBeVisible();
    await page.getByRole("button", { name: /Engenharia/ }).click();
    await expect(page.getByRole("link", { name: "Alpha Staff One" })).toBeVisible();
  });

  test("quickstart §3 #4 — HR creates employee via dialog", async ({ page }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/colaboradores");
    await page.getByRole("button", { name: "Novo colaborador" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("US4 — department, manager and extension visible in list and profile", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    const unique = `Org E2E ${Date.now()}`;
    const createRes = await page.request.post("/api/employees", {
      data: {
        displayName: unique,
        workEmail: `org-e2e-${Date.now()}@alpha-dev.test`,
        departmentId: "d0000000-0000-4000-8000-000000000010",
        managerId: "c0000000-0000-4000-8000-000000000013",
        extensionNumber: "4321",
      },
    });
    expect(createRes.status()).toBe(201);
    const { id } = (await createRes.json()) as { id: string };

    await page.goto("/colaboradores");
    await expect(
      page.getByRole("row").filter({ hasText: unique }),
    ).toContainText("Engenharia");

    await page.goto(`/colaboradores/${id}`);
    await expect(page.getByText("Engenharia")).toBeVisible();
    await expect(page.getByText("Alpha Team Lead")).toBeVisible();
    await expect(page.getByText("4321")).toBeVisible();
  });

  test("quickstart §3 #5 — HR generates invite on profile", async ({ page }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    const unique = `Invite E2E ${Date.now()}`;
    const createRes = await page.request.post("/api/employees", {
      data: {
        displayName: unique,
        workEmail: `invite-e2e-${Date.now()}@alpha-dev.test`,
      },
    });
    expect(createRes.status()).toBe(201);
    const { id } = (await createRes.json()) as { id: string };

    await page.goto(`/colaboradores/${id}`);
    await expect(page.getByRole("heading", { name: unique })).toBeVisible();
    await page.getByRole("button", { name: "Gerar convite" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Gerar link" }).click();
    await expect(page.getByLabel("Link do convite")).toBeVisible({
      timeout: AUTH_NAV_TIMEOUT,
    });
  });

  test("quickstart §3 #6–#7 — HR deactivates; employee no longer sees; inactive URL 404", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000098");

    const reactivate = page.getByRole("button", { name: "Reactivar" });
    if (await reactivate.isVisible()) {
      await reactivate.click();
      await expect(
        page.locator("[data-sonner-toast]").filter({
          hasText: "Colaborador reactivado.",
        }),
      ).toBeVisible();
    }

    await page.getByRole("button", { name: "Desactivar" }).click();
    await page.getByRole("button", { name: "Desactivar" }).last().click();
    await expect(
      page.locator("[data-sonner-toast]").filter({
        hasText: "Colaborador desactivado.",
      }),
    ).toBeVisible();

    await page.context().clearCookies();
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/colaboradores");
    await expect(page.getByText("Alpha Former Staff")).toHaveCount(0);

    const res = await page.goto(
      "/colaboradores/c0000000-0000-4000-8000-000000000098",
    );
    expect(res?.status()).toBe(404);
  });

  test("quickstart §3 #8 — HR sees organograma and members", async ({ page }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toBeVisible();
    await page.getByRole("button", { name: /Recursos Humanos/ }).click();
    await expect(
      page.getByRole("link", { name: "Alpha HR Lead" }).first(),
    ).toBeVisible();
  });

  test("quickstart §3 #9–#10 — create department; delete blocked with actives", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    const unique = `Dept Test ${Date.now()}`;
    const createRes = await page.request.post("/api/departments", {
      data: { name: unique },
    });
    expect(createRes.status()).toBe(201);

    await page.goto("/organograma");
    await expect(page.getByText(unique)).toBeVisible();

    const deleteEng = await page.request.delete(
      "/api/departments/d0000000-0000-4000-8000-000000000010",
    );
    expect(deleteEng.status()).toBe(409);
  });

  test("quickstart §3 #11 — block deactivate department manager", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000013");
    await page.getByRole("button", { name: "Desactivar" }).click();
    await page.getByRole("button", { name: "Desactivar" }).last().click();
    await expect(page.locator("[data-sonner-toast]")).toContainText(
      /gestor de departamento/i,
    );
  });

  test("quickstart §3 #12 — manager has no Novo colaborador", async ({ page }) => {
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto("/colaboradores");
    await expect(page.getByRole("button", { name: "Novo colaborador" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Conta" })).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: "Convite" })).toHaveCount(0);
  });

  test("quickstart §3 #13 — hr@beta lists zero alpha employees (CS-01)", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@beta-dev.test");
    await page.goto("/colaboradores");
    await expect(page.getByText("Alpha HR Lead")).toHaveCount(0);
    await expect(page.getByText("Alpha Staff One")).toHaveCount(0);
  });

  test("quickstart §3.1 SC-004 — optional inactive filter for HR", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/colaboradores");
    await page.getByLabel("Ver desligados").click();
    await expect(page.getByText("Alpha Former Staff")).toBeVisible();
  });

  test("CS-01 — hr@beta cannot access alpha employee profile", async ({ page }) => {
    await loginSupabase(page, "hr@beta-dev.test");
    const res = await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000012");
    expect(res?.status()).toBe(404);
  });

  test("SC-003 — manager POST /api/departments returns 403", async ({
    page,
  }) => {
    await loginSupabase(page, "manager@alpha-dev.test");
    const res = await page.request.post("/api/departments", {
      data: { name: "Blocked Dept" },
    });
    expect(res.status()).toBe(403);
  });

  test("SC-003 — tenant_admin can create department via API", async ({
    page,
  }) => {
    await loginSupabase(page, "admin@alpha-dev.test");
    const res = await page.request.post("/api/departments", {
      data: { name: `Admin Dept ${Date.now()}` },
    });
    expect(res.status()).toBe(201);
  });

  test("SC-003 — tenant_admin sees Novo colaborador", async ({ page }) => {
    await loginSupabase(page, "admin@alpha-dev.test");
    await page.goto("/colaboradores");
    await expect(page.getByRole("button", { name: "Novo colaborador" })).toBeVisible();
  });

  test("US8 — hr and tenant_admin see Gerir departamentos; employee does not", async ({
    page,
  }) => {
    await loginSupabase(page, "hr@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toBeVisible();

    await page.context().clearCookies();
    await loginSupabase(page, "admin@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toBeVisible();

    await page.context().clearCookies();
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toHaveCount(0);
  });

  test("US8 — manager has no Gerir departamentos", async ({ page }) => {
    await loginSupabase(page, "manager@alpha-dev.test");
    await page.goto("/organograma");
    await expect(page.getByRole("button", { name: "Gerir departamentos" })).toHaveCount(0);
  });

  test("US5 — employee with account has no invite button", async ({ page }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/colaboradores/c0000000-0000-4000-8000-000000000012");
    await expect(page.getByRole("button", { name: "Gerar convite" })).toHaveCount(0);
  });

  test("FR-023 — pending employee cannot login with work email", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("pendente@alpha-dev.test");
    await page.getByLabel("Palavra-passe").fill(DEV_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("SC-001 smoke — search by name on employee list", async ({ page }) => {
    await loginSupabase(page, "employee@alpha-dev.test");
    await page.goto("/colaboradores");
    await page.getByPlaceholder("Pesquisar por nome…").fill("HR Lead");
    await page.getByRole("button", { name: "Pesquisar" }).click();
    await expect(page.getByText("Alpha HR Lead")).toBeVisible();
    await expect(page.getByText("Alpha Staff One")).toHaveCount(0);
  });
});

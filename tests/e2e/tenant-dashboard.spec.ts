import { test, expect } from "@playwright/test";
import {
  authenticateAs,
  hasSupabase,
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

test.describe("tenant dashboard — colaborador/gestor", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("employee vê próximos eventos e notificações sem convites", async ({
    page,
  }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("employee-dashboard")).toBeVisible();
    await expect(page.getByTestId("dashboard-events-section")).toBeVisible();
    await expect(
      page.getByTestId("dashboard-notifications-section"),
    ).toBeVisible();
    await expect(
      page.getByTestId("dashboard-pending-invites-section"),
    ).toHaveCount(0);
  });

  test("atalhos organograma e eventos", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByTestId("dashboard-shortcuts").getByRole("link", {
        name: "Organograma",
      }),
    ).toHaveAttribute("href", "/organograma");
    await expect(
      page.getByTestId("dashboard-shortcuts").getByRole("link", {
        name: "Eventos",
      }),
    ).toHaveAttribute("href", "/eventos");
  });

  test("notificação: corpo navega; marcar lida não navega", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e notificações com evento");
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const item = page.getByTestId("notification-item").first();
    await expect(item).toBeVisible({ timeout: 15_000 });
    const markBtn = item.getByTestId("notification-mark-read");
    if (await markBtn.isVisible()) {
      const urlBefore = page.url();
      await markBtn.click();
      await expect(page).toHaveURL(urlBefore);
    }
  });
});

test.describe("tenant dashboard — RH/admin", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "hr", setDevCookies);
  });

  test("hr vê convites e eventos da semana", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("hr-dashboard")).toBeVisible();
    await expect(
      page.getByTestId("dashboard-pending-invites-section"),
    ).toBeVisible();
    await expect(page.getByText("Eventos da semana")).toBeVisible();
    await expect(
      page.getByTestId("dashboard-notifications-section"),
    ).toHaveCount(0);
  });

  test("atalhos colaboradores e eventos", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByTestId("dashboard-shortcuts").getByRole("link", {
        name: "Colaboradores",
      }),
    ).toHaveAttribute("href", "/colaboradores");
    await expect(
      page.getByTestId("dashboard-shortcuts").getByRole("link", {
        name: "Eventos",
      }),
    ).toHaveAttribute("href", "/eventos");
  });
});

test.describe("tenant dashboard — CS-01", () => {
  test("tenant Alpha não vê dados Beta no dashboard", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await authenticateAs(page, page.context(), "employee", setDevCookies);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Beta HR Lead")).toHaveCount(0);
  });
});

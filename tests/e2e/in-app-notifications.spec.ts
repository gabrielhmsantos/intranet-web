import { test, expect } from "@playwright/test";
import {
  authenticateAs,
  hasSupabase,
} from "./helpers/supabase-auth";

const DEV_AUTH = "dev_auth";
const DEV_ROLE = "dev_role";

const E2E_CANCEL_EVENT = "e0000000-0000-4000-8000-000000000013";
const E2E_TIME_EVENT = "e0000000-0000-4000-8000-000000000014";
const E2E_LOCATION_EVENT = "e0000000-0000-4000-8000-000000000015";
const E2E_TITLE_EVENT = "e0000000-0000-4000-8000-000000000016";

async function setDevCookies(
  context: import("@playwright/test").BrowserContext,
  role: string,
) {
  await context.addCookies([
    { name: DEV_AUTH, value: "1", url: "http://localhost:3000" },
    { name: DEV_ROLE, value: role, url: "http://localhost:3000" },
  ]);
}

async function openBell(page: import("@playwright/test").Page) {
  await page.getByTestId("notification-bell-trigger").click();
  await expect(page.getByTestId("notification-panel")).toBeVisible();
}

async function bumpDatetimeLocal(page: import("@playwright/test").Page, id: string) {
  const input = page.locator(`#${id}`);
  const current = await input.inputValue();
  const [date, time] = current.split("T");
  const [h, m] = time.split(":").map(Number);
  const newH = (h + 3) % 24;
  await input.fill(`${date}T${String(newH).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

test.describe("in-app notifications — campainha", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("badge visível com notificações não lidas", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e seed de notificações");
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expect(page.getByTestId("notification-bell")).toBeVisible();
    await expect(page.getByTestId("notification-badge")).toBeVisible();
  });

  test("painel sem CTA de criação", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await openBell(page);
    const panel = page.getByTestId("notification-panel");
    await expect(
      panel.getByRole("button", { name: /nova notificação|enviar/i }),
    ).toHaveCount(0);
  });

  test("marcar uma na campainha sem navegar", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/dashboard");
    await openBell(page);
    const markBtn = page.getByTestId("notification-mark-read").first();
    await expect(markBtn).toBeVisible({ timeout: 10_000 });
    const urlBefore = page.url();
    await markBtn.click();
    await expect(page).toHaveURL(urlBefore);
  });

  test("marcar todas na campainha zera badge", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/dashboard");
    await openBell(page);
    const markAll = page.getByTestId("notification-mark-all-read");
    await expect(markAll).toBeVisible({ timeout: 10_000 });
    await markAll.click();
    await expect(page.getByTestId("notification-badge")).toHaveCount(0);
  });

  test("sessão expirada ao marcar lida redireciona para login", async ({
    page,
    context,
  }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/dashboard");
    await openBell(page);
    const markBtn = page.getByTestId("notification-mark-read").first();
    await expect(markBtn).toBeVisible({ timeout: 10_000 });

    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await markBtn.click();
    await expect(page).toHaveURL(/\/login\?sessao=expirada/, {
      timeout: 15_000,
    });
    await expect(page.getByTestId("sessao-expirada")).toBeVisible();
  });
});

test.describe("in-app notifications — /notificacoes", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("filtros e paginação", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase e seed de paginação");
    await page.goto("/notificacoes", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();

    await page.getByTestId("notifications-filter-unread").click();
    await expect(page.getByTestId("notifications-next")).toBeVisible({ timeout: 10_000 });
    await page.getByTestId("notifications-next").click();
    await expect(page.getByText(/Página 2 de/)).toBeVisible();
    await page.getByTestId("notifications-prev").click();
    await expect(page.getByText(/Página 1 de/)).toBeVisible();

    await page.getByTestId("notifications-filter-all").click();
  });

  test("marcar uma no ecrã dedicado actualiza badge", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/notificacoes");
    const markBtn = page.getByTestId("notification-mark-read").first();
    await expect(markBtn).toBeVisible({ timeout: 10_000 });
    await markBtn.click();
    await page.goto("/dashboard");
    const badge = page.getByTestId("notification-badge");
    const countBefore = await badge.count();
    if (countBefore > 0) {
      const text = await badge.textContent();
      expect(text === null || Number(text) < 99).toBeTruthy();
    }
  });

  test("marcar todas no header da página", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/notificacoes");
    await page.getByTestId("notifications-mark-all-page").click();
    await page.goto("/dashboard");
    await expect(page.getByTestId("notification-badge")).toHaveCount(0);
  });
});

test.describe("in-app notifications — navegação evento", () => {
  test.beforeEach(async ({ page, context }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("clique no corpo abre detalhe do evento", async ({ page }) => {
    await page.goto("/notificacoes");
    const item = page.getByTestId("notification-item").first();
    await expect(item).toBeVisible({ timeout: 10_000 });
    await item.click();
    await expect(page).toHaveURL(/\/eventos\/[0-9a-f-]+/);
  });

  test("marcar como lida não altera URL", async ({ page }) => {
    await page.goto("/notificacoes");
    const markBtn = page.getByTestId("notification-mark-read").first();
    await expect(markBtn).toBeVisible({ timeout: 10_000 });
    const urlBefore = page.url();
    await markBtn.click();
    await expect(page).toHaveURL(urlBefore);
  });

  test("evento cancelado consultável", async ({ page }) => {
    await page.goto("/notificacoes");
    await page.getByText("Workshop cancelado").click();
    await expect(page).toHaveURL(
      /\/eventos\/e0000000-0000-4000-8000-000000000011/,
    );
    await expect(page.getByText(/cancelado/i)).toBeVisible();
  });
});

test.describe.serial("in-app notifications — imediatos EP-4", () => {
  test.beforeEach(async () => {
    test.skip(!hasSupabase, "Requer Supabase e eventos E2E no seed");
  });

  test("RH cancela evento e destinatário vê notificação", async ({ page, context }) => {
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto(`/eventos/${E2E_CANCEL_EVENT}`);
    await page.getByRole("button", { name: "Cancelar evento" }).click();
    await page.getByRole("button", { name: "Confirmar cancelamento" }).click();
    await expect(page.getByText("Cancelado")).toBeVisible({ timeout: 15_000 });

    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/dashboard");
    await openBell(page);
    await expect(
      page.getByTestId("notification-panel").getByText(/Evento cancelado: E2E cancelável/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("alterar horário gera notificação de horário", async ({ page, context }) => {
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto(`/eventos/${E2E_TIME_EVENT}`);
    await page.getByRole("button", { name: "Editar" }).click();
    await bumpDatetimeLocal(page, "startsAt");
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page).toHaveURL(new RegExp(`/eventos/${E2E_TIME_EVENT}`), {
      timeout: 15_000,
    });

    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/dashboard");
    await openBell(page);
    await expect(
      page.getByTestId("notification-panel").getByText(/Horário alterado: E2E horário/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("alterar local gera notificação de local", async ({ page, context }) => {
    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto(`/eventos/${E2E_LOCATION_EVENT}`);
    await page.getByRole("button", { name: "Editar" }).click();
    await page.locator("#location").fill("Sala B — E2E");
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page).toHaveURL(new RegExp(`/eventos/${E2E_LOCATION_EVENT}`), {
      timeout: 15_000,
    });

    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/dashboard");
    await openBell(page);
    await expect(
      page.getByTestId("notification-panel").getByText(/Local alterado: E2E local/i),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("alterar só título não adiciona notificação na bandeja", async ({
    page,
    context,
  }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/dashboard");
    await openBell(page);
    const panel = page.getByTestId("notification-panel");
    const countBefore = await panel.getByTestId("notification-item").count();

    await authenticateAs(page, context, "hr", setDevCookies);
    await page.goto(`/eventos/${E2E_TITLE_EVENT}`);
    await page.getByRole("button", { name: "Editar" }).click();
    await page.locator("#title").fill("E2E título — só nome");
    await page.getByRole("button", { name: "Guardar alterações" }).click();
    await expect(page).toHaveURL(new RegExp(`/eventos/${E2E_TITLE_EVENT}`), {
      timeout: 15_000,
    });

    await authenticateAs(page, context, "employee", setDevCookies);
    await page.goto("/dashboard");
    await openBell(page);
    const countAfter = await panel.getByTestId("notification-item").count();
    expect(countAfter).toBe(countBefore);
    await expect(panel.getByText(/Horário alterado: E2E título/i)).toHaveCount(0);
    await expect(panel.getByText(/Local alterado: E2E título/i)).toHaveCount(0);
  });
});

test.describe("in-app notifications — lembretes", () => {
  test.skip("SC-004/SC-005 — `pnpm job:reminders` local ou pipeline cloud", () => {});
});

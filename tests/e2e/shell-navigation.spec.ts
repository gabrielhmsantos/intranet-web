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
    {
      name: DEV_AUTH,
      value: "1",
      url: "http://localhost:3000",
    },
    {
      name: DEV_ROLE,
      value: role,
      url: "http://localhost:3000",
    },
  ]);
}

test.describe("gateway redirects", () => {
  test("unauthenticated GET / → /login", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("tenant session GET / → /dashboard", async ({ page, context }) => {
    if (hasSupabase) {
      await loginSupabase(page, "employee@alpha-dev.test");
      await page.goto("/", { waitUntil: "domcontentloaded" });
    } else {
      await setDevCookies(context, "employee");
      await page.goto("/", { waitUntil: "domcontentloaded" });
    }
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("platform_admin GET / → /plataforma/dashboard", async ({
    page,
    context,
  }) => {
    if (hasSupabase) {
      await loginSupabase(
        page,
        "platform@intranet-dev.test",
        /\/plataforma\/dashboard$/,
      );
      await page.goto("/", { waitUntil: "domcontentloaded" });
    } else {
      await setDevCookies(context, "platform_admin");
      await page.goto("/", { waitUntil: "domcontentloaded" });
    }
    await expect(page).toHaveURL(/\/plataforma\/dashboard$/);
  });

  test("tenant session GET /login → /dashboard", async ({ page, context }) => {
    if (hasSupabase) {
      await loginSupabase(page, "employee@alpha-dev.test");
    } else {
      await setDevCookies(context, "employee");
      await page.goto("/login", { waitUntil: "domcontentloaded" });
    }
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("platform_admin GET /login → /plataforma/dashboard", async ({
    page,
    context,
  }) => {
    if (hasSupabase) {
      await loginSupabase(
        page,
        "platform@intranet-dev.test",
        /\/plataforma\/dashboard$/,
      );
    } else {
      await setDevCookies(context, "platform_admin");
      await page.goto("/login", { waitUntil: "domcontentloaded" });
    }
    await expect(page).toHaveURL(/\/plataforma\/dashboard$/);
  });

  test("GET /plataforma unauthenticated → login", async ({ page }) => {
    await page.goto("/plataforma", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("GET /plataforma authenticated → /plataforma/dashboard", async ({
    page,
    context,
  }) => {
    await authenticateAs(page, context, "platform_admin", setDevCookies);
    await page.goto("/plataforma", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/plataforma\/dashboard$/);
  });
});

test.describe("tenant routes", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("dashboard has tenant shell", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("tenant-shell")).toBeVisible();
    await expect(page.getByTestId("tenant-nav-active")).toBeVisible();
  });

  test("colaboradores and perfil respond 200 with tenant shell", async ({
    page,
  }) => {
    await page.goto("/colaboradores");
    await expect(page.getByTestId("tenant-shell")).toBeVisible();
    await page.goto("/perfil");
    await expect(page.getByTestId("tenant-shell")).toBeVisible();
  });

  test("notificações acessível com sessão tenant", async ({ page }) => {
    test.skip(!hasSupabase, "Requer Supabase");
    await page.goto("/notificacoes");
    await expect(page.getByTestId("tenant-shell")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Notificações" })).toBeVisible();
  });

  test("nav active updates on route change", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("tenant-nav-active")).toHaveAttribute(
      "href",
      "/dashboard",
    );
    await page.getByRole("link", { name: "Colaboradores" }).click();
    await expect(page).toHaveURL(/\/colaboradores$/);
    await expect(page.getByTestId("tenant-nav-active")).toHaveAttribute(
      "href",
      "/colaboradores",
    );
  });

  const tenantPaths = [
    "/dashboard",
    "/colaboradores",
    "/colaboradores/00000000-0000-0000-0000-000000000001",
    "/organograma",
    "/eventos",
    "/eventos/novo",
    "/eventos/00000000-0000-0000-0000-000000000002",
    "/notificacoes",
    "/configuracao",
    "/perfil",
  ];

  for (const path of tenantPaths) {
    test(`GET ${path} returns tenant shell`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByTestId("tenant-shell")).toBeVisible();
    });
  }
});

test.describe("public routes", () => {
  test("login without tenant shell and no criar conta", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("public-layout")).toBeVisible();
    await expect(page.getByTestId("tenant-shell")).toHaveCount(0);
    await expect(page.getByText(/criar conta/i)).toHaveCount(0);
  });

  test("convite route is public", async ({ page }) => {
    await page.goto("/convite/test-token");
    await expect(page.getByTestId("public-layout")).toBeVisible();
  });
});

test.describe("platform shell", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "platform_admin", setDevCookies);
  });

  test("platform dashboard has platform shell without tenant links", async ({
    page,
  }) => {
    await page.goto("/plataforma/dashboard");
    await expect(page.getByTestId("platform-shell")).toBeVisible();
    await expect(page.getByRole("link", { name: "Colaboradores" })).toHaveCount(
      0,
    );
    await expect(page.getByRole("link", { name: "Eventos" })).toHaveCount(0);
  });
});

test.describe("menu by role", () => {
  for (const role of ["hr", "employee"] as const) {
    test(`${role} sidebar without configuracao`, async ({ page, context }) => {
      await authenticateAs(page, context, role, setDevCookies);
      await page.goto("/dashboard");
      await expect(
        page.getByRole("link", { name: "Configuração" }),
      ).toHaveCount(0);
    });
  }

  test.describe("manager menu (dev-session only)", () => {
    test.skip(hasSupabase, "No manager seed user in Supabase");

    test("manager sidebar without configuracao", async ({ page, context }) => {
      await setDevCookies(context, "manager");
      await page.goto("/dashboard");
      await expect(
        page.getByRole("link", { name: "Configuração" }),
      ).toHaveCount(0);
    });
  });

  test("tenant_admin sees configuracao", async ({ page, context }) => {
    await authenticateAs(page, context, "tenant_admin", setDevCookies);
    await page.goto("/dashboard");
    await expect(page.getByRole("link", { name: "Configuração" })).toBeVisible();
  });
});

test.describe("theme", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("dark theme persists after reload", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("theme-dark").click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});

test.describe("ui states dev page", () => {
  test.beforeEach(async ({ page, context }) => {
    await authenticateAs(page, context, "employee", setDevCookies);
  });

  test("dev ui-states exposes all markers", async ({ page }) => {
    await page.goto("/dev/ui-states");
    await expect(page.getByTestId("ui-state-loading")).toBeVisible();
    await expect(page.getByTestId("ui-state-empty")).toBeVisible();
    await expect(page.getByTestId("ui-state-error")).toBeVisible();
    await expect(page.getByTestId("ui-state-forbidden")).toBeVisible();
  });
});

test.describe("production guards", () => {
  test.skip(
    () => process.env.PW_PRODUCTION !== "1",
    "Run with PW_PRODUCTION=1",
  );

  test("unauthenticated /dashboard → /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("tenant session cannot access platform dashboard", async ({
    page,
    context,
  }) => {
    if (hasSupabase) {
      await loginSupabase(page, "employee@alpha-dev.test");
    } else {
      await setDevCookies(context, "employee");
    }
    await page.goto("/plataforma/dashboard");
    await expect(page).toHaveURL(/\/login(\?.*)?$/);
  });

  test("dev-role-switcher hidden in production", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dev-role-switcher")).toHaveCount(0);
  });
});

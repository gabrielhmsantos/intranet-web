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

test.describe("EP-7 platform admin", () => {
  test.describe("US1 — acesso plataforma", () => {
    test("platform_admin login → /plataforma/dashboard", async ({
      page,
      context,
    }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/plataforma/dashboard", {
        waitUntil: "domcontentloaded",
      });
      await expect(page).toHaveURL(/\/plataforma\/dashboard/);
      await expect(
        page.getByRole("heading", { name: /Dashboard da plataforma/i }),
      ).toBeVisible();
    });

    test("tenant user blocked from /plataforma/dashboard", async ({
      page,
      context,
    }) => {
      if (hasSupabase) {
        await authenticateAs(page, context, "employee");
      } else {
        await setDevCookies(context, "employee");
      }
      await page.goto("/plataforma/dashboard", {
        waitUntil: "domcontentloaded",
      });
      await expect(page).not.toHaveURL(/\/plataforma\/dashboard$/);
    });

    test("platform_admin redirected from tenant area", async ({
      page,
      context,
    }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/colaboradores", { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/plataforma\//);
    });

    test("nav links: Nova empresa e Convites expirados", async ({
      page,
      context,
    }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/plataforma/dashboard", {
        waitUntil: "domcontentloaded",
      });
      const nav = page.getByLabel("Navegação da plataforma");
      await expect(
        nav.getByRole("link", { name: "Nova empresa" }),
      ).toBeVisible();
      await expect(
        nav.getByRole("link", { name: "Convites expirados" }),
      ).toBeVisible();
    });
  });

  test.describe("US2 — dashboard agregados", () => {
    test.beforeEach(async ({ page, context }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/plataforma/dashboard", {
        waitUntil: "domcontentloaded",
      });
    });

    test("shows metric columns without employee emails", async ({ page }) => {
      await expect(page.getByRole("columnheader", { name: "Colaboradores" })).toBeVisible();
      await expect(page.getByText("hr@alpha-dev.test")).toHaveCount(0);
      await expect(page.getByText("employee@alpha-dev.test")).toHaveCount(0);
    });

    test("CTA Nova empresa navigates", async ({ page }) => {
      await page.getByRole("link", { name: "Nova empresa" }).first().click();
      await expect(page).toHaveURL(/\/plataforma\/tenants\/novo/);
    });
  });

  test.describe("US3 — provisionamento", () => {
    test.beforeEach(async ({ page, context }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
    });

    test("tenant blocked from nova empresa", async ({ page, context }) => {
      test.skip(hasSupabase, "dev cookies only for tenant block");
      await setDevCookies(context, "employee");
      await page.goto("/plataforma/tenants/novo", {
        waitUntil: "domcontentloaded",
      });
      await expect(page).not.toHaveURL(/\/plataforma\/tenants\/novo$/);
    });
  });

  test.describe("US5 — anti-PII", () => {
    test("dashboard has no drill-down links to colaboradores", async ({
      page,
      context,
    }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/plataforma/dashboard", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.getByRole("link", { name: /ver colaboradores/i })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /abrir evento/i })).toHaveCount(0);
    });
  });

  test.describe("US6 — convites expirados", () => {
    test("expired list page loads", async ({ page, context }) => {
      if (hasSupabase) {
        await loginSupabase(page, "platform@intranet-dev.test");
      } else {
        await setDevCookies(context, "platform_admin");
      }
      await page.goto("/plataforma/convites-expirados", {
        waitUntil: "domcontentloaded",
      });
      await expect(
        page.getByRole("heading", { name: /Convites expirados/i }),
      ).toBeVisible();
    });
  });
});

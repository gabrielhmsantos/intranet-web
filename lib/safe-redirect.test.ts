import { describe, expect, it } from "vitest";
import { getDefaultRedirectForRole, safeRedirect } from "@/lib/safe-redirect";

describe("safeRedirect", () => {
  it("defaults tenant role to dashboard", () => {
    expect(getDefaultRedirectForRole("employee")).toBe("/dashboard");
  });

  it("defaults platform admin to plataforma dashboard", () => {
    expect(getDefaultRedirectForRole("platform_admin")).toBe(
      "/plataforma/dashboard",
    );
  });

  it("allows tenant allowlisted path", () => {
    expect(safeRedirect("/colaboradores", "hr")).toBe("/colaboradores");
  });

  it("blocks external redirect", () => {
    expect(safeRedirect("https://evil.com", "employee")).toBe("/dashboard");
  });

  it("blocks protocol-relative redirect", () => {
    expect(safeRedirect("//evil.com", "employee")).toBe("/dashboard");
  });

  it("blocks configuracao for RH", () => {
    expect(safeRedirect("/configuracao", "hr")).toBe("/dashboard");
  });

  it("allows configuracao for tenant admin", () => {
    expect(safeRedirect("/configuracao", "tenant_admin")).toBe(
      "/configuracao",
    );
  });

  it("allows platform path for platform admin", () => {
    expect(safeRedirect("/plataforma/dashboard", "platform_admin")).toBe(
      "/plataforma/dashboard",
    );
  });

  it("redirects platform admin away from tenant paths", () => {
    expect(safeRedirect("/dashboard", "platform_admin")).toBe(
      "/plataforma/dashboard",
    );
  });

  it("allows eventos prefix for employee", () => {
    expect(safeRedirect("/eventos", "employee")).toBe("/eventos");
  });

  it("allows perfil for manager", () => {
    expect(safeRedirect("/perfil", "manager")).toBe("/perfil");
  });

  it("falls back when path empty", () => {
    expect(safeRedirect(null, "hr")).toBe("/dashboard");
  });
});

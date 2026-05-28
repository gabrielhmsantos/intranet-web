import { describe, expect, it } from "vitest";
import { canAccessPath } from "@/lib/route-access";

describe("canAccessPath", () => {
  it("denies unauthenticated", () => {
    expect(canAccessPath("employee", "/dashboard", false)).toEqual({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("redirects platform admin from tenant area", () => {
    expect(canAccessPath("platform_admin", "/dashboard", true)).toEqual({
      allowed: false,
      reason: "platform_redirect",
    });
  });

  it("denies RH configuracao", () => {
    expect(canAccessPath("hr", "/configuracao", true)).toEqual({
      allowed: false,
      reason: "forbidden",
    });
  });

  it("allows tenant admin configuracao", () => {
    expect(canAccessPath("tenant_admin", "/configuracao", true)).toEqual({
      allowed: true,
    });
  });

  it("denies employee eventos novo", () => {
    expect(canAccessPath("employee", "/eventos/novo", true)).toEqual({
      allowed: false,
      reason: "forbidden",
    });
  });

  it("allows manager eventos novo", () => {
    expect(canAccessPath("manager", "/eventos/novo", true)).toEqual({
      allowed: true,
    });
  });

  it("allows RH colaboradores", () => {
    expect(canAccessPath("hr", "/colaboradores", true)).toEqual({
      allowed: true,
    });
  });
});

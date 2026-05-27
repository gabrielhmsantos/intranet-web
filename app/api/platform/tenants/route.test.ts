import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/platform/tenants/route";

vi.mock("@/lib/platform/require-platform-admin", () => ({
  requirePlatformAdmin: vi.fn(),
  isPlatformAdminResponse: (r: unknown) =>
    typeof r === "object" && r !== null && "status" in (r as Response),
}));

vi.mock("@/lib/platform/provision-tenant", () => ({
  provisionTenant: vi.fn(),
  ProvisionValidationError: class ProvisionValidationError extends Error {},
  EmailAlreadyRegisteredError: class EmailAlreadyRegisteredError extends Error {},
}));

import { requirePlatformAdmin } from "@/lib/platform/require-platform-admin";
import { provisionTenant } from "@/lib/platform/provision-tenant";
import { NextResponse } from "next/server";

describe("POST /api/platform/tenants", () => {
  beforeEach(() => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      session: {
        isAuthenticated: true,
        userId: "platform-1",
        email: "p@test",
        displayName: "Platform",
        tenantId: "t1",
        tenantName: "Platform",
        role: "platform_admin",
        isPlatformAdmin: true,
        source: "supabase",
      },
    });
    vi.mocked(provisionTenant).mockResolvedValue({
      tenantId: "new-tenant",
      inviteUrl: "http://localhost/convite/raw",
      expiresAt: new Date().toISOString(),
    });
  });

  it("returns 403 for tenant session", async () => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado." }, { status: 403 }),
    );

    const res = await POST(
      new Request("http://localhost/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme",
          adminEmail: "a@b.pt",
        }),
      }),
    );
    expect(res.status).toBe(403);
  });

  it("provisions when platform admin", async () => {
    const res = await POST(
      new Request("http://localhost/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Acme",
          adminEmail: "a@b.pt",
        }),
      }),
    );
    expect(res.status).toBe(201);
    expect(provisionTenant).toHaveBeenCalled();
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET as getSummary } from "@/app/api/platform/tenants/summary/route";
import { POST as postTenant } from "@/app/api/platform/tenants/route";
import { GET as getExpired } from "@/app/api/platform/invites/expired/route";
import { POST as postRenew } from "@/app/api/platform/invites/[inviteId]/renew/route";
import { POST as postDelete } from "@/app/api/platform/invites/[inviteId]/delete/route";
import { NextResponse } from "next/server";

vi.mock("@/lib/platform/require-platform-admin", () => ({
  requirePlatformAdmin: vi.fn(),
  isPlatformAdminResponse: (r: unknown) =>
    typeof r === "object" && r !== null && "status" in (r as Response),
}));

vi.mock("@/lib/platform/tenant-summary", () => ({
  fetchTenantSummaries: vi.fn(async () => ({ tenants: [] })),
}));

vi.mock("@/lib/platform/provision-tenant", () => ({
  provisionTenant: vi.fn(),
  ProvisionValidationError: class ProvisionValidationError extends Error {},
  EmailAlreadyRegisteredError: class EmailAlreadyRegisteredError extends Error {},
}));

vi.mock("@/lib/platform/expired-invites", () => ({
  fetchExpiredBootstrapInvites: vi.fn(async () => []),
}));

vi.mock("@/lib/platform/renew-bootstrap", () => ({
  renewBootstrapInvite: vi.fn(),
  RenewBootstrapError: class RenewBootstrapError extends Error {
    status = 404;
  },
}));

vi.mock("@/lib/platform/delete-bootstrap", () => ({
  deleteBootstrapInvite: vi.fn(),
  DeleteBootstrapError: class DeleteBootstrapError extends Error {
    status = 409;
  },
}));

import { requirePlatformAdmin } from "@/lib/platform/require-platform-admin";

const forbidden = NextResponse.json({ error: "Não autorizado." }, { status: 403 });

describe("platform BFF auth", () => {
  beforeEach(() => {
    vi.mocked(requirePlatformAdmin).mockResolvedValue(forbidden);
  });

  it("GET /api/platform/tenants/summary → 403", async () => {
    const res = await getSummary();
    expect(res.status).toBe(403);
  });

  it("POST /api/platform/tenants → 403", async () => {
    const res = await postTenant(
      new Request("http://localhost/api/platform/tenants", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("GET /api/platform/invites/expired → 403", async () => {
    const res = await getExpired();
    expect(res.status).toBe(403);
  });

  it("POST renew → 403", async () => {
    const res = await postRenew(new Request("http://localhost"), {
      params: Promise.resolve({ inviteId: "id-1" }),
    });
    expect(res.status).toBe(403);
  });

  it("POST delete → 403", async () => {
    const res = await postDelete(new Request("http://localhost"), {
      params: Promise.resolve({ inviteId: "id-1" }),
    });
    expect(res.status).toBe(403);
  });
});

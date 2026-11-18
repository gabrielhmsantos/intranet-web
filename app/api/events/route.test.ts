import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/events/route";

vi.mock("@/lib/session", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/tenant-context", () => ({
  assertTenantAccess: vi.fn(),
  TenantAccessError: class TenantAccessError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/events/repository", () => ({
  listEvents: vi.fn(),
  createEvent: vi.fn(),
}));

import { getServerSession } from "@/lib/session";
import { listEvents } from "@/lib/events/repository";

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: true,
      tenantId: "t1",
      role: "employee",
      userId: "u1",
      email: "e@test",
      displayName: "Employee",
      tenantName: "Alpha",
      employeeId: null,
      isPlatformAdmin: false,
      source: "supabase",
    });
    vi.mocked(listEvents).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 1,
    });
  });

  it("returns 403 for platform_admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: true,
      tenantId: "t1",
      role: "platform_admin",
      userId: "u1",
      email: "p@test",
      displayName: "Platform",
      tenantName: "Platform",
      isPlatformAdmin: true,
      source: "supabase",
    });

    const res = await GET(new Request("http://localhost/api/events?q=test"));
    expect(res.status).toBe(403);
  });

  it("lists with q param", async () => {
    const res = await GET(new Request("http://localhost/api/events?q=test"));
    expect(res.status).toBe(200);
    expect(listEvents).toHaveBeenCalled();
  });
});

describe("POST /api/events", () => {
  it("returns 422 for manager without employee link", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: true,
      tenantId: "t1",
      role: "manager",
      userId: "u1",
      email: "m@test",
      displayName: "Manager",
      tenantName: "Alpha",
      employeeId: null,
      isPlatformAdmin: false,
      source: "supabase",
    });

    const res = await POST(
      new Request("http://localhost/api/events", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    expect(res.status).toBe(422);
  });
});

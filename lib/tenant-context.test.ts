import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import { getServerSession } from "@/lib/session";

vi.mock("@/lib/session", () => ({
  getServerSession: vi.fn(),
}));

const ALPHA = "a0000000-0000-4000-8000-000000000010";
const BETA = "a0000000-0000-4000-8000-000000000020";

describe("assertTenantAccess (SC-006 anti-IDOR)", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset();
  });

  it("allows access when session tenant matches request", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: true,
      userId: "b0000000-0000-4000-8000-000000000010",
      email: "admin@alpha-dev.test",
      displayName: "Admin",
      tenantId: ALPHA,
      tenantName: "Org Alpha",
      role: "tenant_admin",
      isPlatformAdmin: false,
      source: "supabase",
    });

    await expect(assertTenantAccess(ALPHA)).resolves.toBeUndefined();
  });

  it("rejects cross-tenant tenant_id (IDOR)", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: true,
      userId: "b0000000-0000-4000-8000-000000000010",
      email: "admin@alpha-dev.test",
      displayName: "Admin",
      tenantId: ALPHA,
      tenantName: "Org Alpha",
      role: "tenant_admin",
      isPlatformAdmin: false,
      source: "supabase",
    });

    await expect(assertTenantAccess(BETA)).rejects.toBeInstanceOf(
      TenantAccessError,
    );
  });

  it("rejects unauthenticated session", async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      isAuthenticated: false,
      userId: null,
      email: null,
      displayName: "Utilizador",
      tenantId: null,
      tenantName: "Intranet",
      role: "employee",
      isPlatformAdmin: false,
      source: "supabase",
    });

    await expect(assertTenantAccess(ALPHA)).rejects.toBeInstanceOf(
      TenantAccessError,
    );
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { enrichEmployeeListDisplayNames } from "@/lib/employees/list-display-names";

const getUserById = vi.fn();
const maybeSingleEmployees = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnValue({
        data: [{ id: "e1", user_id: "user-1" }],
        error: null,
      }),
    })),
    auth: {
      admin: { getUserById },
    },
  }),
}));

describe("enrichEmployeeListDisplayNames", () => {
  beforeEach(() => {
    getUserById.mockReset();
    maybeSingleEmployees.mockReset();
  });

  it("leaves rows without account unchanged", async () => {
    const items = [
      {
        id: "e0",
        displayName: "Maria Santos",
        departmentName: null,
        status: "active" as const,
        hasAccount: false,
      },
    ];
    const result = await enrichEmployeeListDisplayNames(items);
    expect(result[0]?.displayName).toBe("Maria Santos");
  });

  it("uses intranet metadata for rows with account", async () => {
    getUserById.mockResolvedValue({
      data: {
        user: {
          user_metadata: { intranet_display_name: "João Silva" },
        },
      },
      error: null,
    });

    const items = [
      {
        id: "e1",
        displayName: "João Pinto Silva",
        departmentName: null,
        status: "active" as const,
        hasAccount: true,
      },
    ];
    const result = await enrichEmployeeListDisplayNames(items);
    expect(result[0]?.displayName).toBe("João Silva");
  });
});

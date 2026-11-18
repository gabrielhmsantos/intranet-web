import { describe, expect, it, vi } from "vitest";
import {
  deleteDepartment,
  DepartmentDeleteBlockedError,
} from "@/lib/departments/repository";

describe("deleteDepartment", () => {
  it("throws when department has active employees", async () => {
    const countChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    Object.assign(countChain, {
      then: (resolve: (v: { count: number; error: null }) => void) => {
        resolve({ count: 2, error: null });
      },
    });

    const supabase = {
      from: vi.fn(() => countChain),
    } as unknown as Parameters<typeof deleteDepartment>[0];

    await expect(
      deleteDepartment(supabase, "tenant-1", "dept-1"),
    ).rejects.toBeInstanceOf(DepartmentDeleteBlockedError);
  });
});

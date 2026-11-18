import { describe, expect, it, vi } from "vitest";
import {
  INTRANET_DISPLAY_NAME_KEY,
  resolveDisplayName,
  resolveEmployeeListDisplayName,
  updateDisplayName,
  validateDisplayNameInput,
} from "@/lib/profile/display-name";

describe("resolveDisplayName", () => {
  it("prefers intranet metadata", () => {
    expect(
      resolveDisplayName(
        { [INTRANET_DISPLAY_NAME_KEY]: "João Silva" },
        "João Pinto Silva",
        "joao@example.com",
      ),
    ).toBe("João Silva");
  });

  it("falls back to cadastro then email local part", () => {
    expect(resolveDisplayName({}, "Cadastro Nome", "user@test.com")).toBe(
      "Cadastro Nome",
    );
    expect(resolveDisplayName({}, null, "user@test.com")).toBe("user");
  });
});

describe("resolveEmployeeListDisplayName", () => {
  it("uses cadastro when no account", () => {
    expect(
      resolveEmployeeListDisplayName(false, "João Silva", "João Pinto Silva"),
    ).toBe("João Pinto Silva");
  });

  it("uses metadata when account exists", () => {
    expect(
      resolveEmployeeListDisplayName(true, "João Silva", "João Pinto Silva"),
    ).toBe("João Silva");
  });

  it("falls back to cadastro when metadata empty", () => {
    expect(resolveEmployeeListDisplayName(true, "", "João Pinto Silva")).toBe(
      "João Pinto Silva",
    );
  });
});

describe("validateDisplayNameInput", () => {
  it("rejects empty and over 120 chars", () => {
    expect(validateDisplayNameInput("   ").ok).toBe(false);
    expect(validateDisplayNameInput("a".repeat(121)).ok).toBe(false);
  });

  it("accepts trimmed valid name", () => {
    const result = validateDisplayNameInput("  Ana  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("Ana");
  });
});

describe("loadProfileNames", () => {
  it("returns null cadastro when no employee row", async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: "u1", email: "orphan@test.com", user_metadata: {} } },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      auth: { getUser },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle,
      })),
    } as never;

    const { loadProfileNames } = await import("@/lib/profile/display-name");
    const result = await loadProfileNames(supabase);
    expect(result?.cadastroName).toBeNull();
    expect(result?.email).toBe("orphan@test.com");
  });
});

describe("updateDisplayName", () => {
  it("calls auth updateUser with metadata", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const supabase = { auth: { updateUser } } as never;

    const result = await updateDisplayName(supabase, "Novo Nome");
    expect(result.ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({
      data: { [INTRANET_DISPLAY_NAME_KEY]: "Novo Nome" },
    });
  });
});

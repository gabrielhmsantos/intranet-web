import type { SupabaseClient } from "@supabase/supabase-js";

export const INTRANET_DISPLAY_NAME_KEY = "intranet_display_name";

const MAX_DISPLAY_NAME_LENGTH = 120;

export function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  cadastroName: string | null | undefined,
  email: string | null | undefined,
): string {
  const meta = metadata?.[INTRANET_DISPLAY_NAME_KEY];
  if (typeof meta === "string" && meta.trim().length > 0) {
    return meta.trim();
  }
  if (cadastroName?.trim()) {
    return cadastroName.trim();
  }
  if (email?.includes("@")) {
    return email.split("@")[0] ?? email;
  }
  if (email?.trim()) {
    return email.trim();
  }
  return "Utilizador";
}

export function resolveEmployeeListDisplayName(
  hasAccount: boolean,
  metadataName: string | null | undefined,
  cadastroName: string,
): string {
  if (!hasAccount) {
    return cadastroName;
  }
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }
  return cadastroName;
}

export function validateDisplayNameInput(
  value: string,
): { ok: true; value: string } | { ok: false; message: string } {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: "O nome de exibição não pode estar vazio." };
  }
  if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      ok: false,
      message: `O nome de exibição não pode ter mais de ${MAX_DISPLAY_NAME_LENGTH} caracteres.`,
    };
  }
  return { ok: true, value: trimmed };
}

export type ProfileNames = {
  displayName: string;
  email: string;
  cadastroName: string | null;
};

export async function loadProfileNames(
  supabase: SupabaseClient,
): Promise<ProfileNames | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const cadastroName = employee?.display_name ?? null;
  const metaName = user.user_metadata?.[INTRANET_DISPLAY_NAME_KEY];
  const displayName =
    typeof metaName === "string" && metaName.trim().length > 0
      ? metaName.trim()
      : "";

  return {
    displayName,
    email: user.email ?? "",
    cadastroName,
  };
}

export async function updateDisplayName(
  supabase: SupabaseClient,
  value: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const validated = validateDisplayNameInput(value);
  if (!validated.ok) {
    return validated;
  }

  const { error } = await supabase.auth.updateUser({
    data: { [INTRANET_DISPLAY_NAME_KEY]: validated.value },
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("jwt") || msg.includes("session")) {
      return { ok: false, message: "Sessão expirada. Inicie sessão novamente." };
    }
    return { ok: false, message: "Não foi possível guardar o nome. Tente novamente." };
  }

  return { ok: true };
}

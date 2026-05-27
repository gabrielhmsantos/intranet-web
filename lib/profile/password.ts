import type { SupabaseClient } from "@supabase/supabase-js";
import { validatePassword } from "@/lib/password-policy";

export function validatePasswordChangeInput(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): { ok: true } | { ok: false; message: string } {
  if (!currentPassword) {
    return { ok: false, message: "Introduza a palavra-passe actual." };
  }

  const policy = validatePassword(newPassword);
  if (!policy.ok) {
    return policy;
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "A confirmação não coincide com a nova palavra-passe." };
  }

  return { ok: true };
}

export async function updatePassword(
  supabase: SupabaseClient,
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return {
      ok: false,
      message: "A palavra-passe actual está incorrecta.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    if (msg.includes("jwt") || msg.includes("session")) {
      return { ok: false, message: "Sessão expirada. Inicie sessão novamente." };
    }
    return {
      ok: false,
      message: "Não foi possível alterar a palavra-passe. Tente novamente.",
    };
  }

  return { ok: true };
}

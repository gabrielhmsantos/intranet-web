"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeRedirect } from "@/lib/safe-redirect";
import { validateTenantLogin } from "@/lib/session";
import { normalizeDevRole, DEV_AUTH_COOKIE, DEV_ROLE_COOKIE } from "@/lib/dev-session";
import { clearDevSession } from "@/app/actions/dev-session";

export type SignInState = {
  error?: string;
};

export async function signIn(
  _prev: SignInState | null,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "").trim() || null;

  if (!email || !password) {
    return { error: "Credenciais inválidas." };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "local";
  if (!checkRateLimit(`login:${ip}`)) {
    return { error: "Credenciais inválidas." };
  }

  if (!isSupabaseConfigured()) {
    return { error: "Credenciais inválidas." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Credenciais inválidas." };
  }

  const allowed = await validateTenantLogin(data.user.id);
  if (!allowed) {
    await supabase.auth.signOut();
    return { error: "Credenciais inválidas." };
  }

  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = normalizeDevRole(membership?.role as string | undefined);
  redirect(safeRedirect(redirectTo, role));
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  if (process.env.NODE_ENV === "development") {
    await clearDevSession();
  }

  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE);
  cookieStore.delete(DEV_ROLE_COOKIE);

  redirect("/login");
}

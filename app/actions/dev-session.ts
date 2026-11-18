"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  DEV_AUTH_COOKIE,
  DEV_ROLE_COOKIE,
  normalizeDevRole,
} from "@/lib/dev-session";
import type { ProductRole } from "@/lib/roles";

export async function setDevSession(role: ProductRole) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const normalized = normalizeDevRole(role);
  const cookieStore = await cookies();
  cookieStore.set(DEV_AUTH_COOKIE, "1", { path: "/" });
  cookieStore.set(DEV_ROLE_COOKIE, normalized, { path: "/" });
  revalidatePath("/", "layout");
}

export async function clearDevSession() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const cookieStore = await cookies();
  cookieStore.delete(DEV_AUTH_COOKIE);
  cookieStore.delete(DEV_ROLE_COOKIE);
  revalidatePath("/", "layout");
}

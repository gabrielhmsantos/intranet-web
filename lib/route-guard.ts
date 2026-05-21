import { redirect } from "next/navigation";
import { getDevSession } from "@/lib/dev-session";
import { isPlatformAdmin } from "@/lib/roles";

export async function enforceTenantAccess(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const session = await getDevSession();
  if (!session.isAuthenticated || isPlatformAdmin(session.role)) {
    redirect("/login");
  }
}

export async function enforcePlatformAccess(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  const session = await getDevSession();
  if (!session.isAuthenticated) {
    redirect("/login");
  }
  if (!isPlatformAdmin(session.role)) {
    redirect("/login?denied=platform");
  }
}

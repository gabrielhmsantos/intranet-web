import { enforceTenantAccess } from "@/lib/route-guard";
import { getServerSession } from "@/lib/session";
import { getEffectiveTenantRole } from "@/lib/dev-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { TenantShell } from "@/components/shell/tenant-shell";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceTenantAccess();
  const session = await getServerSession();
  const role = isSupabaseConfigured()
    ? session.role
    : await getEffectiveTenantRole();

  return (
    <TenantShell
      tenantName={session.tenantName}
      role={role}
      useSupabaseAuth={isSupabaseConfigured()}
    >
      {children}
    </TenantShell>
  );
}

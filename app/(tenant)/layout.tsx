import { enforceTenantAccess } from "@/lib/route-guard";
import { getTenantTimezone } from "@/lib/events/timezone";
import { getServerSession } from "@/lib/session";
import { getEffectiveTenantRole } from "@/lib/dev-session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
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

  let timeZone = "Europe/Lisbon";
  if (isSupabaseConfigured() && session.tenantId) {
    const supabase = await createClient();
    timeZone = await getTenantTimezone(supabase, session.tenantId);
  }

  return (
    <TenantShell
      tenantName={session.tenantName}
      role={role}
      timeZone={timeZone}
      useSupabaseAuth={isSupabaseConfigured()}
    >
      {children}
    </TenantShell>
  );
}

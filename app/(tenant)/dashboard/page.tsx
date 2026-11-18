import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { HrDashboard } from "@/components/dashboard/hr-dashboard";
import { getTenantTimezone } from "@/lib/events/timezone";
import { getEffectiveTenantRole } from "@/lib/dev-session";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Início" };

function isHrDashboardRole(role: string) {
  return role === "hr" || role === "tenant_admin";
}

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver o Início com dados reais.
      </p>
    );
  }

  const session = await getServerSession();
  const role = session.isAuthenticated ? session.role : await getEffectiveTenantRole();

  let timeZone = "Europe/Lisbon";
  if (session.tenantId) {
    const supabase = await createClient();
    timeZone = await getTenantTimezone(supabase, session.tenantId);
  }

  if (isHrDashboardRole(role)) {
    return <HrDashboard timeZone={timeZone} />;
  }

  return <EmployeeDashboard timeZone={timeZone} />;
}

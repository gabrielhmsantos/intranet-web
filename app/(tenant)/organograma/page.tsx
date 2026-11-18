import { redirect } from "next/navigation";
import { DepartmentFormSheet } from "@/components/departments/department-form-sheet";
import { OrgChartView } from "@/components/org-chart/org-chart-view";
import { loadOrgChart } from "@/lib/org-chart/load-org-chart";
import { canMutateDepartments } from "@/lib/people-roles";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Organograma" };

export default async function OrganogramaPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver o organograma.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const departments = await loadOrgChart(supabase, session.tenantId);
  const canManage = canMutateDepartments(session.role);

  return (
    <OrgChartView
      departments={departments}
      canManageDepartments={canManage}
      manageDepartmentsSlot={
        canManage ? <DepartmentFormSheet /> : undefined
      }
    />
  );
}

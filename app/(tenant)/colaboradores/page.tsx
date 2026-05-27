import { redirect } from "next/navigation";
import { EmployeeList } from "@/components/employees/employee-list";
import { enrichEmployeeListDisplayNames } from "@/lib/employees/list-display-names";
import { listEmployees } from "@/lib/employees/repository";
import {
  canListInactive,
  canMutateEmployees,
  canViewEmployeeAccess,
} from "@/lib/people-roles";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Colaboradores" };

export default async function ColaboradoresPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver a lista de colaboradores.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const initial = await listEmployees(supabase, session.tenantId, session.role, {
    page: 1,
    pageSize: 20,
    includeInactive: false,
  });
  initial.items = await enrichEmployeeListDisplayNames(initial.items);

  return (
    <EmployeeList
      initial={initial}
      canCreate={canMutateEmployees(session.role)}
      canListInactive={canListInactive(session.role)}
      canViewAccess={canViewEmployeeAccess(session.role)}
    />
  );
}

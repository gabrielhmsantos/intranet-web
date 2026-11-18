import { notFound, redirect } from "next/navigation";
import { EmployeeDetailView } from "@/components/employees/employee-detail";
import { getEmployeeById } from "@/lib/employees/repository";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Colaborador" };

type PageProps = { params: Promise<{ id: string }> };

export default async function ColaboradorDetailPage({ params }: PageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver a ficha do colaborador.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createClient();
  const employee = await getEmployeeById(
    supabase,
    session.tenantId,
    session.role,
    id,
  );

  if (!employee) {
    notFound();
  }

  return (
    <EmployeeDetailView employee={employee} viewerRole={session.role} />
  );
}

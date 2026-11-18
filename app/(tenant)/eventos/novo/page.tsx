import { redirect } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { hasManagerScope, loadManagerScope } from "@/lib/events/manager-scope";
import { canCreateEvents, canMutateEvents } from "@/lib/events/roles";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Novo evento" };

export default async function NovoEventoPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">Configure Supabase para criar eventos.</p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const supabase = await createClient();

  if (canMutateEvents(session.role)) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
        <EventForm mode="create" />
      </div>
    );
  }

  if (session.role !== "manager") {
    redirect("/sem-permissao");
  }

  if (!session.employeeId) {
    return (
      <div className="flex max-w-lg flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          A sua conta não está associada a uma ficha de colaborador. Contacte os
          Recursos Humanos para associar a conta à ficha.
        </p>
      </div>
    );
  }

  let scope;
  try {
    scope = await loadManagerScope(supabase, session.tenantId, session.employeeId);
  } catch {
    return (
      <div className="flex max-w-lg flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar o âmbito da equipa. Tente novamente ou contacte os
          Recursos Humanos.
        </p>
      </div>
    );
  }

  if (!canCreateEvents(session.role, { hasManagerScope: hasManagerScope(scope) })) {
    return (
      <div className="flex max-w-lg flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
        <p className="text-sm text-muted-foreground">
          Não tem equipa configurada no organograma (departamentos geridos ou reportes
          directos). Contacte os Recursos Humanos para actualizar a estrutura.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
      <EventForm
        mode="create"
        managerMode
        managedDepartments={scope.managedDepartments}
        scopedEmployees={scope.scopedEmployees}
      />
    </div>
  );
}

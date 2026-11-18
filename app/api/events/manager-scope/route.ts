import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/roles";
import { hasManagerScope, loadManagerScope } from "@/lib/events/manager-scope";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (isPlatformAdmin(session.role)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  if (session.role !== "manager") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  if (!session.employeeId) {
    return NextResponse.json(
      {
        error:
          "A sua conta não está associada a uma ficha de colaborador. Contacte os Recursos Humanos.",
      },
      { status: 422 },
    );
  }

  try {
    await assertTenantAccess(session.tenantId);
  } catch (e) {
    if (e instanceof TenantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const supabase = await createClient();
  const scope = await loadManagerScope(
    supabase,
    session.tenantId,
    session.employeeId,
  );

  if (!hasManagerScope(scope)) {
    return NextResponse.json(
      {
        error:
          "Não tem equipa configurada no organograma. Contacte os Recursos Humanos para actualizar a estrutura.",
      },
      { status: 422 },
    );
  }

  return NextResponse.json({
    managedDepartments: scope.managedDepartments,
    scopedEmployees: scope.scopedEmployees,
  });
}

import { NextResponse } from "next/server";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { canMutateEmployees } from "@/lib/people-roles";
import {
  getEmployeeById,
  reactivateEmployee,
} from "@/lib/employees/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!canMutateEmployees(session.role)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    await assertTenantAccess(session.tenantId);
    const supabase = await createClient();
    const existing = await getEmployeeById(
      supabase,
      session.tenantId,
      session.role,
      id,
    );
    if (!existing || existing.status !== "inactive") {
      return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    }

    await reactivateEmployee(supabase, session.tenantId, id);
    return NextResponse.json({ status: "active" });
  } catch (e) {
    if (e instanceof TenantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    if (e instanceof Error && "statusCode" in e && e.statusCode === 409) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}

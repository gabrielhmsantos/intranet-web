import { NextResponse } from "next/server";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { canMutateEmployees } from "@/lib/people-roles";
import {
  updateEmployeeBodySchema,
} from "@/lib/employees/schemas";
import {
  getEmployeeById,
  ManagerGraphError,
  updateEmployee,
} from "@/lib/employees/repository";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await assertTenantAccess(session.tenantId);
  } catch (e) {
    if (e instanceof TenantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

  const supabase = await createClient();
  const employee = await getEmployeeById(
    supabase,
    session.tenantId,
    session.role,
    id,
  );

  if (!employee) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  return NextResponse.json(employee);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = updateEmployeeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await assertTenantAccess(session.tenantId);
    const supabase = await createClient();
    const existing = await getEmployeeById(
      supabase,
      session.tenantId,
      session.role,
      id,
    );
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    }

    await updateEmployee(supabase, session.tenantId, id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof TenantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    if (e instanceof ManagerGraphError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (e instanceof Error && "statusCode" in e && e.statusCode === 409) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}

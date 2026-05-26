import { NextResponse } from "next/server";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { canMutateEmployees } from "@/lib/people-roles";
import {
  createEmployeeBodySchema,
  listEmployeesQuerySchema,
} from "@/lib/employees/schemas";
import {
  createEmployee,
  listEmployees,
  ManagerGraphError,
} from "@/lib/employees/repository";

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = listEmployeesQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    includeInactive: url.searchParams.get("includeInactive") === "true",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
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
  const result = await listEmployees(
    supabase,
    session.tenantId,
    session.role,
    parsed.data,
  );

  return NextResponse.json(result);
}

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = createEmployeeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await assertTenantAccess(session.tenantId);
    const supabase = await createClient();
    const created = await createEmployee(
      supabase,
      session.tenantId,
      parsed.data,
    );
    return NextResponse.json(created, { status: 201 });
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

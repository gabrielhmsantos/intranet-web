import { NextResponse } from "next/server";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { canMutateDepartments } from "@/lib/people-roles";
import { createDepartmentBodySchema } from "@/lib/departments/schemas";
import {
  createDepartment,
  listDepartments,
} from "@/lib/departments/repository";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    await assertTenantAccess(session.tenantId);
    const supabase = await createClient();
    const items = await listDepartments(supabase, session.tenantId);
    return NextResponse.json({ items });
  } catch (e) {
    if (e instanceof TenantAccessError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  if (!canMutateDepartments(session.role)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const parsed = createDepartmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  try {
    await assertTenantAccess(session.tenantId);
    const supabase = await createClient();
    const created = await createDepartment(
      supabase,
      session.tenantId,
      parsed.data,
    );
    return NextResponse.json(created, { status: 201 });
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

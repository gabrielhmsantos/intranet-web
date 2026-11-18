import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/roles";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import {
  assertAudienceAllowed,
  hasManagerScope,
  loadManagerScope,
  ManagerScopeError,
} from "@/lib/events/manager-scope";
import { canCreateEventsForSession } from "@/lib/events/mutation-access";
import { canMutateEvents } from "@/lib/events/roles";
import {
  createEventBodySchema,
  listEventsQuerySchema,
  managerCreateEventBodySchema,
} from "@/lib/events/schemas";
import { createEvent, listEvents } from "@/lib/events/repository";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const parsed = listEventsQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
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
  const result = await listEvents(supabase, session.tenantId, parsed.data);

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
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

  if (canMutateEvents(session.role)) {
    const parsed = createEventBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const event = await createEvent(supabase, session.tenantId, parsed.data);
    return NextResponse.json(event, { status: 201 });
  }

  if (session.role === "manager") {
    if (!session.employeeId) {
      return NextResponse.json(
        {
          error:
            "A sua conta não está associada a uma ficha de colaborador. Contacte os Recursos Humanos.",
        },
        { status: 422 },
      );
    }

    const parsed = managerCreateEventBodySchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let scope;
    try {
      scope = await loadManagerScope(
        supabase,
        session.tenantId,
        session.employeeId,
      );
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Erro ao carregar âmbito." },
        { status: 500 },
      );
    }

    if (!hasManagerScope(scope)) {
      return NextResponse.json(
        {
          error:
            "Não tem equipa configurada no organograma. Contacte os Recursos Humanos.",
        },
        { status: 422 },
      );
    }

    if (!canCreateEventsForSession(session.role, scope)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    try {
      assertAudienceAllowed(scope, parsed.data.audience);
    } catch (e) {
      if (e instanceof ManagerScopeError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const event = await createEvent(supabase, session.tenantId, parsed.data, {
      createdByEmployeeId: session.employeeId,
    });

    return NextResponse.json(event, { status: 201 });
  }

  return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
}

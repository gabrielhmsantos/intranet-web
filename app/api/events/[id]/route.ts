import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/roles";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { assertTenantAccess, TenantAccessError } from "@/lib/tenant-context";
import {
  assertAudienceAllowed,
  isAudienceUnchanged,
  loadManagerScope,
  ManagerScopeError,
} from "@/lib/events/manager-scope";
import {
  canEditEvent,
  canMutateEvents,
  isLimitedAuthorEdit,
  ownershipContext,
} from "@/lib/events/mutation-access";
import {
  limitedAuthorUpdateBodySchema,
  updateEventBodySchema,
} from "@/lib/events/schemas";
import type { UpdateEventBody } from "@/lib/events/schemas";
import {
  EventCanceledError,
  EventNotFoundError,
  getEventById,
  updateEvent,
} from "@/lib/events/repository";

type RouteContext = { params: Promise<{ id: string }> };

function rejectForbiddenFields(
  body: UpdateEventBody,
  limited: boolean,
): string | null {
  if (!limited) {
    return null;
  }
  if (
    body.startsAt !== undefined ||
    body.endsAt !== undefined ||
    body.location !== undefined ||
    body.audience !== undefined
  ) {
    return "Só pode alterar título e descrição. Para reagendar ou mudar o público, contacte RH ou um gestor.";
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
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

  try {
    const event = await getEventById(supabase, session.tenantId, id);
    return NextResponse.json(event);
  } catch (e) {
    if (e instanceof EventNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Serviço indisponível." }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await context.params;

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

  let existing;
  try {
    existing = await getEventById(supabase, session.tenantId, id);
  } catch (e) {
    if (e instanceof EventNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }

  const ctx = ownershipContext(session.role, session.employeeId, existing);

  if (!canEditEvent(ctx)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const limited = isLimitedAuthorEdit(ctx);

  const parsed = limited
    ? limitedAuthorUpdateBodySchema.safeParse(body)
    : updateEventBodySchema.safeParse(body);

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const patchBody = parsed.data as UpdateEventBody;

  const forbidden = rejectForbiddenFields(patchBody, limited);
  if (forbidden) {
    return NextResponse.json({ error: forbidden }, { status: 403 });
  }

  if (
    session.role === "manager" &&
    !canMutateEvents(session.role) &&
    patchBody.audience &&
    !isAudienceUnchanged(existing.audience, patchBody.audience)
  ) {
    if (!session.employeeId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
    }

    const scope = await loadManagerScope(
      supabase,
      session.tenantId,
      session.employeeId,
    );

    try {
      assertAudienceAllowed(scope, patchBody.audience);
    } catch (e) {
      if (e instanceof ManagerScopeError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }
  }

  try {
    const event = await updateEvent(supabase, session.tenantId, id, patchBody);
    return NextResponse.json(event);
  } catch (e) {
    if (e instanceof EventNotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    if (e instanceof EventCanceledError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
}

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadEventAudience, resolveRecipientUserIds } from "@/lib/events/audience";
import { insertImmediateForRecipients } from "@/lib/events/notifications";
import type {
  CreateEventBody,
  ListEventsQuery,
  UpdateEventBody,
} from "@/lib/events/schemas";
import {
  getTenantTimezone,
  instantEquals,
  tenantLocalInputToUtcIso,
} from "@/lib/events/timezone";
import type {
  EventDetail,
  EventListItem,
  EventListResult,
} from "@/lib/events/types";

export class EventNotFoundError extends Error {
  constructor() {
    super("Evento não encontrado.");
    this.name = "EventNotFoundError";
  }
}

export class EventCanceledError extends Error {
  constructor() {
    super("Evento cancelado.");
    this.name = "EventCanceledError";
  }
}

export class EventAlreadyCanceledError extends Error {
  constructor() {
    super("Evento já cancelado.");
    this.name = "EventAlreadyCanceledError";
  }
}

type EventRow = {
  id: string;
  tenant_id: string;
  status: "active" | "canceled";
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string;
  audience_type: "company" | "department" | "employees";
  audience_department_id: string | null;
  created_at: string;
  updated_at: string;
};

function toListItem(row: EventRow): EventListItem {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
  };
}

export async function listEvents(
  supabase: SupabaseClient,
  tenantId: string,
  query: ListEventsQuery,
): Promise<EventListResult> {
  let builder = supabase
    .from("events")
    .select("id, title, starts_at, ends_at, status", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("starts_at", { ascending: false });

  if (query.status) {
    builder = builder.eq("status", query.status);
  }

  if (query.from) {
    builder = builder.gte("starts_at", query.from);
  }

  if (query.to) {
    builder = builder.lte("starts_at", query.to);
  }

  if (query.q) {
    builder = builder.ilike("title", `%${query.q}%`);
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  const { data, error, count } = await builder.range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  return {
    items: ((data ?? []) as EventRow[]).map(toListItem),
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages,
  };
}

export async function getEventById(
  supabase: SupabaseClient,
  tenantId: string,
  eventId: string,
): Promise<EventDetail> {
  const { data, error } = await supabase
    .from("events")
    .select(
      "id, tenant_id, status, title, description, location, starts_at, ends_at, audience_type, audience_department_id, created_at, updated_at",
    )
    .eq("tenant_id", tenantId)
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new EventNotFoundError();
  }

  const row = data as EventRow;
  const audience = await loadEventAudience(supabase, row.id, row);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    audience,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function syncAudienceEmployees(
  supabase: SupabaseClient,
  eventId: string,
  employeeIds: string[] | undefined,
  audienceType: CreateEventBody["audience"]["type"],
): Promise<void> {
  await supabase.from("event_audience_employees").delete().eq("event_id", eventId);

  if (audienceType !== "employees" || !employeeIds?.length) {
    return;
  }

  const rows = employeeIds.map((employeeId) => ({
    event_id: eventId,
    employee_id: employeeId,
  }));

  const { error } = await supabase.from("event_audience_employees").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

function audienceDbFields(audience: CreateEventBody["audience"]) {
  return {
    audience_type: audience.type,
    audience_department_id:
      audience.type === "department" ? audience.departmentId ?? null : null,
  };
}

export async function createEvent(
  supabase: SupabaseClient,
  tenantId: string,
  body: CreateEventBody,
): Promise<EventDetail> {
  const timeZone = await getTenantTimezone(supabase, tenantId);
  const startsAt = tenantLocalInputToUtcIso(body.startsAt, timeZone);
  const endsAt = tenantLocalInputToUtcIso(body.endsAt, timeZone);

  const { data, error } = await supabase
    .from("events")
    .insert({
      tenant_id: tenantId,
      title: body.title,
      description: body.description ?? null,
      location: body.location ?? null,
      starts_at: startsAt,
      ends_at: endsAt,
      ...audienceDbFields(body.audience),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Erro ao criar evento.");
  }

  await syncAudienceEmployees(
    supabase,
    data.id as string,
    body.audience.employeeIds,
    body.audience.type,
  );

  return getEventById(supabase, tenantId, data.id as string);
}

export async function updateEvent(
  supabase: SupabaseClient,
  tenantId: string,
  eventId: string,
  body: UpdateEventBody,
): Promise<EventDetail> {
  const existing = await getEventById(supabase, tenantId, eventId);

  if (existing.status === "canceled") {
    throw new EventCanceledError();
  }

  const timeZone = await getTenantTimezone(supabase, tenantId);

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.title !== undefined) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description ?? null;

  let locationChanged = false;
  if (body.location !== undefined) {
    const nextLocation = body.location ?? null;
    patch.location = nextLocation;
    locationChanged = nextLocation !== (existing.location ?? null);
  }

  let timeChanged = false;

  if (body.startsAt !== undefined) {
    const nextStartsAt = tenantLocalInputToUtcIso(body.startsAt, timeZone);
    patch.starts_at = nextStartsAt;
    timeChanged = !instantEquals(nextStartsAt, existing.startsAt);
  }

  if (body.endsAt !== undefined) {
    const nextEndsAt = tenantLocalInputToUtcIso(body.endsAt, timeZone);
    patch.ends_at = nextEndsAt;
    timeChanged = timeChanged || !instantEquals(nextEndsAt, existing.endsAt);
  }

  if (body.audience) {
    Object.assign(patch, audienceDbFields(body.audience as CreateEventBody["audience"]));
  }

  const { error } = await supabase
    .from("events")
    .update(patch)
    .eq("tenant_id", tenantId)
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  if (body.audience) {
    await syncAudienceEmployees(
      supabase,
      eventId,
      body.audience.employeeIds,
      body.audience.type,
    );
  }

  const updated = await getEventById(supabase, tenantId, eventId);

  if (timeChanged || locationChanged) {
    const admin = createAdminClient();
    const recipientUserIds = await resolveRecipientUserIds(supabase, tenantId, {
      type: updated.audience.type,
      departmentId: updated.audience.departmentId,
      employeeIds: updated.audience.employeeIds,
    });

    const notifyBase = {
      tenantId,
      eventId,
      eventTitle: updated.title,
      startsAt: updated.startsAt,
      endsAt: updated.endsAt,
      timeZone,
      recipientUserIds,
    };

    if (timeChanged) {
      await insertImmediateForRecipients(admin, {
        ...notifyBase,
        kind: "event_time_changed",
      });
    }

    if (locationChanged) {
      await insertImmediateForRecipients(admin, {
        ...notifyBase,
        kind: "event_location_changed",
        location: updated.location,
        previousLocation: existing.location,
      });
    }
  }

  return updated;
}

export async function cancelEvent(
  supabase: SupabaseClient,
  tenantId: string,
  eventId: string,
): Promise<EventDetail> {
  const existing = await getEventById(supabase, tenantId, eventId);

  if (existing.status === "canceled") {
    throw new EventAlreadyCanceledError();
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  const canceled = await getEventById(supabase, tenantId, eventId);
  const timeZone = await getTenantTimezone(supabase, tenantId);
  const admin = createAdminClient();

  const recipientUserIds = await resolveRecipientUserIds(supabase, tenantId, {
    type: canceled.audience.type,
    departmentId: canceled.audience.departmentId,
    employeeIds: canceled.audience.employeeIds,
  });

  await insertImmediateForRecipients(admin, {
    tenantId,
    eventId,
    kind: "event_canceled",
    eventTitle: canceled.title,
    startsAt: canceled.startsAt,
    endsAt: canceled.endsAt,
    timeZone,
    recipientUserIds,
  });

  return canceled;
}

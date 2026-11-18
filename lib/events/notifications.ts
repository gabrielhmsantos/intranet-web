import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImmediateNotificationKind } from "@/lib/events/types";
import { formatEventDateTime } from "@/lib/events/timezone";

export type InsertImmediateParams = {
  tenantId: string;
  eventId: string;
  kind: ImmediateNotificationKind;
  eventTitle: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  recipientUserIds: string[];
  location?: string | null;
  previousLocation?: string | null;
};

export async function insertImmediateForRecipients(
  admin: SupabaseClient,
  params: InsertImmediateParams,
): Promise<void> {
  const { recipientUserIds } = params;
  if (recipientUserIds.length === 0) return;

  const { title, body } = buildNotificationCopy(params);

  const rows = recipientUserIds.map((recipientUserId) => ({
    tenant_id: params.tenantId,
    recipient_user_id: recipientUserId,
    event_id: params.eventId,
    kind: params.kind,
    title,
    body,
  }));

  const { error } = await admin.from("notifications").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

function buildNotificationCopy(params: InsertImmediateParams): {
  title: string;
  body: string;
} {
  const window = `${formatEventDateTime(params.startsAt, params.timeZone)} – ${formatEventDateTime(params.endsAt, params.timeZone)}`;

  if (params.kind === "event_canceled") {
    return {
      title: `Evento cancelado: ${params.eventTitle}`,
      body: `O evento «${params.eventTitle}» foi cancelado. Horário previsto: ${window}.`,
    };
  }

  if (params.kind === "event_location_changed") {
    const next = formatLocation(params.location);
    const previous = formatLocation(params.previousLocation);
    if (next) {
      const fromPrevious = previous ? ` Anteriormente: ${previous}.` : "";
      return {
        title: `Local alterado: ${params.eventTitle}`,
        body: `O local do evento «${params.eventTitle}» foi actualizado para ${next}.${fromPrevious} Horário: ${window}.`,
      };
    }
    return {
      title: `Local removido: ${params.eventTitle}`,
      body: `O local do evento «${params.eventTitle}» foi removido.${
        previous ? ` Local anterior: ${previous}.` : ""
      } Horário: ${window}.`,
    };
  }

  return {
    title: `Horário alterado: ${params.eventTitle}`,
    body: `O horário do evento «${params.eventTitle}» foi actualizado para ${window}.`,
  };
}

function formatLocation(location: string | null | undefined): string | null {
  const trimmed = location?.trim();
  return trimmed ? `«${trimmed}»` : null;
}

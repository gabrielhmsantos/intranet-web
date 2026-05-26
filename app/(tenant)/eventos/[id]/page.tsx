import { notFound, redirect } from "next/navigation";
import { EventDetailView } from "@/components/events/event-detail";
import { canCancelEvent, canEditEvent } from "@/lib/events/roles";
import { EventNotFoundError, getEventById } from "@/lib/events/repository";
import { getTenantTimezone, utcToTenantLocalInput } from "@/lib/events/timezone";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Evento" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EventoDetailPage({ params }: PageProps) {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">Configure Supabase para ver o evento.</p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await createClient();
  const timeZone = await getTenantTimezone(supabase, session.tenantId);

  let event;
  try {
    event = await getEventById(supabase, session.tenantId, id);
  } catch (e) {
    if (e instanceof EventNotFoundError) {
      notFound();
    }
    throw e;
  }

  return (
    <EventDetailView
      event={event}
      canEdit={canEditEvent(session.role, event.status)}
      canCancel={canCancelEvent(session.role, event.status)}
      timeZone={timeZone}
      defaultStartsAt={utcToTenantLocalInput(event.startsAt, timeZone)}
      defaultEndsAt={utcToTenantLocalInput(event.endsAt, timeZone)}
    />
  );
}

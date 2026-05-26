import { redirect } from "next/navigation";
import { EventList } from "@/components/events/event-list";
import { canMutateEvents } from "@/lib/events/roles";
import { listEvents } from "@/lib/events/repository";
import { getTenantTimezone } from "@/lib/events/timezone";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Eventos" };

export default async function EventosPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver eventos internos.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const timeZone = await getTenantTimezone(supabase, session.tenantId);
  const initial = await listEvents(supabase, session.tenantId, {
    page: 1,
    pageSize: 20,
  });

  return (
    <EventList
      initial={initial}
      canCreate={canMutateEvents(session.role)}
      timeZone={timeZone}
    />
  );
}

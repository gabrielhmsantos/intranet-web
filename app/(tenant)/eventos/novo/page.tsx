import { redirect } from "next/navigation";
import { EventForm } from "@/components/events/event-form";
import { canMutateEvents } from "@/lib/events/roles";
import { getServerSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Novo evento" };

export default async function NovoEventoPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">Configure Supabase para criar eventos.</p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  if (!canMutateEvents(session.role)) {
    redirect("/sem-permissao");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Novo evento</h1>
      <EventForm mode="create" />
    </div>
  );
}

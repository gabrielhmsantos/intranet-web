import { notFound, redirect } from "next/navigation";
import { EventDetailView } from "@/components/events/event-detail";
import { loadManagerScope } from "@/lib/events/manager-scope";
import {
  canCancelEvent,
  canEditEvent,
  isLimitedAuthorEdit,
  ownershipContext,
} from "@/lib/events/mutation-access";
import { canMutateEvents } from "@/lib/events/roles";
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

  const ctx = ownershipContext(session.role, session.employeeId, event);
  const canEdit = canEditEvent(ctx);

  let managedDepartments: { id: string; name: string }[] | undefined;
  let scopedEmployees: { id: string; fullName: string }[] | undefined;

  if (
    session.role === "manager" &&
    session.employeeId &&
    canEdit &&
    !canMutateEvents(session.role)
  ) {
    try {
      const scope = await loadManagerScope(
        supabase,
        session.tenantId,
        session.employeeId,
      );
      managedDepartments = scope.managedDepartments;
      scopedEmployees = scope.scopedEmployees;
    } catch {
      managedDepartments = [];
      scopedEmployees = [];
    }
  }

  return (
    <EventDetailView
      event={event}
      canEdit={canEdit}
      canCancel={canCancelEvent(ctx)}
      limitedEdit={isLimitedAuthorEdit(ctx)}
      managerEditMode={Boolean(managedDepartments)}
      managedDepartments={managedDepartments}
      scopedEmployees={scopedEmployees}
      timeZone={timeZone}
      defaultStartsAt={utcToTenantLocalInput(event.startsAt, timeZone)}
      defaultEndsAt={utcToTenantLocalInput(event.endsAt, timeZone)}
    />
  );
}

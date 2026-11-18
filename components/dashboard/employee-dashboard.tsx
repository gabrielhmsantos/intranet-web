"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUpcomingEvents,
  type DashboardEventRow,
} from "@/lib/dashboard/queries";
import { DashboardEventsList } from "@/components/dashboard/dashboard-events-list";
import { DashboardNotificationsWidget } from "@/components/dashboard/dashboard-notifications-widget";
import { Button } from "@/components/ui/button";

type EmployeeDashboardProps = {
  timeZone: string;
};

export function EmployeeDashboard({ timeZone }: EmployeeDashboardProps) {
  const [events, setEvents] = useState<DashboardEventRow[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setEventsLoading(true);
      setEventsError(null);
      try {
        const supabase = createClient();
        const rows = await fetchUpcomingEvents(supabase, 5);
        if (!cancelled) {
          setEvents(rows);
        }
      } catch {
        if (!cancelled) {
          setEventsError("Não foi possível carregar os eventos.");
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setEventsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6" data-testid="employee-dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
        <p className="text-sm text-muted-foreground">
          Resumo dos seus próximos eventos e notificações.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {eventsLoading ? (
          <p className="text-sm text-muted-foreground">A carregar eventos…</p>
        ) : eventsError ? (
          <p className="text-sm text-destructive">{eventsError}</p>
        ) : (
          <DashboardEventsList
            title="Próximos eventos"
            events={events}
            timeZone={timeZone}
            emptyMessage="Sem eventos próximos"
            emptyCtaHref="/eventos"
            emptyCtaLabel="Ver eventos"
          />
        )}
        <DashboardNotificationsWidget timeZone={timeZone} />
      </div>

      <div className="flex flex-wrap gap-2" data-testid="dashboard-shortcuts">
        <Button variant="secondary" asChild>
          <Link href="/organograma">Organograma</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/eventos">Eventos</Link>
        </Button>
      </div>
    </div>
  );
}

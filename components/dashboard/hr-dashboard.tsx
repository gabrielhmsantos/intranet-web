"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchPendingInvites,
  fetchWeekEvents,
  type DashboardEventRow,
  type PendingInvitesResult,
} from "@/lib/dashboard/queries";
import { DashboardEventsList } from "@/components/dashboard/dashboard-events-list";
import { DashboardPendingInvites } from "@/components/dashboard/dashboard-pending-invites";
import { Button } from "@/components/ui/button";

type HrDashboardProps = {
  timeZone: string;
};

export function HrDashboard({ timeZone }: HrDashboardProps) {
  const [invites, setInvites] = useState<PendingInvitesResult | null>(null);
  const [events, setEvents] = useState<DashboardEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const [inviteData, weekEvents] = await Promise.all([
          fetchPendingInvites(supabase, 5),
          fetchWeekEvents(supabase, timeZone, 8),
        ]);
        if (!cancelled) {
          setInvites(inviteData);
          setEvents(weekEvents);
        }
      } catch {
        if (!cancelled) {
          setError("Não foi possível carregar o resumo operacional.");
          setInvites({ items: [], totalCount: 0 });
          setEvents([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [timeZone]);

  return (
    <div className="flex flex-col gap-6" data-testid="hr-dashboard">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
        <p className="text-sm text-muted-foreground">
          Resumo operacional de convites e agenda da semana.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {invites ? <DashboardPendingInvites data={invites} /> : null}
          <DashboardEventsList
            title="Eventos da semana"
            events={events}
            timeZone={timeZone}
            emptyMessage="Sem eventos esta semana"
            emptyCtaHref="/eventos"
            emptyCtaLabel="Ver eventos"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2" data-testid="dashboard-shortcuts">
        <Button variant="secondary" asChild>
          <Link href="/colaboradores">Colaboradores</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/eventos">Eventos</Link>
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDashboardNotifications,
  NotificationAuthError,
} from "@/lib/dashboard/queries";
import { markRead } from "@/lib/notifications/queries";
import type { NotificationRow } from "@/lib/notifications/types";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardNotificationsWidgetProps = {
  timeZone: string;
};

export function DashboardNotificationsWidget({
  timeZone,
}: DashboardNotificationsWidgetProps) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const rows = await fetchDashboardNotifications(supabase, timeZone, 5);
        if (!cancelled) {
          setItems(rows);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof NotificationAuthError) {
          router.push("/login?sessao=expirada");
          return;
        }
        setError("Não foi possível carregar as notificações.");
        setItems([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, timeZone]);

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      const supabase = createClient();
      await markRead(supabase, id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
    } catch (err) {
      if (err instanceof NotificationAuthError) {
        router.push("/login?sessao=expirada");
        return;
      }
      toast.error("Não foi possível marcar como lida.");
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <Card data-testid="dashboard-notifications-section">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Últimas notificações</CardTitle>
        <Button variant="link" size="sm" className="h-auto px-0" asChild>
          <Link href="/notificacoes">Ver todas as notificações</Link>
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Sem notificações</p>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href="/notificacoes">Ver notificações</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id}>
                <NotificationItem
                  item={item}
                  timeZone={timeZone}
                  onMarkRead={handleMarkRead}
                  markingId={markingId}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

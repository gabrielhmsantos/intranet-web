"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  listNotifications,
  markAllRead,
  markRead,
  NotificationAuthError,
} from "@/lib/notifications/queries";
import type { NotificationFilter, NotificationRow } from "@/lib/notifications/types";
import { useNotificationBadge } from "@/lib/notifications/use-notification-badge";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

const PAGE_SIZE = 20;

type NotificationsPageClientProps = {
  timeZone: string;
};

export function NotificationsPageClient({ timeZone }: NotificationsPageClientProps) {
  const router = useRouter();
  const { refresh } = useNotificationBadge(timeZone);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const result = await listNotifications(supabase, {
        timeZone,
        filter,
        page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      if (err instanceof NotificationAuthError) {
        router.push("/login?sessao=expirada");
        return;
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filter, page, router, timeZone]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const result = await listNotifications(supabase, {
          timeZone,
          filter,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof NotificationAuthError) {
            router.push("/login?sessao=expirada");
            return;
          }
          setItems([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filter, page, router, timeZone]);

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      const supabase = createClient();
      await markRead(supabase, id);
      await loadPage();
      await refresh();
      toast.success("Notificação marcada como lida.");
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

  async function handleMarkAllRead() {
    setMarkingAll(true);
    try {
      const supabase = createClient();
      await markAllRead(supabase, timeZone);
      await loadPage();
      await refresh();
      toast.success("Todas as notificações foram marcadas como lidas.");
    } catch (err) {
      if (err instanceof NotificationAuthError) {
        router.push("/login?sessao=expirada");
        return;
      }
      toast.error("Não foi possível marcar todas como lidas.");
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="notifications-mark-all-page"
          disabled={markingAll}
          onClick={() => void handleMarkAllRead()}
        >
          Marcar todas como lidas
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          data-testid="notifications-filter-all"
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
        >
          Todas
        </Button>
        <Button
          type="button"
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          data-testid="notifications-filter-unread"
          onClick={() => {
            setFilter("unread");
            setPage(1);
          }}
        >
          Não lidas
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : items.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Sem notificações</EmptyTitle>
            <EmptyDescription>
              Não há notificações neste filtro nos últimos 90 dias.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationItem
                item={item}
                timeZone={timeZone}
                onMarkRead={(id) => void handleMarkRead(id)}
                markingId={markingId}
              />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="notifications-prev"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="notifications-next"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Seguinte
          </Button>
        </div>
      ) : null}
    </div>
  );
}

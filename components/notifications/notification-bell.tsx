"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatBadgeCount } from "@/lib/notifications/format";
import {
  markAllRead,
  markRead,
  NotificationAuthError,
  previewNotifications,
} from "@/lib/notifications/queries";
import type { NotificationRow } from "@/lib/notifications/types";
import { useIsClient, useIsLgUp } from "@/hooks/use-mobile";
import { useNotificationBadge } from "@/lib/notifications/use-notification-badge";
import { NotificationList } from "@/components/notifications/notification-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NotificationBellProps = {
  timeZone: string;
};

function BellIconButton({
  unreadCount,
  showBadge,
}: {
  unreadCount: number;
  showBadge: boolean;
}) {
  return (
    <>
      <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />
      {showBadge && unreadCount > 0 ? (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px]"
          data-testid="notification-badge"
        >
          {formatBadgeCount(unreadCount)}
        </Badge>
      ) : null}
    </>
  );
}

export function NotificationBell({ timeZone }: NotificationBellProps) {
  const router = useRouter();
  const { unreadCount, refresh, enabled } = useNotificationBadge(timeZone);
  const [open, setOpen] = useState(false);
  const isLgUp = useIsLgUp();
  const isClient = useIsClient();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadPreview = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const rows = await previewNotifications(supabase, timeZone);
      setItems(rows);
    } catch (err) {
      if (err instanceof NotificationAuthError) {
        router.push("/login?sessao=expirada");
        return;
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, router, timeZone]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      void refresh();
      void loadPreview();
    }
  }

  async function handleMarkRead(id: string) {
    if (!enabled) return;
    setMarkingId(id);
    try {
      const supabase = createClient();
      await markRead(supabase, id);
      setItems((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
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
    if (!enabled) return;
    setMarkingAll(true);
    try {
      const supabase = createClient();
      await markAllRead(supabase, timeZone);
      setItems((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })),
      );
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

  if (!enabled) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Notificações"
        disabled
        data-testid="notification-bell"
      >
        <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} />
      </Button>
    );
  }

  const panel = (
    <NotificationList
      items={items}
      timeZone={timeZone}
      loading={loading}
      onMarkRead={handleMarkRead}
      onMarkAllRead={handleMarkAllRead}
      markingId={markingId}
      markingAll={markingAll}
      canMarkAll={unreadCount > 0}
    />
  );

  return (
    <div data-testid="notification-bell" className="flex items-center">
      <Popover
        open={open && isLgUp}
        onOpenChange={(next) => {
          if (isLgUp) handleOpenChange(next);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative hidden lg:inline-flex"
            aria-label="Notificações"
            data-testid="notification-bell-trigger"
          >
            <BellIconButton
              unreadCount={unreadCount}
              showBadge={isClient}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-96 p-0"
          align="end"
          data-testid="notification-panel"
        >
          <div className="p-3">{panel}</div>
        </PopoverContent>
      </Popover>

      <Sheet
        open={open && !isLgUp}
        onOpenChange={(next) => {
          if (!isLgUp) handleOpenChange(next);
        }}
      >
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative lg:hidden"
            aria-label="Notificações"
            data-testid="notification-bell-trigger"
          >
            <BellIconButton
              unreadCount={unreadCount}
              showBadge={isClient}
            />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" data-testid="notification-panel">
          <SheetHeader>
            <SheetTitle>Notificações</SheetTitle>
            <SheetDescription className="sr-only">
              Pré-visualização das notificações mais recentes.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">{panel}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

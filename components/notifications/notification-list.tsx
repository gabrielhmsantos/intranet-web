"use client";

import Link from "next/link";
import type { NotificationRow } from "@/lib/notifications/types";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type NotificationListProps = {
  items: NotificationRow[];
  timeZone: string;
  loading?: boolean;
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  markingId?: string | null;
  markingAll?: boolean;
  showFooterLinks?: boolean;
  canMarkAll?: boolean;
};

export function NotificationList({
  items,
  timeZone,
  loading,
  onMarkRead,
  onMarkAllRead,
  markingId,
  markingAll,
  showFooterLinks = true,
  canMarkAll,
}: NotificationListProps) {
  const hasUnread =
    canMarkAll ?? items.some((i) => i.read_at === null);

  if (!loading && items.length === 0) {
    return (
      <Empty className="border-0 p-6" data-testid="notification-empty">
        <EmptyHeader>
          <EmptyTitle>Sem notificações</EmptyTitle>
          <EmptyDescription>
            Quando houver avisos novos, aparecem aqui.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-3" data-testid="notification-list">
      {showFooterLinks && hasUnread && onMarkAllRead ? (
        <div className="flex justify-end border-b pb-2">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0"
            data-testid="notification-mark-all-read"
            disabled={markingAll}
            onClick={onMarkAllRead}
          >
            Marcar todas como lidas
          </Button>
        </div>
      ) : null}

      <ul className="flex max-h-[min(24rem,60vh)] flex-col gap-2 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <NotificationItem
              item={item}
              timeZone={timeZone}
              onMarkRead={onMarkRead}
              markingId={markingId}
            />
          </li>
        ))}
      </ul>

      {showFooterLinks ? (
        <div className="border-t pt-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href="/notificacoes">Ver todas as notificações</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

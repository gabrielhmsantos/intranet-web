"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatNotificationDate } from "@/lib/notifications/format";
import type { NotificationRow } from "@/lib/notifications/types";
import { Button } from "@/components/ui/button";

type NotificationItemProps = {
  item: NotificationRow;
  timeZone: string;
  onMarkRead?: (id: string) => void;
  markingId?: string | null;
};

export function NotificationItem({
  item,
  timeZone,
  onMarkRead,
  markingId,
}: NotificationItemProps) {
  const router = useRouter();
  const isUnread = item.read_at === null;

  function handleBodyClick() {
    if (item.event_id) {
      router.push(`/eventos/${item.event_id}`);
    }
  }

  function handleMarkRead(e: React.MouseEvent) {
    e.stopPropagation();
    if (isUnread && onMarkRead) {
      onMarkRead(item.id);
    }
  }

  const bodyProps = item.event_id
    ? {
        role: "button" as const,
        tabIndex: 0,
        className:
          "flex min-w-0 flex-1 cursor-pointer flex-col gap-1 pr-2 text-left hover:opacity-90",
        onClick: handleBodyClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleBodyClick();
          }
        },
      }
    : {
        className: "flex min-w-0 flex-1 flex-col gap-1 pr-2",
      };

  return (
    <article
      data-testid="notification-item"
      className={cn(
        "group relative flex rounded-lg border p-3 transition-colors",
        isUnread ? "border-primary/30 bg-muted/40" : "border-border bg-background",
        item.event_id && "hover:bg-muted/60",
      )}
    >
      <div {...bodyProps}>
        <p className="text-sm font-medium leading-snug">{item.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.body}</p>
        <time
          className="text-xs text-muted-foreground"
          dateTime={item.created_at}
          suppressHydrationWarning
        >
          {formatNotificationDate(item.created_at, timeZone)}
        </time>
      </div>
      {isUnread && onMarkRead ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 self-start px-2 text-xs opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
          data-testid="notification-mark-read"
          disabled={markingId === item.id}
          onClick={handleMarkRead}
        >
          Marcar como lida
        </Button>
      ) : null}
    </article>
  );
}

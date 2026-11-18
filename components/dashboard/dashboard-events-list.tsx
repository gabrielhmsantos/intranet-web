import Link from "next/link";
import { formatEventDateTime } from "@/lib/events/timezone";
import type { DashboardEventRow } from "@/lib/dashboard/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardEventsListProps = {
  title: string;
  description?: string;
  events: DashboardEventRow[];
  timeZone: string;
  emptyMessage: string;
  emptyCtaHref: string;
  emptyCtaLabel: string;
};

export function DashboardEventsList({
  title,
  description,
  events,
  timeZone,
  emptyMessage,
  emptyCtaHref,
  emptyCtaLabel,
}: DashboardEventsListProps) {
  return (
    <Card data-testid="dashboard-events-section">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {events.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            <Button variant="outline" size="sm" className="w-fit" asChild>
              <Link href={emptyCtaHref}>{emptyCtaLabel}</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/eventos/${event.id}`}
                  className="flex flex-col gap-0.5 rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="text-sm font-medium">{event.title}</span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={event.starts_at}
                    suppressHydrationWarning
                  >
                    {formatEventDateTime(event.starts_at, timeZone)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

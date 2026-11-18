import Link from "next/link";
import type { PendingInvitesResult } from "@/lib/dashboard/queries";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardPendingInvitesProps = {
  data: PendingInvitesResult;
};

export function DashboardPendingInvites({ data }: DashboardPendingInvitesProps) {
  const { items, totalCount } = data;
  const truncated = totalCount > items.length;

  return (
    <Card data-testid="dashboard-pending-invites-section">
      <CardHeader>
        <CardTitle>Convites pendentes</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem convites pendentes</p>
        ) : (
          <>
            <ul className="flex flex-col gap-2">
              {items.map((row) => (
                <li
                  key={row.employeeId}
                  className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm"
                >
                  <span className="font-medium">{row.displayName}</span>
                  <span className="text-muted-foreground">{row.label}</span>
                </li>
              ))}
            </ul>
            {truncated ? (
              <p className="text-xs text-muted-foreground">
                +{totalCount - items.length} pendente
                {totalCount - items.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </>
        )}
        <Button variant="outline" size="sm" className="w-fit" asChild>
          <Link href="/colaboradores">Ver colaboradores</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

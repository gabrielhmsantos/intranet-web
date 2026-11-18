"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TenantSummaryRow } from "@/lib/platform/tenant-summary-types";

type TenantSummaryTableProps = {
  tenants: TenantSummaryRow[];
};

export function TenantSummaryTable({ tenants }: TenantSummaryTableProps) {
  if (tenants.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
        <p className="text-muted-foreground">
          Ainda não existem empresas clientes na plataforma.
        </p>
        <Button asChild>
          <Link href="/plataforma/tenants/novo">Nova empresa</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Totais por empresa — sem dados pessoais.
        </p>
        <Button asChild>
          <Link href="/plataforma/tenants/novo">Nova empresa</Link>
        </Button>
      </div>
      <div className="max-h-[min(70vh,640px)] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-right">Colaboradores</TableHead>
              <TableHead className="text-right">Eventos</TableHead>
              <TableHead className="text-right">Convites pendentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.tenantId}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{t.tenantName}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.tenantId.slice(0, 8)}…
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t.activeEmployees}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t.activeEvents}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {t.pendingInvites}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeFormDialog } from "@/components/employees/employee-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmployeeListItem, EmployeeListResult } from "@/lib/employees/types";

type EmployeeListProps = {
  initial: EmployeeListResult;
  canCreate: boolean;
  canListInactive: boolean;
  canViewAccess: boolean;
};

function inviteLabel(status: EmployeeListItem["inviteStatus"]): string {
  switch (status) {
    case "active":
      return "Conta activa";
    case "pending":
      return "Convite pendente";
    default:
      return "Sem conta";
  }
}

export function EmployeeList({
  initial,
  canCreate,
  canListInactive,
  canViewAccess,
}: EmployeeListProps) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [q, setQ] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (page: number, search: string, withInactive: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(data.pageSize),
        });
        if (search.trim()) params.set("q", search.trim());
        if (withInactive) params.set("includeInactive", "true");
        const res = await fetch(`/api/employees?${params}`);
        if (!res.ok) return;
        const json = (await res.json()) as EmployeeListResult;
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    [data.pageSize],
  );

  const onSearch = () => {
    void load(1, q, includeInactive);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Colaboradores</h1>
        {canCreate ? <EmployeeFormDialog mode="create" /> : null}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex max-w-md flex-1 gap-2">
          <Input
            placeholder="Pesquisar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onSearch}
            disabled={loading}
          >
            Pesquisar
          </Button>
        </div>
        {canListInactive ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="includeInactive"
              checked={includeInactive}
              onCheckedChange={(checked) => {
                const next = checked === true;
                setIncludeInactive(next);
                void load(1, q, next);
              }}
            />
            <Label htmlFor="includeInactive">Ver desligados</Label>
          </div>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Departamento</TableHead>
            {canViewAccess ? (
              <>
                <TableHead>Conta</TableHead>
                <TableHead>Convite</TableHead>
              </>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={canViewAccess ? 4 : 2}
                className="text-muted-foreground"
              >
                Nenhum colaborador encontrado.
              </TableCell>
            </TableRow>
          ) : (
            data.items.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => router.push(`/colaboradores/${row.id}`)}
              >
                <TableCell className="font-medium">
                  {row.displayName}
                  {row.status === "inactive" ? (
                    <Badge variant="outline" className="ml-2">
                      Desligado
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell>{row.departmentName ?? "—"}</TableCell>
                {canViewAccess ? (
                  <>
                    <TableCell>{row.hasAccount ? "Sim" : "Não"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {inviteLabel(row.inviteStatus ?? "none")}
                      </Badge>
                    </TableCell>
                  </>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          {data.total} colaborador{data.total === 1 ? "" : "es"}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || data.page <= 1}
            onClick={() => void load(data.page - 1, q, includeInactive)}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || data.page * data.pageSize >= data.total}
            onClick={() => void load(data.page + 1, q, includeInactive)}
          >
            Seguinte
          </Button>
        </div>
      </div>
    </div>
  );
}

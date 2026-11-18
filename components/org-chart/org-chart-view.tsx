"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import type { OrgChartDepartment } from "@/lib/org-chart/build-tree";

type OrgChartViewProps = {
  departments: OrgChartDepartment[];
  canManageDepartments: boolean;
  manageDepartmentsSlot?: React.ReactNode;
};

export function OrgChartView({
  departments,
  canManageDepartments,
  manageDepartmentsSlot,
}: OrgChartViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    departments[0]?.id ?? null,
  );

  const selected = departments.find((d) => d.id === selectedId) ?? null;
  const managerMember = selected
    ? selected.members.find((m) => m.id === selected.managerEmployeeId)
    : null;

  if (departments.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Organograma</h1>
          {canManageDepartments ? manageDepartmentsSlot : null}
        </div>
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Sem departamentos</EmptyTitle>
            <EmptyDescription>
              {canManageDepartments
                ? "Crie o primeiro departamento para visualizar a estrutura organizacional."
                : "Ainda não existem departamentos configurados na organização."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Organograma</h1>
        {canManageDepartments ? manageDepartmentsSlot : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Departamentos</h2>
          <ul className="flex flex-col gap-2">
            {departments.map((dept) => (
              <li key={dept.id}>
                <Button
                  type="button"
                  variant={selectedId === dept.id ? "default" : "outline"}
                  className="h-auto w-full justify-start py-3 text-left"
                  onClick={() => setSelectedId(dept.id)}
                >
                  <span className="flex flex-col items-start gap-1">
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-xs font-normal opacity-80">
                      {dept.members.length} membro
                      {dept.members.length === 1 ? "" : "s"} activo
                      {dept.members.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">
            {selected ? selected.name : "Membros"}
          </h2>
          {selected ? (
            <>
              {managerMember ? (
                <p className="text-sm text-muted-foreground">
                  Gestor:{" "}
                  <Link
                    href={`/colaboradores/${managerMember.id}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {managerMember.displayName}
                  </Link>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Gestor: não definido
                </p>
              )}
              {selected.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum colaborador activo neste departamento.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selected.members.map((member) => (
                    <li key={member.id}>
                      <Link
                        href={`/colaboradores/${member.id}`}
                        className="block rounded-lg border px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        {member.displayName}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Seleccione um departamento.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InviteLinkDialog } from "@/components/auth/invite-link-dialog";
import { PersonalInfoSection } from "@/components/employees/personal-info-section";
import { EmployeeFormDialog } from "@/components/employees/employee-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ProductRole } from "@/lib/roles";
import { canViewEmployeeAccess } from "@/lib/people-roles";
import type { EmployeeDetail } from "@/lib/employees/types";

type EmployeeDetailViewProps = {
  employee: EmployeeDetail;
  viewerRole: ProductRole;
};

function inviteLabel(status: EmployeeDetail["inviteStatus"]): string {
  switch (status) {
    case "active":
      return "Conta activa";
    case "pending":
      return "Convite pendente";
    default:
      return "Sem convite";
  }
}

export function EmployeeDetailView({
  employee,
  viewerRole,
}: EmployeeDetailViewProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const showAccess = canViewEmployeeAccess(viewerRole);

  async function handleDeactivate() {
    setPending(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/deactivate`, {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Não foi possível desactivar.");
        return;
      }
      toast.success("Colaborador desactivado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleReactivate() {
    setPending(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/reactivate`, {
        method: "POST",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Não foi possível reactivar.");
        return;
      }
      toast.success("Colaborador reactivado.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {employee.displayName}
          </h1>
          {employee.status === "inactive" ? (
            <Badge variant="outline">Desligado</Badge>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {employee.canEdit ? (
            <EmployeeFormDialog mode="edit" employee={employee} />
          ) : null}
          {employee.canDeactivate ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" disabled={pending}>
                  Desactivar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desactivar colaborador?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O colaborador deixará de aparecer no directório para a
                    maioria dos utilizadores. Esta acção pode ser revertida por
                    RH ou administração.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeactivate()}>
                    Desactivar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
          {employee.canReactivate ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => void handleReactivate()}
            >
              Reactivar
            </Button>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Dados profissionais</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted-foreground">E-mail</dt>
            <dd>{employee.workEmail ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Departamento</dt>
            <dd>{employee.departmentName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Gestor imediato</dt>
            <dd>{employee.managerName ?? "—"}</dd>
          </div>
          {employee.extensionNumber ? (
            <div>
              <dt className="text-sm text-muted-foreground">Ramal</dt>
              <dd>{employee.extensionNumber}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      {showAccess ? (
        <>
          <Separator />
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-medium">Acesso</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Conta</dt>
                <dd>{employee.hasAccount ? "Sim" : "Não"}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Convite</dt>
                <dd>
                  <Badge variant="secondary">
                    {inviteLabel(employee.inviteStatus ?? "none")}
                  </Badge>
                </dd>
              </div>
            </dl>
            {employee.canInvite ? (
              <InviteLinkDialog
                employeeId={employee.id}
                employeeLabel={employee.displayName}
              />
            ) : null}
          </section>
        </>
      ) : null}

      {showAccess ? <Separator /> : null}

      <PersonalInfoSection role={viewerRole} />
    </div>
  );
}

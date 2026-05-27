"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InviteLinkResultDialog } from "@/components/platform/invite-link-result-dialog";
import type { ExpiredBootstrapInvite } from "@/lib/platform/expired-invites-types";

type ExpiredBootstrapInvitesProps = {
  initialInvites: ExpiredBootstrapInvite[];
  initialError?: string | null;
};

export function ExpiredBootstrapInvites({
  initialInvites,
  initialError = null,
}: ExpiredBootstrapInvitesProps) {
  const [invites, setInvites] = useState(initialInvites);
  const [error, setError] = useState<string | null>(initialError);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [renewUrl, setRenewUrl] = useState<string | null>(null);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);

  async function reload() {
    setError(null);
    try {
      const res = await fetch("/api/platform/invites/expired");
      const body = (await res.json()) as {
        invites?: ExpiredBootstrapInvite[];
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? "Não foi possível carregar.");
        return;
      }
      setInvites(body.invites ?? []);
    } catch {
      setError("Não foi possível carregar.");
    }
  }

  async function onRenew(inviteId: string) {
    setActionError(null);
    const res = await fetch(`/api/platform/invites/${inviteId}/renew`, {
      method: "POST",
    });
    const body = (await res.json()) as { inviteUrl?: string; error?: string };
    if (!res.ok || !body.inviteUrl) {
      setActionError(body.error ?? "Não foi possível renovar.");
      return;
    }
    setRenewUrl(body.inviteUrl);
    setRenewDialogOpen(true);
    await reload();
  }

  async function onDeleteConfirm() {
    if (!deleteId) {
      return;
    }
    setActionError(null);
    const res = await fetch(`/api/platform/invites/${deleteId}/delete`, {
      method: "POST",
    });
    const body = (await res.json()) as { error?: string };
    setDeleteId(null);
    if (!res.ok) {
      setActionError(body.error ?? "Não foi possível excluir.");
      return;
    }
    await reload();
  }

  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (invites.length === 0) {
    return <p className="text-muted-foreground">Sem convites expirados.</p>;
  }

  return (
    <>
      {actionError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      <div className="overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Expirou em</TableHead>
              <TableHead className="text-right">Acções</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((inv) => (
              <TableRow key={inv.inviteId}>
                <TableCell>{inv.email}</TableCell>
                <TableCell>{inv.tenantName}</TableCell>
                <TableCell>
                  {new Date(inv.expiresAt).toLocaleString("pt-PT")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onRenew(inv.inviteId)}
                    >
                      Renovar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(inv.inviteId)}
                    >
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoga o convite e remove a conta apenas se o onboarding não foi
              concluído (empresa órfã).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDeleteConfirm()}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InviteLinkResultDialog
        open={renewDialogOpen}
        onOpenChange={setRenewDialogOpen}
        title="Convite renovado"
        description="Novo link de primeiro acesso — copie e envie por canal externo."
        inviteUrl={renewUrl}
      />
    </>
  );
}

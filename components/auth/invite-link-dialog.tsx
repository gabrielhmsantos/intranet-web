"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type InviteLinkDialogProps = {
  employeeId: string;
  employeeLabel: string;
};

export function InviteLinkDialog({
  employeeId,
  employeeLabel,
}: InviteLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const body = (await res.json()) as {
        inviteUrl?: string;
        error?: string;
      };
      if (!res.ok || !body.inviteUrl) {
        setError(body.error ?? "Não foi possível gerar o convite.");
        return;
      }
      setInviteUrl(body.inviteUrl);
    } catch {
      setError("Não foi possível gerar o convite.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary">
          Gerar convite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convite de acesso</DialogTitle>
          <DialogDescription>
            {employeeLabel} — copie o link e envie por canal externo (e-mail,
            Teams, etc.). Validade: 7 dias, uso único.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {!inviteUrl ? (
            <Button type="button" onClick={generate} disabled={pending}>
              {pending ? "A gerar…" : "Gerar link"}
            </Button>
          ) : (
            <>
              <Input readOnly value={inviteUrl} aria-label="Link do convite" />
              <Button
                type="button"
                onClick={() => navigator.clipboard.writeText(inviteUrl)}
              >
                Copiar link
              </Button>
            </>
          )}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

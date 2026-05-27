"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InviteLinkResultDialog } from "@/components/platform/invite-link-result-dialog";

export function ProvisionTenantForm() {
  const [companyName, setCompanyName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setManageUrl(null);

    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, adminEmail }),
      });
      const body = (await res.json()) as {
        inviteUrl?: string;
        error?: string;
        manageUrl?: string;
      };

      if (!res.ok) {
        setError(body.error ?? "Não foi possível criar a empresa.");
        if (body.manageUrl) {
          setManageUrl(body.manageUrl);
        }
        return;
      }

      if (body.inviteUrl) {
        setInviteUrl(body.inviteUrl);
        setDialogOpen(true);
        setCompanyName("");
        setAdminEmail("");
      }
    } catch {
      setError("Não foi possível criar a empresa.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <form className="flex max-w-md flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="companyName">Nome da empresa</Label>
          <Input
            id="companyName"
            name="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            autoComplete="organization"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="adminEmail">E-mail do administrador inicial</Label>
          <Input
            id="adminEmail"
            name="adminEmail"
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
            {manageUrl ? (
              <>
                {" "}
                <Link href={manageUrl} className="underline">
                  Convites expirados
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "A criar…" : "Criar empresa"}
        </Button>
      </form>

      <InviteLinkResultDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Primeiro acesso"
        description="Copie o link e envie por canal externo (e-mail, Teams, etc.). Validade: 7 dias, uso único."
        inviteUrl={inviteUrl}
      />
    </>
  );
}

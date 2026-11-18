"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  PASSWORD_REQUIREMENTS_HINT,
  validatePassword,
} from "@/lib/password-policy";

type ConviteFormProps = {
  token: string;
  maskedEmail: string;
};

export function ConviteForm({ token, maskedEmail }: ConviteFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const password = String(new FormData(form).get("password") ?? "");
    const passwordConfirm = String(
      new FormData(form).get("passwordConfirm") ?? "",
    );

    const policy = validatePassword(password);
    if (!policy.ok) {
      setError(policy.message);
      return;
    }

    if (password !== passwordConfirm) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, passwordConfirm }),
      });
      const body = (await res.json()) as {
        success?: boolean;
        valid?: boolean;
        error?: string;
      };

      if (body.valid === false) {
        setError("Este link não é válido ou já não está disponível.");
        return;
      }

      if (!res.ok || body.error) {
        setError(body.error ?? "Não foi possível activar a conta.");
        return;
      }

      if (body.success) {
        setSuccess(true);
        return;
      }

      setError("Não foi possível activar a conta.");
    } catch {
      setError("Não foi possível activar a conta.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4" data-testid="convite-success">
        <p className="text-sm">
          Conta activada com sucesso. Pode iniciar sessão com o seu e-mail e a
          palavra-passe que definiu.
        </p>
        <Button type="button" onClick={() => router.push("/login")}>
          Ir para o login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        E-mail da conta: <span className="font-medium">{maskedEmail}</span>
      </p>
      <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENTS_HINT}</p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Palavra-passe</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="passwordConfirm">Confirmar palavra-passe</FieldLabel>
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            disabled={pending}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? "A activar…" : "Activar conta"}
      </Button>
    </form>
  );
}

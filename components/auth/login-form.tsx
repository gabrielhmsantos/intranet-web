"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  redirect?: string;
  showDemo?: boolean;
  sessaoExpirada?: boolean;
};

const initialState: SignInState | null = null;

export function LoginForm({
  redirect,
  showDemo = false,
  sessaoExpirada = false,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {redirect ? (
        <input type="hidden" name="redirect" value={redirect} />
      ) : null}
      {sessaoExpirada ? (
        <p
          className="text-sm text-muted-foreground"
          role="status"
          data-testid="sessao-expirada"
        >
          A sua sessão expirou. Inicie sessão novamente.
        </p>
      ) : null}
      {state?.error ? (
        <p
          className="text-sm text-destructive"
          role="alert"
          data-testid="login-error"
        >
          {state.error}
        </p>
      ) : null}
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            placeholder="nome@empresa.pt"
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Palavra-passe</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending}>
        {pending ? "A entrar…" : "Entrar"}
      </Button>
      {showDemo ? (
        <p className="text-xs text-muted-foreground">
          Sem Supabase configurado: use o selector de perfil no canto (modo
          desenvolvimento).
        </p>
      ) : null}
    </form>
  );
}

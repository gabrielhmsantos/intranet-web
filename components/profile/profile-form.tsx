"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  loadProfileNames,
  updateDisplayName,
  validateDisplayNameInput,
} from "@/lib/profile/display-name";
import {
  updatePassword,
  validatePasswordChangeInput,
} from "@/lib/profile/password";
import { PASSWORD_REQUIREMENTS_HINT } from "@/lib/password-policy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [cadastroName, setCadastroName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [namePending, startNameTransition] = useTransition();
  const [passwordPending, startPasswordTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      const supabase = createClient();
      const names = await loadProfileNames(supabase);
      if (cancelled) return;
      if (!names) {
        router.push("/login?sessao=expirada");
        return;
      }
      setDisplayName(names.displayName);
      setEmail(names.email);
      setCadastroName(names.cadastroName);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);

    const validated = validateDisplayNameInput(displayName);
    if (!validated.ok) {
      setNameError(validated.message);
      return;
    }

    startNameTransition(async () => {
      const supabase = createClient();
      const result = await updateDisplayName(supabase, validated.value);
      if (!result.ok) {
        if (result.message.includes("Sessão expirada")) {
          router.push("/login?sessao=expirada");
          return;
        }
        setNameError(result.message);
        return;
      }
      toast.success("Nome de exibição actualizado.");
      router.refresh();
    });
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    const validated = validatePasswordChangeInput(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (!validated.ok) {
      setPasswordError(validated.message);
      return;
    }

    startPasswordTransition(async () => {
      const supabase = createClient();
      const result = await updatePassword(
        supabase,
        email,
        currentPassword,
        newPassword,
      );
      if (!result.ok) {
        if (result.message.includes("Sessão expirada")) {
          router.push("/login?sessao=expirada");
          return;
        }
        setPasswordError(result.message);
        return;
      }
      toast.success("Palavra-passe actualizada.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    });
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">A carregar perfil…</p>;
  }

  return (
    <div className="flex max-w-lg flex-col gap-6" data-testid="profile-form">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">
          Os seus dados de contacto na intranet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados na intranet</CardTitle>
          <CardDescription>
            O nome de exibição aparece no menu e na lista de colaboradores. Não
            altera o cadastro RH.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveName} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="intranet-display-name">Nome na intranet</Label>
              <Input
                id="intranet-display-name"
                data-testid="profile-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={120}
                disabled={namePending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-email">E-mail</Label>
              <Input
                id="profile-email"
                data-testid="profile-email"
                value={email}
                disabled
                readOnly
              />
            </div>
            {cadastroName ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="profile-cadastro-name">Nome no cadastro</Label>
                <Input
                  id="profile-cadastro-name"
                  data-testid="profile-cadastro-name"
                  value={cadastroName}
                  disabled
                  readOnly
                />
                <p className="text-xs text-muted-foreground">
                  Gerido pelo RH; visível na ficha e no organograma.
                </p>
              </div>
            ) : null}
            {nameError ? (
              <p className="text-sm text-destructive" role="alert">
                {nameError}
              </p>
            ) : null}
            <Button type="submit" disabled={namePending}>
              {namePending ? "A guardar…" : "Guardar nome"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar palavra-passe</CardTitle>
          <CardDescription>{PASSWORD_REQUIREMENTS_HINT}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Palavra-passe actual</Label>
              <Input
                id="current-password"
                data-testid="profile-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">Nova palavra-passe</Label>
              <Input
                id="new-password"
                data-testid="profile-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={passwordPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirmar nova palavra-passe</Label>
              <Input
                id="confirm-password"
                data-testid="profile-confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={passwordPending}
              />
            </div>
            {passwordError ? (
              <p className="text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? "A guardar…" : "Alterar palavra-passe"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Para alterar o tema (claro/escuro), use o menu do utilizador no canto
        superior.
      </p>
    </div>
  );
}

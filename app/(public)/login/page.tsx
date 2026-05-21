import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { getAuthenticatedLoginRedirect } from "@/lib/redirects";
import { isPlatformAdmin } from "@/lib/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/login-form";
import { LoginHelp } from "@/components/auth/login-help";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { setDevSession } from "@/app/actions/dev-session";

export const metadata = {
  title: "Entrar",
};

async function enterAsEmployee() {
  "use server";
  await setDevSession("employee");
  redirect("/dashboard");
}

type PageProps = {
  searchParams: Promise<{ denied?: string; sessao?: string; redirect?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await getServerSession();
  const blockedRedirect =
    params.denied === "platform" &&
    session.isAuthenticated &&
    !isPlatformAdmin(session.role);

  if (session.isAuthenticated && !blockedRedirect) {
    redirect(getAuthenticatedLoginRedirect(session));
  }

  const supabaseReady = isSupabaseConfigured();
  const sessaoExpirada = params.sessao === "expirada";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar na intranet</CardTitle>
        <CardDescription>
          Acesso por convite da sua empresa. Sem registo público.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {supabaseReady ? (
          <LoginForm
            redirect={params.redirect}
            sessaoExpirada={sessaoExpirada}
          />
        ) : (
          <form action={enterAsEmployee} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="nome@empresa.pt"
                  disabled
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Palavra-passe</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  disabled
                />
              </Field>
            </FieldGroup>
            <Button type="submit">Continuar (demo)</Button>
            <p className="text-xs text-muted-foreground">
              Configure Supabase em `.env.local` para autenticação real (EP-2).
            </p>
          </form>
        )}
        <LoginHelp />
      </CardContent>
    </Card>
  );
}

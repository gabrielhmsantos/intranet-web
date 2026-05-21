import { redirect } from "next/navigation";
import { getDevSession } from "@/lib/dev-session";
import { getAuthenticatedLoginRedirect } from "@/lib/redirects";
import { isPlatformAdmin } from "@/lib/roles";
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
  searchParams: Promise<{ denied?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { denied } = await searchParams;
  const session = await getDevSession();
  const blockedRedirect =
    denied === "platform" &&
    session.isAuthenticated &&
    !isPlatformAdmin(session.role);

  if (session.isAuthenticated && !blockedRedirect) {
    redirect(getAuthenticatedLoginRedirect(session));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar na intranet</CardTitle>
        <CardDescription>
          Acesso por convite da sua empresa. Autenticação real no EP-2.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        </form>
      </CardContent>
    </Card>
  );
}

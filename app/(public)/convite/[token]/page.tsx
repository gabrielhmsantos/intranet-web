import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Activar convite",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConvitePage({ params }: PageProps) {
  const { token } = await params;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activar convite</CardTitle>
        <CardDescription>
          Defina a sua palavra-passe para concluir o registo (placeholder EP-1).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <p className="text-xs text-muted-foreground">Token: {token}</p>
        <form className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="password">Palavra-passe</FieldLabel>
              <Input id="password" name="password" type="password" disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="passwordConfirm">Confirmar</FieldLabel>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                disabled
              />
            </Field>
          </FieldGroup>
          <Button type="button" disabled>
            Activar conta
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          Validação do token e persistência no EP-2.
        </p>
      </CardContent>
    </Card>
  );
}

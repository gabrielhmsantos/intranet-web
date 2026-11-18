import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConviteForm } from "@/components/auth/convite-form";
import { ConviteInvalid } from "@/components/auth/convite-invalid";
import { validateInviteForDisplay } from "@/lib/invite-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  title: "Activar convite",
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConvitePage({ params }: PageProps) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activar convite</CardTitle>
          <CardDescription>
            Configure Supabase para activar convites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConviteInvalid />
        </CardContent>
      </Card>
    );
  }

  let validation: Awaited<ReturnType<typeof validateInviteForDisplay>> = {
    valid: false,
  };

  try {
    validation = await validateInviteForDisplay(token);
  } catch {
    validation = { valid: false };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activar convite</CardTitle>
        <CardDescription>
          Defina a sua palavra-passe para concluir o registo na intranet.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {validation.valid ? (
          <ConviteForm token={token} maskedEmail={validation.maskedEmail} />
        ) : (
          <ConviteInvalid />
        )}
      </CardContent>
    </Card>
  );
}

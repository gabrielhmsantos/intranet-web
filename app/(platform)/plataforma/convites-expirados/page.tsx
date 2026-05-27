import { ExpiredBootstrapInvites } from "@/components/platform/expired-bootstrap-invites";
import { fetchExpiredBootstrapInvites } from "@/lib/platform/expired-invites";

export const metadata = {
  title: "Convites expirados · Plataforma",
};

export default async function ExpiredInvitesPage() {
  let initialInvites: Awaited<
    ReturnType<typeof fetchExpiredBootstrapInvites>
  > = [];
  let initialError: string | null = null;

  try {
    initialInvites = await fetchExpiredBootstrapInvites();
  } catch {
    initialError = "Não foi possível carregar os convites.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Convites expirados
        </h1>
        <p className="text-muted-foreground">
          Convites de primeiro acesso (bootstrap) expirados — renovar ou
          excluir para desbloquear o e-mail.
        </p>
      </div>
      <ExpiredBootstrapInvites
        initialInvites={initialInvites}
        initialError={initialError}
      />
    </div>
  );
}

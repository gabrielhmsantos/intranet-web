import { redirect } from "next/navigation";
import { TenantSettingsForm } from "@/components/tenant/tenant-settings-form";
import { getTenantTimezone } from "@/lib/events/timezone";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Configuração" };

export default async function ConfiguracaoPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para gerir definições do tenant.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  if (session.role !== "tenant_admin") {
    redirect("/sem-permissao");
  }

  const supabase = await createClient();
  const timezone = await getTenantTimezone(supabase, session.tenantId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Configuração</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Organização</h2>
        <TenantSettingsForm initialTimezone={timezone} />
      </section>
    </div>
  );
}

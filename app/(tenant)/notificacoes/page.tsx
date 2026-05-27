import { redirect } from "next/navigation";
import { NotificationsPageClient } from "@/components/notifications/notifications-page-client";
import { getTenantTimezone } from "@/lib/events/timezone";
import { getServerSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Notificações" };

export default async function NotificacoesPage() {
  if (!isSupabaseConfigured()) {
    return (
      <p className="text-muted-foreground">
        Configure Supabase para ver notificações in-app.
      </p>
    );
  }

  const session = await getServerSession();
  if (!session.isAuthenticated || !session.tenantId) {
    redirect("/login");
  }

  const supabase = await createClient();
  const timeZone = await getTenantTimezone(supabase, session.tenantId);

  return <NotificationsPageClient timeZone={timeZone} />;
}

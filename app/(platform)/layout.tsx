import { enforcePlatformAccess } from "@/lib/route-guard";
import { getServerSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { PlatformShell } from "@/components/shell/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePlatformAccess();
  const session = await getServerSession();

  return (
    <PlatformShell
      role={session.role}
      useSupabaseAuth={isSupabaseConfigured()}
    >
      {children}
    </PlatformShell>
  );
}

import { enforcePlatformAccess } from "@/lib/route-guard";
import { getDevSession, normalizeDevRole } from "@/lib/dev-session";
import { PlatformShell } from "@/components/shell/platform-shell";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforcePlatformAccess();
  const session = await getDevSession();
  const role = normalizeDevRole(session.role);

  return <PlatformShell role={role}>{children}</PlatformShell>;
}

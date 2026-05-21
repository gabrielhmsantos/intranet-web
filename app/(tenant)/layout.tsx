import { enforceTenantAccess } from "@/lib/route-guard";
import {
  getDevSession,
  getEffectiveTenantRole,
} from "@/lib/dev-session";
import { TenantShell } from "@/components/shell/tenant-shell";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await enforceTenantAccess();
  const session = await getDevSession();
  const role = await getEffectiveTenantRole();

  return (
    <TenantShell tenantName={session.tenantDisplayName} role={role}>
      {children}
    </TenantShell>
  );
}

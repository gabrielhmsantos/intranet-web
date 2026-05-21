import { getServerSession } from "@/lib/session";

export class TenantAccessError extends Error {
  constructor(message = "Acesso negado a este tenant.") {
    super(message);
    this.name = "TenantAccessError";
  }
}

export async function assertTenantAccess(requestTenantId: string): Promise<void> {
  const session = await getServerSession();

  if (!session.isAuthenticated || !session.tenantId) {
    throw new TenantAccessError();
  }

  if (session.tenantId !== requestTenantId) {
    throw new TenantAccessError();
  }
}

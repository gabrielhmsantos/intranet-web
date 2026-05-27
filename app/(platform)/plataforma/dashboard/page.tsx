import { TenantSummaryTable } from "@/components/platform/tenant-summary-table";
import { fetchTenantSummaries } from "@/lib/platform/tenant-summary";

export const metadata = {
  title: "Dashboard · Plataforma",
};

export default async function PlatformDashboardPage() {
  let tenants: Awaited<ReturnType<typeof fetchTenantSummaries>>["tenants"] = [];
  let loadError: string | null = null;

  try {
    const data = await fetchTenantSummaries();
    tenants = data.tenants;
  } catch {
    loadError = "Não foi possível carregar o resumo das empresas.";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Dashboard da plataforma
        </h1>
        <p className="text-muted-foreground">
          Métricas agregadas por empresa — sem dados pessoais.
        </p>
      </div>
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : (
        <TenantSummaryTable tenants={tenants} />
      )}
    </div>
  );
}

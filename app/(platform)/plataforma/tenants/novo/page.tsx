import { ProvisionTenantForm } from "@/components/platform/provision-tenant-form";

export const metadata = {
  title: "Nova empresa · Plataforma",
};

export default function ProvisionTenantPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova empresa</h1>
        <p className="text-muted-foreground">
          Registe um novo tenant e obtenha o link de primeiro acesso para o
          administrador inicial.
        </p>
      </div>
      <ProvisionTenantForm />
    </div>
  );
}

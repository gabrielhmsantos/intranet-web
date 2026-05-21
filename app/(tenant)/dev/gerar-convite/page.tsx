import { notFound } from "next/navigation";
import { InviteLinkDialog } from "@/components/auth/invite-link-dialog";
import { PlaceholderPage } from "@/components/shell/placeholder-page";

export const metadata = {
  title: "Gerar convite (dev)",
};

export default function GerarConviteDevPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PlaceholderPage
        title="Gerar convite (desenvolvimento)"
        description="Atalho até EP-3 integrar a ficha do colaborador. Usa colaborador Alpha sem conta (seed)."
      />
      <InviteLinkDialog
        employeeId="c0000000-0000-4000-8000-000000000099"
        employeeLabel="Colaborador pendente (Alpha)"
      />
    </div>
  );
}

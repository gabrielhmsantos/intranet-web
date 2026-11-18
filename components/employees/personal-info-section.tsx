import type { ProductRole } from "@/lib/roles";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

type PersonalInfoSectionProps = {
  role: ProductRole;
};

export function PersonalInfoSection({ role }: PersonalInfoSectionProps) {
  if (role !== "tenant_admin" && role !== "hr") {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">Informação pessoal</h2>
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Reservado a RH e administração</EmptyTitle>
          <EmptyDescription>
            Dados pessoais adicionais estarão disponíveis em breve.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </section>
  );
}

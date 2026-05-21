import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { FolderOpenIcon } from "@hugeicons/core-free-icons";
import type { ProductRole } from "@/lib/roles";
import { canCreate } from "@/lib/roles";

type EmptyStateProps = {
  title?: string;
  description?: string;
  role: ProductRole;
};

export function EmptyState({
  title = "Sem resultados",
  description = "Ainda não existem registos para mostrar.",
  role,
}: EmptyStateProps) {
  return (
    <Empty data-testid="ui-state-empty">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={FolderOpenIcon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {canCreate(role) ? (
        <Button type="button" variant="outline">
          Criar
        </Button>
      ) : null}
    </Empty>
  );
}

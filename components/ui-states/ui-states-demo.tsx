"use client";

import type { ProductRole } from "@/lib/roles";
import { PageSkeleton } from "@/components/ui-states/page-skeleton";
import { EmptyState } from "@/components/ui-states/empty-state";
import { ErrorState } from "@/components/ui-states/error-state";
import { ForbiddenState } from "@/components/ui-states/forbidden-state";

type UiStatesDemoProps = {
  role: ProductRole;
};

export function UiStatesDemo({ role }: UiStatesDemoProps) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Estados de interface</h1>
      <PageSkeleton />
      <EmptyState role={role} />
      <ErrorState onRetry={() => window.location.reload()} />
      <ForbiddenState />
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = "Não foi possível carregar os dados. Tente novamente.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6"
      data-testid="ui-state-error"
      role="alert"
    >
      <p className="font-medium text-destructive">Erro</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}

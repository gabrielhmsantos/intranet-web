"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ForbiddenStateProps = {
  redirectTo?: string;
  delayMs?: number;
};

export function ForbiddenState({
  redirectTo = "/dashboard",
  delayMs = 3000,
}: ForbiddenStateProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace(redirectTo);
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [router, redirectTo, delayMs]);

  return (
    <div
      className="flex flex-col gap-2 rounded-lg border p-6"
      data-testid="ui-state-forbidden"
      role="alert"
    >
      <p className="font-medium">Sem permissão</p>
      <p className="text-sm text-muted-foreground">
        Não tem acesso a esta página. A redireccionar em breve…
      </p>
    </div>
  );
}

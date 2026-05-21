"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function SemPermissaoPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.replace("/dashboard");
      }
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="mx-auto flex max-w-lg flex-col gap-4 py-12"
      data-testid="sem-permissao"
    >
      <h1 className="text-2xl font-semibold">Sem permissão</h1>
      <p className="text-muted-foreground">
        Não tem permissão para aceder a esta página.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.replace("/dashboard");
          }
        }}
      >
        Voltar
      </Button>
      <p className="text-xs text-muted-foreground">
        Será redireccionado automaticamente em alguns segundos.
      </p>
    </div>
  );
}

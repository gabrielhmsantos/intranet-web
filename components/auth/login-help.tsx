"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t pt-4">
      <Button
        type="button"
        variant="ghost"
        className="h-auto p-0 text-sm font-normal text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        Problemas com acesso?
      </Button>
      {open ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Contacte o RH ou a administração da sua empresa para obter um convite
          de acesso. A recuperação automática de palavra-passe não está
          disponível nesta versão.
        </p>
      ) : null}
    </div>
  );
}

"use client";

/**
 * Padrão UX-07: confirmações destrutivas via AlertDialog; feedback breve via sonner.
 * Não usar window.alert / confirm / prompt em fluxos de produto.
 */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function FeedbackDemo() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="destructive">
            Acção destrutiva (demo)
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acção não pode ser desfeita. Confirme para continuar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toast.success("Operação concluída com sucesso.")}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        type="button"
        variant="outline"
        onClick={() => toast.success("Guardado com sucesso.")}
      >
        Mostrar toast
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { EventForm } from "@/components/events/event-form";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { audienceLabel } from "@/lib/events/labels";
import { formatEventDateTime } from "@/lib/events/timezone";
import type { EventDetail } from "@/lib/events/types";

type EventDetailViewProps = {
  event: EventDetail;
  canEdit: boolean;
  canCancel: boolean;
  limitedEdit?: boolean;
  managerEditMode?: boolean;
  managedDepartments?: { id: string; name: string }[];
  scopedEmployees?: { id: string; fullName: string }[];
  timeZone: string;
  defaultStartsAt: string;
  defaultEndsAt: string;
};

export function EventDetailView({
  event,
  canEdit,
  canCancel,
  limitedEdit = false,
  managerEditMode = false,
  managedDepartments,
  scopedEmployees,
  timeZone,
  defaultStartsAt,
  defaultEndsAt,
}: EventDetailViewProps) {
  const formatDateTime = (iso: string) => formatEventDateTime(iso, timeZone);
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const onCancel = async () => {
    setCanceling(true);
    try {
      const res = await fetch(`/api/events/${event.id}/cancel`, { method: "POST" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Não foi possível cancelar.");
        return;
      }
      toast.success("Evento cancelado. Os participantes serão notificados.");
      router.refresh();
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            {event.status === "canceled" ? (
              <Badge variant="secondary">Cancelado</Badge>
            ) : (
              <Badge>Activo</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{audienceLabel(event.audience)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/eventos">Voltar à lista</Link>
          </Button>
          {canEdit ? (
            <Button type="button" onClick={() => setEditing(true)}>
              Editar
            </Button>
          ) : null}
          {canCancel ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  Cancelar evento
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancelar evento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O evento ficará marcado como cancelado e os participantes do público-alvo
                    receberão uma notificação automática. Esta acção não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void onCancel()} disabled={canceling}>
                    Confirmar cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Início</dt>
          <dd className="font-medium">{formatDateTime(event.startsAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Fim</dt>
          <dd className="font-medium">{formatDateTime(event.endsAt)}</dd>
        </div>
        {event.location ? (
          <div>
            <dt className="text-muted-foreground">Local</dt>
            <dd className="font-medium">{event.location}</dd>
          </div>
        ) : null}
        {event.description ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">Descrição</dt>
            <dd className="font-medium">{event.description}</dd>
          </div>
        ) : null}
      </dl>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar evento</DialogTitle>
          </DialogHeader>
          <EventForm
            mode="edit"
            eventId={event.id}
            initial={event}
            defaultStartsAt={defaultStartsAt}
            defaultEndsAt={defaultEndsAt}
            limitedEdit={limitedEdit}
            managerMode={managerEditMode}
            managedDepartments={managedDepartments}
            scopedEmployees={scopedEmployees}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

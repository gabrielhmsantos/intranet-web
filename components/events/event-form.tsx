"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  EventAudienceFields,
  type AudienceFormValue,
} from "@/components/events/event-audience-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EventDetail } from "@/lib/events/types";

type EventFormProps = {
  mode: "create" | "edit";
  eventId?: string;
  initial?: EventDetail;
  defaultStartsAt?: string;
  defaultEndsAt?: string;
  managerMode?: boolean;
  limitedEdit?: boolean;
  managedDepartments?: { id: string; name: string }[];
  scopedEmployees?: { id: string; fullName: string }[];
};

function audienceFromDetail(
  event?: EventDetail,
  managerMode?: boolean,
): AudienceFormValue {
  if (!event) {
    return {
      type: managerMode ? "department" : "company",
      departmentId: "",
      employeeIds: [],
    };
  }
  return {
    type: event.audience.type,
    departmentId: event.audience.departmentId ?? "",
    employeeIds: event.audience.employeeIds ?? [],
  };
}

export function EventForm({
  mode,
  eventId,
  initial,
  defaultStartsAt = "",
  defaultEndsAt = "",
  managerMode = false,
  limitedEdit = false,
  managedDepartments,
  scopedEmployees,
}: EventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [startsAt, setStartsAt] = useState(defaultStartsAt);
  const [endsAt, setEndsAt] = useState(defaultEndsAt);
  const [audience, setAudience] = useState<AudienceFormValue>(() =>
    audienceFromDetail(initial, managerMode),
  );
  const [submitting, setSubmitting] = useState(false);

  const scheduleReadOnly = limitedEdit;
  const audienceReadOnly = limitedEdit || (mode === "edit" && limitedEdit);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      title,
      description: description || undefined,
    };

    if (!limitedEdit) {
      Object.assign(payload, {
        location: location || undefined,
        startsAt,
        endsAt,
        audience: {
          type: audience.type,
          departmentId: audience.type === "department" ? audience.departmentId : undefined,
          employeeIds: audience.type === "employees" ? audience.employeeIds : undefined,
        },
      });
    }

    try {
      const url = mode === "create" ? "/api/events" : `/api/events/${eventId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json()) as { error?: string; id?: string };

      if (!res.ok) {
        toast.error(json.error ?? "Não foi possível guardar o evento.");
        return;
      }

      toast.success(mode === "create" ? "Evento criado." : "Evento actualizado.");
      const id = mode === "create" ? (json as { id: string }).id : eventId;
      router.push(id ? `/eventos/${id}` : "/eventos");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-xl flex-col gap-4">
      {!limitedEdit ? (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Os participantes são notificados automaticamente em caso de{" "}
          <strong>cancelamento</strong>, <strong>alteração de data/hora</strong> ou{" "}
          <strong>alteração de local</strong>. Lembretes (dia do evento, 1 h e 15 min antes) são
          automáticos — não é possível escolher o tipo de notificação aqui.
        </p>
      ) : (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          Pode alterar apenas o <strong>título</strong> e a <strong>descrição</strong>. Para
          reagendar, mudar o local ou o público-alvo, contacte RH ou um gestor activo.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {!scheduleReadOnly ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="startsAt">Início</Label>
            <Input
              id="startsAt"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="endsAt">Fim</Label>
            <Input
              id="endsAt"
              type="datetime-local"
              required
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {!scheduleReadOnly ? (
        <div className="flex flex-col gap-1">
          <Label htmlFor="location">Local</Label>
          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
      ) : null}

      {!audienceReadOnly ? (
        <EventAudienceFields
          value={audience}
          onChange={setAudience}
          managerMode={managerMode}
          managedDepartments={managedDepartments}
          scopedEmployees={scopedEmployees}
        />
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {mode === "create" ? "Criar evento" : "Guardar alterações"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={eventId ? `/eventos/${eventId}` : "/eventos"}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}

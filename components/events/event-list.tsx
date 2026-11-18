"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatEventDateTime } from "@/lib/events/timezone";
import type { EventListResult, EventStatus } from "@/lib/events/types";

type EventListProps = {
  initial: EventListResult;
  canCreate: boolean;
  timeZone: string;
};

function statusBadge(status: EventStatus) {
  if (status === "canceled") {
    return <Badge variant="secondary">Cancelado</Badge>;
  }
  return <Badge variant="default">Activo</Badge>;
}

export function EventList({ initial, canCreate, timeZone }: EventListProps) {
  const formatDateTime = (iso: string) => formatEventDateTime(iso, timeZone);
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (page: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(data.pageSize),
        });
        if (q.trim()) params.set("q", q.trim());
        if (status !== "all") params.set("status", status);
        if (from) params.set("from", new Date(from).toISOString());
        if (to) params.set("to", new Date(to).toISOString());

        const res = await fetch(`/api/events?${params}`);
        if (!res.ok) return;
        const json = (await res.json()) as EventListResult;
        setData(json);
      } finally {
        setLoading(false);
      }
    },
    [data.pageSize, from, q, status, to],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        {canCreate ? (
          <Button asChild>
            <Link href="/eventos/novo">Novo evento</Link>
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <Label htmlFor="event-q">Pesquisar título</Label>
          <Input
            id="event-q"
            placeholder="Título…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void load(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Estado</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="canceled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="from">De</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="to">Até</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={() => void load(1)} disabled={loading}>
          Filtrar
        </Button>
      </div>

      {data.items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>{q || status !== "all" || from || to ? "Nenhum evento encontrado." : "Ainda não há eventos."}</p>
          {canCreate && !q && status === "all" && !from && !to ? (
            <Button asChild className="mt-4">
              <Link href="/eventos/novo">Criar evento</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => router.push(`/eventos/${item.id}`)}
              >
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{formatDateTime(item.startsAt)}</TableCell>
                <TableCell>{statusBadge(item.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {data.totalPages} ({data.total} eventos)
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.page <= 1 || loading}
              onClick={() => void load(data.page - 1)}
            >
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages || loading}
              onClick={() => void load(data.page + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

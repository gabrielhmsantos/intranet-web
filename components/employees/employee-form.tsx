"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeDetail } from "@/lib/employees/types";

type Option = { id: string; label: string };

type EmployeeFormDialogProps =
  | { mode: "create"; employee?: undefined }
  | { mode: "edit"; employee: EmployeeDetail };

export function EmployeeFormDialog(props: EmployeeFormDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [managers, setManagers] = useState<Option[]>([]);

  const [displayName, setDisplayName] = useState(
    props.mode === "edit" ? props.employee.displayName : "",
  );
  const [workEmail, setWorkEmail] = useState(
    props.mode === "edit" ? (props.employee.workEmail ?? "") : "",
  );
  const [extensionNumber, setExtensionNumber] = useState(
    props.mode === "edit" ? (props.employee.extensionNumber ?? "") : "",
  );
  const [departmentId, setDepartmentId] = useState(
    props.mode === "edit" ? (props.employee.departmentId ?? "none") : "none",
  );
  const [managerId, setManagerId] = useState(
    props.mode === "edit" ? (props.employee.managerId ?? "none") : "none",
  );

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees?pageSize=50"),
      ]);
      if (deptRes.ok) {
        const body = (await deptRes.json()) as {
          items: { id: string; name: string }[];
        };
        setDepartments(
          body.items.map((d) => ({ id: d.id, label: d.name })),
        );
      }
      if (empRes.ok) {
        const body = (await empRes.json()) as {
          items: { id: string; displayName: string }[];
        };
        const selfId = props.mode === "edit" ? props.employee.id : null;
        setManagers(
          body.items
            .filter((e) => e.id !== selfId)
            .map((e) => ({ id: e.id, label: e.displayName })),
        );
      }
    })();
  }, [open, props]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const payload = {
      displayName: displayName.trim(),
      workEmail: workEmail.trim() || undefined,
      extensionNumber: extensionNumber.trim() || undefined,
      departmentId: departmentId === "none" ? null : departmentId,
      managerId: managerId === "none" ? null : managerId,
    };

    try {
      const res = await fetch(
        props.mode === "create"
          ? "/api/employees"
          : `/api/employees/${props.employee.id}`,
        {
          method: props.mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        setError(body.error ?? "Não foi possível guardar.");
        return;
      }

      toast.success(
        props.mode === "create"
          ? "Colaborador criado."
          : "Colaborador actualizado.",
      );
      setOpen(false);
      if (props.mode === "create" && body.id) {
        router.push(`/colaboradores/${body.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Não foi possível guardar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={props.mode === "create" ? "default" : "secondary"}
        >
          {props.mode === "create" ? "Novo colaborador" : "Editar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={(e) => void handleSubmit(e)}>
          <DialogHeader>
            <DialogTitle>
              {props.mode === "create"
                ? "Novo colaborador"
                : "Editar colaborador"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="workEmail">E-mail de trabalho</Label>
              <Input
                id="workEmail"
                type="email"
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Departamento</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem departamento</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Gestor imediato</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem gestor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem gestor</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="extensionNumber">Ramal (opcional)</Label>
              <Input
                id="extensionNumber"
                value={extensionNumber}
                onChange={(e) => setExtensionNumber(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

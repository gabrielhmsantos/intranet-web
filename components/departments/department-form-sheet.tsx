"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DepartmentListItem } from "@/lib/departments/repository";

type EmployeeOption = { id: string; displayName: string };

type DepartmentFormSheetProps = {
  trigger?: React.ReactNode;
  onMutated?: () => void;
};

export function DepartmentFormSheet({
  trigger,
  onMutated,
}: DepartmentFormSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState<string>("none");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [deptRes, empRes] = await Promise.all([
      fetch("/api/departments"),
      fetch("/api/employees?pageSize=50"),
    ]);
    if (deptRes.ok) {
      const body = (await deptRes.json()) as { items: DepartmentListItem[] };
      setDepartments(body.items);
    }
    if (empRes.ok) {
      const body = (await empRes.json()) as {
        items: { id: string; displayName: string }[];
      };
      setEmployees(
        body.items.map((e) => ({ id: e.id, displayName: e.displayName })),
      );
    }
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) void loadData();
  }

  function resetForm() {
    setName("");
    setManagerId("none");
    setEditingId(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        managerEmployeeId: managerId === "none" ? null : managerId,
      };
      const res = await fetch(
        editingId ? `/api/departments/${editingId}` : "/api/departments",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(body.error ?? "Não foi possível guardar.");
        return;
      }
      toast.success(
        editingId ? "Departamento actualizado." : "Departamento criado.",
      );
      resetForm();
      await loadData();
      onMutated?.();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
    if (res.status === 204) {
      toast.success("Departamento eliminado.");
      await loadData();
      onMutated?.();
      router.refresh();
      return;
    }
    const body = (await res.json()) as { error?: string };
    toast.error(body.error ?? "Não foi possível eliminar.");
  }

  function startEdit(dept: DepartmentListItem) {
    setEditingId(dept.id);
    setName(dept.name);
    setManagerId(dept.managerEmployeeId ?? "none");
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="secondary">
            Gerir departamentos
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gerir departamentos</SheetTitle>
        </SheetHeader>
        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(e) => void handleSave(e)}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="deptName">Nome</Label>
            <Input
              id="deptName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Gestor do departamento</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Sem gestor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem gestor</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {editingId ? "Actualizar" : "Criar"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>

        <ul className="mt-8 flex flex-col gap-3">
          {departments.map((dept) => (
            <li
              key={dept.id}
              className="flex flex-col gap-2 rounded-lg border p-3 text-sm"
            >
              <div className="font-medium">{dept.name}</div>
              <div className="text-muted-foreground">
                Gestor: {dept.managerName ?? "—"} · {dept.activeEmployeeCount}{" "}
                activo{dept.activeEmployeeCount === 1 ? "" : "s"}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(dept)}
                >
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" size="sm" variant="destructive">
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar departamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Só é possível eliminar departamentos sem colaboradores
                        activos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => void handleDelete(dept.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

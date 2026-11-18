"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAX_SELECTED_EMPLOYEES } from "@/lib/events/schemas";
import type { EventAudienceType } from "@/lib/events/types";

export type AudienceFormValue = {
  type: EventAudienceType;
  departmentId: string;
  employeeIds: string[];
};

type DepartmentOption = { id: string; name: string };
type EmployeeOption = { id: string; displayName: string };

type EventAudienceFieldsProps = {
  value: AudienceFormValue;
  onChange: (value: AudienceFormValue) => void;
  managerMode?: boolean;
  managedDepartments?: DepartmentOption[];
  scopedEmployees?: { id: string; fullName: string }[];
  readOnly?: boolean;
};

export function EventAudienceFields({
  value,
  onChange,
  managerMode = false,
  managedDepartments: managedDepartmentsProp,
  scopedEmployees: scopedEmployeesProp,
  readOnly = false,
}: EventAudienceFieldsProps) {
  const [fetchedDepartments, setFetchedDepartments] = useState<DepartmentOption[]>([]);
  const [fetchedEmployees, setFetchedEmployees] = useState<EmployeeOption[]>([]);

  const useManagerLists =
    managerMode && managedDepartmentsProp !== undefined && scopedEmployeesProp !== undefined;

  const departments = useManagerLists
    ? managedDepartmentsProp
    : fetchedDepartments;

  const employees = useManagerLists
    ? scopedEmployeesProp.map((e) => ({ id: e.id, displayName: e.fullName }))
    : fetchedEmployees;

  useEffect(() => {
    if (managerMode) {
      return;
    }

    void (async () => {
      const [deptRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/employees?pageSize=50"),
      ]);
      if (deptRes.ok) {
        const json = (await deptRes.json()) as { items: DepartmentOption[] };
        setFetchedDepartments(json.items ?? []);
      }
      if (empRes.ok) {
        const json = (await empRes.json()) as {
          items: { id: string; displayName: string }[];
        };
        setFetchedEmployees(
          (json.items ?? []).map((e) => ({ id: e.id, displayName: e.displayName })),
        );
      }
    })();
  }, [managerMode]);

  const toggleEmployee = (id: string, checked: boolean) => {
    if (readOnly) return;
    let next = [...value.employeeIds];
    if (checked) {
      if (next.length >= MAX_SELECTED_EMPLOYEES) return;
      next.push(id);
    } else {
      next = next.filter((x) => x !== id);
    }
    onChange({ ...value, employeeIds: next });
  };

  const audienceOptions = managerMode
    ? ([
        ["department", "Departamento"],
        ["employees", "Colaboradores seleccionados"],
      ] as const)
    : ([
        ["company", "Toda a empresa"],
        ["department", "Departamento"],
        ["employees", "Colaboradores seleccionados"],
      ] as const);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium">Público-alvo</legend>

      <div className="flex flex-col gap-2">
        {audienceOptions.map(([type, label]) => (
          <label key={type} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audienceType"
              checked={value.type === type}
              disabled={readOnly}
              onChange={() =>
                onChange({
                  type,
                  departmentId: "",
                  employeeIds: [],
                })
              }
            />
            {label}
          </label>
        ))}
      </div>

      {value.type === "department" ? (
        <div className="flex flex-col gap-1">
          <Label>Departamento</Label>
          <Select
            value={value.departmentId || undefined}
            disabled={readOnly}
            onValueChange={(departmentId) => onChange({ ...value, departmentId })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {value.type === "employees" ? (
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md border p-3">
          <p className="text-xs text-muted-foreground">
            Máximo {MAX_SELECTED_EMPLOYEES} colaboradores ({value.employeeIds.length}{" "}
            seleccionados)
          </p>
          {employees.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum colaborador disponível no seu âmbito.
            </p>
          ) : null}
          {employees.map((emp) => {
            const checked = value.employeeIds.includes(emp.id);
            const atCap = value.employeeIds.length >= MAX_SELECTED_EMPLOYEES && !checked;
            return (
              <div key={emp.id} className="flex items-center gap-2">
                <Checkbox
                  id={`emp-${emp.id}`}
                  checked={checked}
                  disabled={readOnly || atCap}
                  onCheckedChange={(c) => toggleEmployee(emp.id, c === true)}
                />
                <Label htmlFor={`emp-${emp.id}`} className="font-normal">
                  {emp.displayName}
                </Label>
              </div>
            );
          })}
        </div>
      ) : null}
    </fieldset>
  );
}

"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setDevSession } from "@/app/actions/dev-session";
import type { ProductRole } from "@/lib/roles";

const DEV_ROLES: { value: ProductRole; label: string }[] = [
  { value: "tenant_admin", label: "Admin do tenant" },
  { value: "hr", label: "RH" },
  { value: "manager", label: "Gestor" },
  { value: "employee", label: "Colaborador" },
  { value: "platform_admin", label: "Admin da plataforma" },
];

type DevRoleSwitcherProps = {
  currentRole: ProductRole;
};

export function DevRoleSwitcher({ currentRole }: DevRoleSwitcherProps) {
  const router = useRouter();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  async function onRoleChange(value: string) {
    await setDevSession(value as ProductRole);
    router.refresh();
    if (value === "platform_admin") {
      router.push("/plataforma/dashboard");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <Select value={currentRole} onValueChange={onRoleChange}>
      <SelectTrigger
        className="w-[200px]"
        data-testid="dev-role-switcher"
        aria-label="Perfil de desenvolvimento"
      >
        <SelectValue placeholder="Perfil" />
      </SelectTrigger>
      <SelectContent>
        {DEV_ROLES.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

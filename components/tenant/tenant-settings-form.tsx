"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TenantSettingsFormProps = {
  initialTimezone: string;
};

export function TenantSettingsForm({ initialTimezone }: TenantSettingsFormProps) {
  const router = useRouter();
  const [timezone, setTimezone] = useState(initialTimezone);
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(json.error ?? "Não foi possível guardar.");
        return;
      }
      toast.success("Configuração guardada.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="timezone">Fuso horário (IANA)</Label>
        <Input
          id="timezone"
          required
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="Europe/Lisbon"
        />
        <p className="text-xs text-muted-foreground">
          Usado para apresentar e validar datas dos eventos internos.
        </p>
      </div>
      <Button type="submit" disabled={saving}>
        Guardar
      </Button>
    </form>
  );
}

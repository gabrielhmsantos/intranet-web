import { notFound } from "next/navigation";
import { getEffectiveTenantRole } from "@/lib/dev-session";
import { UiStatesDemo } from "@/components/ui-states/ui-states-demo";

export const metadata = { title: "Estados de UI (dev)" };

export default async function UiStatesDevPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  const role = await getEffectiveTenantRole();
  return <UiStatesDemo role={role} />;
}

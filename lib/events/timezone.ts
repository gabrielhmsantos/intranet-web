import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_TIMEZONE = "Europe/Lisbon";

export async function getTenantTimezone(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("tenants")
    .select("timezone")
    .eq("id", tenantId)
    .maybeSingle();

  if (error || !data?.timezone) {
    return DEFAULT_TIMEZONE;
  }

  return data.timezone as string;
}

/** Format UTC instant for display in tenant timezone (pt-PT). */
export function formatEventDateTime(isoUtc: string, timeZone: string): string {
  const date = new Date(isoUtc);
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone,
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

/** `YYYY-MM-DDTHH:mm` for datetime-local input in tenant timezone. */
export function utcToTenantLocalInput(isoUtc: string, timeZone: string): string {
  const date = new Date(isoUtc);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}`;
}

/**
 * Interpret `YYYY-MM-DDTHH:mm` as wall time in tenant timezone → UTC ISO string.
 */
export function tenantLocalInputToUtcIso(localValue: string, timeZone: string): string {
  const match = localValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    throw new Error("Data/hora inválida.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  let guess = Date.UTC(year, month, day, hour, minute);

  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(new Date(guess));

    const read = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? "0");

    const asUtc = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"));
    const wanted = Date.UTC(year, month, day, hour, minute);
    guess += wanted - asUtc;
  }

  return new Date(guess).toISOString();
}

/** Compare UTC instants regardless of ISO string formatting (+00:00 vs Z). */
export function instantEquals(a: string, b: string): boolean {
  return new Date(a).getTime() === new Date(b).getTime();
}

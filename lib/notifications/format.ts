import {
  formatEventDateTime,
  tenantLocalInputToUtcIso,
} from "@/lib/events/timezone";

/** Start of civil day in tenant TZ, minus 90 days, as UTC ISO (inclusive filter). */
export function cutoff90dIso(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value ?? "1970");
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const day = Number(parts.find((p) => p.type === "day")?.value ?? "1");

  const utcMidnight = Date.UTC(year, month - 1, day);
  const cutoffUtc = new Date(utcMidnight - 90 * 86_400_000);
  const cutoffY = cutoffUtc.getUTCFullYear();
  const cutoffM = String(cutoffUtc.getUTCMonth() + 1).padStart(2, "0");
  const cutoffD = String(cutoffUtc.getUTCDate()).padStart(2, "0");

  return tenantLocalInputToUtcIso(`${cutoffY}-${cutoffM}-${cutoffD}T00:00`, timeZone);
}

export function formatNotificationDate(isoUtc: string, timeZone: string): string {
  return formatEventDateTime(isoUtc, timeZone);
}

/** Badge display: exact count up to 99, then "99+". */
export function formatBadgeCount(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}

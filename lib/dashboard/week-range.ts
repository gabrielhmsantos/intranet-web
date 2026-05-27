import { tenantLocalInputToUtcIso } from "@/lib/events/timezone";

const WEEKDAY_TO_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayShort = get("weekday").slice(0, 3);

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    dayIndex: WEEKDAY_TO_INDEX[weekdayShort] ?? 0,
  };
}

function addDaysYmd(year: number, month: number, day: number, delta: number) {
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Monday 00:00 through Sunday 23:59 (tenant wall clock) as UTC ISO bounds. */
export function getCivilWeekRangeUtc(
  timeZone: string,
  refDate: Date = new Date(),
): { weekStartUtc: string; weekEndUtc: string } {
  const { year, month, day, dayIndex } = getDatePartsInTimeZone(refDate, timeZone);
  const monday = addDaysYmd(year, month, day, -dayIndex);
  const sunday = addDaysYmd(monday.year, monday.month, monday.day, 6);

  const weekStartUtc = tenantLocalInputToUtcIso(
    `${monday.year}-${pad2(monday.month)}-${pad2(monday.day)}T00:00`,
    timeZone,
  );
  const weekEndUtc = tenantLocalInputToUtcIso(
    `${sunday.year}-${pad2(sunday.month)}-${pad2(sunday.day)}T23:59`,
    timeZone,
  );

  return { weekStartUtc, weekEndUtc };
}

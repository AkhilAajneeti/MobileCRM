/**
 * Date utilities for the pipeline module.
 *
 * EspoCRM serialises date-times as "YYYY-MM-DD HH:mm:ss" in UTC and plain
 * dates as "YYYY-MM-DD". Every parse goes through `parseEspoDate` so the rest
 * of the module never has to think about that format again.
 */
import {
  differenceInCalendarDays,
  isValid,
  addDays as addDaysFn,
} from "date-fns";

/**
 * Parse an EspoCRM date / date-time string into a Date (or null).
 *
 * EspoCRM transports date-times as "YYYY-MM-DD HH:mm:ss" in UTC (no tz
 * suffix) and plain dates as "YYYY-MM-DD". We parse the datetime form as
 * UTC by appending "Z", and the date-only form as noon UTC so the calendar
 * day survives any timezone shift downstream.
 */
export const parseEspoDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const date =
      trimmed.length <= 10
        ? new Date(`${trimmed}T12:00:00Z`) // plain date -> noon UTC (date survives tz shift)
        : new Date(`${trimmed.replace(" ", "T")}Z`); // datetime -> UTC

    return isValid(date) ? date : null;
  }

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

/**
 * Convert a value into what a `<input type="datetime-local">` expects
 * (`YYYY-MM-DDTHH:mm`, in the user's local wall-clock). Accepts:
 *  - Espo API strings ("YYYY-MM-DD HH:mm:ss", UTC) -> converted to local
 *  - Strings already in datetime-local form ("YYYY-MM-DDTHH:mm") -> passed through
 *  - Date objects -> formatted in local components
 * Returns "" for null/invalid.
 */
export const fromEspoToLocalInput = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    const trimmed = value.trim();
    // Already in datetime-local form ("YYYY-MM-DDTHH:mm"): pass through.
    if (trimmed.includes("T") && !trimmed.includes(" ")) {
      return trimmed.slice(0, 16);
    }
  }
  const d = parseEspoDate(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/** Calendar days from today -> positive = future, negative = past. */
export const daysFromToday = (value) => {
  const date = parseEspoDate(value);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
};

/** Calendar days since the given date -> positive = in the past. */
export const daysSince = (value) => {
  const date = parseEspoDate(value);
  if (!date) return null;
  return differenceInCalendarDays(new Date(), date);
};

/**
 * Smart relative label for a follow-up date.
 * e.g. "Today", "Tomorrow", "In 2 Days", "3 Days Overdue".
 */
export const getRelativeDateLabel = (value) => {
  const diff = daysFromToday(value);
  if (diff === null) return "No follow-up";
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "1 Day Overdue";
  if (diff > 1) return `In ${diff} Days`;
  return `${Math.abs(diff)} Days Overdue`;
};

/** Relative label for the last activity / modified date. */
export const getLastActivityLabel = (value) => {
  const diff = daysSince(value);
  if (diff === null) return "No activity";
  if (diff <= 0) return "Active today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};

/** Compact, human-readable date -> "12 May 2026". */
export const formatShortDate = (value) => {
  const date = parseEspoDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Serialise a Date (or anything Date-ish) into EspoCRM's UTC datetime format
 * `YYYY-MM-DD HH:mm:ss`. String inputs from `<input type="datetime-local">`
 * (e.g. "2026-06-13T11:03") are treated as local wall-clock and converted to
 * UTC. Date-only strings ("2026-06-13") are pinned to noon UTC so the calendar
 * day survives any timezone conversion.
 */
export const toEspoDateTime = (value) => {
  if (!value) return null;
  const pad = (n) => String(n).padStart(2, "0");

  let d;
  if (value instanceof Date) {
    d = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.length <= 10) {
      // "YYYY-MM-DD" - keep at noon UTC so date doesn't drift across tz shifts
      return `${trimmed} 12:00:00`;
    }
    // datetime-local emits "YYYY-MM-DDTHH:mm" (no tz) -> parse as local
    d = new Date(trimmed.replace(" ", "T"));
  } else {
    d = new Date(value);
  }

  if (!isValid(d)) return null;

  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
};

/** date-fns addDays re-exported so callers only import from one place. */
export const addDays = addDaysFn;

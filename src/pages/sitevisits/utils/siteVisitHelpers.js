/**
 * Local tables and rules for the Site Visits screen (spec sections 1, 5.2,
 * 7.4, 7.5). These values are deliberately local — the avatar palette in
 * particular is NOT the leads or reports palette. Three surfaces, three
 * palettes, each tuned to its own background.
 */

/* ------------------------------------------------------------------ *
 * 0.2  Status vocabulary
 * ------------------------------------------------------------------ */

export const STATUS_SCHEDULED = "Scheduled";
export const STATUS_VISITED = "Visited";

/** Backend stores only two statuses; everything else reads as Scheduled. */
export const toDisplayStatus = (raw) =>
  raw === "Site Visit Done" ? STATUS_VISITED : STATUS_SCHEDULED;

/** Visited and No-show are "outcome" statuses; they drive the tab and sort. */
export const isOutcome = (displayStatus) =>
  displayStatus === STATUS_VISITED || displayStatus === "No-show";

/* ------------------------------------------------------------------ *
 * 1.1  Status styles
 *
 * In-progress statuses get a dot, settled statuses get an icon: a dot reads
 * as "still moving", a tick or cross reads as "decided". The asymmetry is
 * the signal, so do not give every status a dot for consistency.
 *
 * Visited is the only solid, saturated pill. On a list that is mostly
 * Scheduled, that emerald pill is what the eye counts.
 *
 * Rescheduled / Confirmed / No-show are forward-looking: styled here so the
 * palette is complete, but never produced by the current mapping.
 * ------------------------------------------------------------------ */

export const STATUS_STYLES = {
  Rescheduled: { pill: "bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  Scheduled: { pill: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  Confirmed: { pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  Visited: { pill: "bg-emerald-600 text-white", icon: "Check" },
  "No-show": { pill: "bg-red-50 text-red-600", icon: "X" },
};

/** Unknown status falls through to an unstyled pill — visibly broken on purpose. */
export const getStatusStyle = (status) => STATUS_STYLES[status] || { pill: "" };

/* ------------------------------------------------------------------ *
 * 1.3  Rep avatar palette
 * ------------------------------------------------------------------ */

export const REP_PALETTE = [
  "bg-[#AC2334]",
  "bg-violet-600",
  "bg-blue-600",
  "bg-teal-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-indigo-600",
  "bg-emerald-600",
];

/**
 * Running modulo, NOT sum-then-modulo: `h = (h + code) % 8` at every step.
 * The distribution differs, and matching it exactly is what keeps a rep the
 * same colour here as on web.
 */
export const repColor = (name) => {
  const value = String(name || "");
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h + value.charCodeAt(i)) % REP_PALETTE.length;
  }
  return REP_PALETTE[h];
};

/** First letter of each of the first two words, upper-cased. */
export const repInitials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

/* ------------------------------------------------------------------ *
 * 1.4  Date and time formatting
 * ------------------------------------------------------------------ */

/**
 * Backend datetimes arrive as `YYYY-MM-DD HH:mm:ss`. The space must become a
 * `T` before parsing or every date is invalid — which shows up as a table of
 * em dashes rather than an error.
 */
export const parseVisitDate = (value) => {
  if (!value) return null;
  const raw = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** `SAT 22 NOV` — no leading zero on the day. */
export const formatVisitDate = (value) => {
  const date = parseVisitDate(value);
  if (!date) return "—";
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return `${weekday} ${date.getDate()} ${month}`;
};

/** Suppressed entirely when there is no date. */
export const formatVisitTime = (value) => {
  const date = parseVisitDate(value);
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/** `Sat, 22 Nov, 02:30 PM` — the schedule-dialog summary. */
export const formatVisitSummary = (value) => {
  const date = parseVisitDate(value);
  if (!date) return "";
  return date.toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ------------------------------------------------------------------ *
 * 5.2  Weekend definition
 * ------------------------------------------------------------------ */

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The Saturday and Sunday of the CURRENT week relative to now. On a Sunday
 * the Saturday is yesterday (offset -1), not six days ahead — otherwise the
 * hero numbers and the weekend tab disagree every Sunday.
 */
export const getWeekendRange = (now = new Date()) => {
  const today = startOfDay(now);
  const day = today.getDay(); // 0 Sun … 6 Sat

  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (day === 0 ? -1 : 6 - day));

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return { saturday, sunday };
};

const sameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isThisWeekend = (value, now = new Date()) => {
  const date = parseVisitDate(value);
  if (!date) return false;
  const { saturday, sunday } = getWeekendRange(now);
  return sameDay(date, saturday) || sameDay(date, sunday);
};

/** `22–23 Nov` — en dash, month taken from the SUNDAY. */
export const formatWeekendRange = (now = new Date()) => {
  const { saturday, sunday } = getWeekendRange(now);
  const month = sunday.toLocaleDateString("en-US", { month: "short" });
  return `${saturday.getDate()}–${sunday.getDate()} ${month}`;
};

/**
 * 3.2 — the day badge is worded for the actual day of the week, so the panel
 * always tells the rep where they are in the weekly rhythm.
 */
export const getDayBadgeCopy = (now = new Date()) => {
  const day = now.getDay();
  if (day === 5) return "It's Friday — confirmation day";
  if (day === 6) return "It's Saturday — visit day";
  if (day === 0) return "It's Sunday — visit day";
  // Count forward to the next Friday.
  const daysToFriday = (5 - day + 7) % 7;
  return `${daysToFriday} day${daysToFriday === 1 ? "" : "s"} to confirmation day`;
};

/* ------------------------------------------------------------------ *
 * 7.4 / 7.5  Visit date resolution and sort order
 * ------------------------------------------------------------------ */

/** Falls back from cSiteVisitAt to cNextContactAt. */
export const getVisitAt = (visit) =>
  visit?.cSiteVisitAt || visit?.cNextContactAt || null;

/**
 * Two fixed levels:
 *   1. Outcomes last — any Visited row sinks below every Scheduled row.
 *   2. Within a group, earliest visit date first.
 *
 * A missing date counts as zero, so undated rows surface at the very top of
 * the Scheduled group. That is useful rather than a bug: a scheduled visit
 * with no date is the thing most in need of attention.
 */
export const sortVisits = (visits = []) =>
  [...visits].sort((a, b) => {
    const aOutcome = isOutcome(toDisplayStatus(a.status)) ? 1 : 0;
    const bOutcome = isOutcome(toDisplayStatus(b.status)) ? 1 : 0;
    if (aOutcome !== bOutcome) return aOutcome - bOutcome;

    const aTime = parseVisitDate(getVisitAt(a))?.getTime() || 0;
    const bTime = parseVisitDate(getVisitAt(b))?.getTime() || 0;
    return aTime - bTime;
  });

/* ------------------------------------------------------------------ *
 * Phone masking (7.2 / 8.4)
 * ------------------------------------------------------------------ */

/**
 * Digits are replaced, not hidden — the line still occupies its place so
 * rows do not change height by role.
 */
export const maskPhone = (phone, masked) => {
  if (!phone) return "";
  if (!masked) return phone;
  const digits = String(phone).replace(/\D/g, "");
  const tail = digits.slice(-2);
  return `${"•".repeat(Math.max(0, digits.length - 2))}${tail}`;
};

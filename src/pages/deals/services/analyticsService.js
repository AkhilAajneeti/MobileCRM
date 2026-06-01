/**
 * Lead-analytics data-access layer.
 *
 * Pattern: ONE list-fetch per (filters × range) instead of 6N count fetches.
 * Backend builds the slice via ESPO `whereGroup`, frontend does cheap O(N)
 * grouping for the chart.
 *
 * Cache: localStorage layer keyed by (filters, range). Survives reloads.
 * React Query uses this as `initialData` for instant render, then refetches
 * fresh data in the background.
 */

const ESPO_BASE = "https://gateway.aajneetiadvertising.com/Lead";

// Business-only sales statuses — drives both the IN filter and the chart segments.
export const BUSINESS_STATUSES = [
  "New",
  "Interested",
  "Follow up",
  "Purchased",
  "Not Interested",
];

const DATASET_KEY_PREFIX = "lead_analytics_dataset_v1";
const DATASET_TTL = 1000 * 60 * 10; // 10 min — localStorage validity
const DATASET_GC = 1000 * 60 * 60 * 24; // drop entries older than 24h on next read

// Hard caps so a runaway filter never pages forever.
const PAGE_SIZE = 200;
const MAX_LEADS = 1000;

const DATE_FILTER_TYPES = new Set([
  "today",
  "yesterday",
  "currentMonth",
  "lastMonth",
  "nextMonth",
  "currentQuarter",
  "lastQuarter",
  "currentYear",
  "lastYear",
  "lastSevenDays",
  "lastXDays",
  "afterXDays",
  "between",
  "before",
  "after",
  "on",
  "past",
  "future",
  "ever",
  "isEmpty",
]);

// ---------------------------------------------------------------------------
// Query building
// ---------------------------------------------------------------------------

const buildQuery = (whereGroup) =>
  whereGroup
    .map((f, i) => {
      let q = `whereGroup[${i}][type]=${encodeURIComponent(f.type)}`;
      if (f.attribute) {
        q += `&whereGroup[${i}][attribute]=${encodeURIComponent(f.attribute)}`;
      }
      if (Array.isArray(f.value)) {
        f.value.forEach((v) => {
          q += `&whereGroup[${i}][value][]=${encodeURIComponent(v)}`;
        });
      } else if (f.value !== undefined && f.value !== null && f.value !== "") {
        q += `&whereGroup[${i}][value]=${encodeURIComponent(f.value)}`;
      }
      if (f.dateTime || DATE_FILTER_TYPES.has(f.type)) {
        q += `&whereGroup[${i}][dateTime]=true`;
      }
      return q;
    })
    .join("&");

export const filtersToWhereGroup = (filters = {}, { omitAttributes = [] } = {}) => {
  const omit = new Set(omitAttributes);
  const where = [];

  if (filters.dateType && !omit.has("createdAt")) {
    const t = filters.dateType;

    if (
      [
        "today",
        "lastSevenDays",
        "currentMonth",
        "lastMonth",
        "nextMonth",
        "currentQuarter",
        "lastQuarter",
        "currentYear",
        "lastYear",
        "past",
        "future",
        "ever",
        "isEmpty",
      ].includes(t)
    ) {
      where.push({ type: t, attribute: "createdAt", dateTime: true });
    } else if (["on", "before", "after"].includes(t) && filters.closeDateFrom) {
      where.push({
        type: t,
        attribute: "createdAt",
        value: filters.closeDateFrom,
        dateTime: true,
      });
    } else if (t === "between" && filters.closeDateFrom && filters.closeDateTo) {
      where.push({
        type: "between",
        attribute: "createdAt",
        value: [filters.closeDateFrom, filters.closeDateTo],
        dateTime: true,
      });
    } else if (["lastXDays", "afterXDays"].includes(t) && filters.xDays) {
      where.push({ type: t, value: filters.xDays });
    }
  }

  if (filters.search && !omit.has("name")) {
    where.push({ type: "like", attribute: "name", value: `%${filters.search}%` });
  }
  if (filters.cProject && !omit.has("cProject")) {
    where.push({
      type: "like",
      attribute: "cProject",
      value: `%${filters.cProject}%`,
    });
  }
  if (filters.status && !omit.has("status")) {
    where.push({ type: "equals", attribute: "status", value: filters.status });
  }
  if (filters.source && !omit.has("source")) {
    // Match the table: case-insensitive contains on cSubSource (reps fill it
    // freely, so exact-match misses casing/format variants).
    where.push({
      type: "like",
      attribute: "cSubSource",
      value: `%${filters.source}%`,
    });
  }
  if (filters.sector && !omit.has("cSector")) {
    where.push({ type: "equals", attribute: "cSector", value: filters.sector });
  }
  if (filters.assignUser && !omit.has("assignedUserId")) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }

  // Team filter (internal field set by the deals page from team membership).
  // Honored unless the chart explicitly omits the assignedUserId attribute —
  // e.g. AssignedUserChart drops assignedUserId so it can show all reps; but
  // team scope is different (which TEAM's reps to show), so we keep it even
  // when assignedUserId is omitted.
  if (Array.isArray(filters._teamUserIds)) {
    if (filters._teamUserIds.length === 0) {
      where.push({
        type: "equals",
        attribute: "id",
        value: "__no_team_users__",
      });
    } else {
      where.push({
        type: "in",
        attribute: "assignedUserId",
        value: filters._teamUserIds,
      });
    }
  }

  return where;
};

// ---------------------------------------------------------------------------
// localStorage cache (per filters+range key)
// ---------------------------------------------------------------------------

const stableFiltersKey = (filters = {}) => {
  // Normalise key order so {a:1,b:2} and {b:2,a:1} hit the same cache entry.
  const keys = Object.keys(filters).sort();
  return JSON.stringify(keys.map((k) => [k, filters[k]]));
};

// onDate is only meaningful when range === "on" — collapse otherwise so
// flipping the date picker doesn't dirty caches for other ranges.
const cacheKeyFor = (filters, range, onDate) => {
  const rangePart = range === "on" && onDate ? `on:${onDate}` : range;
  return `${DATASET_KEY_PREFIX}:${rangePart}:${stableFiltersKey(filters)}`;
};

export const readCachedDataset = (filters, range, onDate = null) => {
  try {
    const key = cacheKeyFor(filters, range, onDate);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp) return null;
    // GC: drop very old entries; we'd rather refetch than show day-old data.
    if (Date.now() - parsed.timestamp > DATASET_GC) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedDataset = (filters, range, list, onDate = null) => {
  try {
    localStorage.setItem(
      cacheKeyFor(filters, range, onDate),
      JSON.stringify({ list, timestamp: Date.now() }),
    );
  } catch {
    // Quota exceeded / disabled — silently skip.
  }
};

export const isCachedDatasetFresh = (filters, range, onDate = null) => {
  const cached = readCachedDataset(filters, range, onDate);
  if (!cached) return false;
  return Date.now() - cached.timestamp < DATASET_TTL;
};

// ---------------------------------------------------------------------------
// The single fetch
// ---------------------------------------------------------------------------

/**
 * Fetch the analytics dataset in ONE call (or a couple of paginated ones,
 * capped at MAX_LEADS). Returns the raw record list — caller groups it.
 *
 * NOTE on filters:
 *   - We deliberately DO NOT filter by status here. A manager looking at
 *     "Anish made 31 leads this week" expects 31 total — including leads
 *     in technical statuses (Dead, Call Not Picked, etc.). The chart
 *     groups those into an "Other" bucket so totals stay accurate.
 *   - Range filters `createdAt` so the count matches "leads created in
 *     last N days" — what the user actually compares against.
 *
 * range:
 *   "today"        → createdAt today
 *   "7d"           → createdAt lastSevenDays
 *   "currentMonth" → createdAt currentMonth
 *   "on"           → createdAt on:<onDate>   (single calendar day)
 *   "30d"          → createdAt lastXDays = 30   (kept for back-compat)
 *   "90d"          → createdAt lastXDays = 90   (kept for back-compat)
 *   "all"          → no range filter (still scoped by global filters)
 *
 * onDate: "YYYY-MM-DD" — required when range === "on", otherwise ignored.
 */
export const fetchLeadsForAnalytics = async ({
  filters = {},
  range = "7d",
  onDate = null,
}) => {
  const token = localStorage.getItem("auth_token");

  // Drop global `createdAt` filter (we manage that here based on `range`) and
  // global `status` filter (we want all statuses for accurate user totals).
  const baseWhere = filtersToWhereGroup(filters, {
    omitAttributes: ["status", "createdAt"],
  });

  const whereGroup = [...baseWhere];

  if (range === "today") {
    whereGroup.push({
      type: "today",
      attribute: "createdAt",
      dateTime: true,
    });
  } else if (range === "7d") {
    whereGroup.push({
      type: "lastSevenDays",
      attribute: "createdAt",
      dateTime: true,
    });
  } else if (range === "currentMonth") {
    whereGroup.push({
      type: "currentMonth",
      attribute: "createdAt",
      dateTime: true,
    });
  } else if (range === "on") {
    // Single-day filter. Without a date, don't hit the API at all — caller
    // is still picking. Return empty so the chart shows its empty state.
    if (!onDate) return [];
    // Use `between [00:00:00, 23:59:59]` rather than `on`. ESPO's `on` with a
    // datetime + a full timestamp value matches only the exact second; the
    // whole-day range is unambiguous and matches everything created that day.
    whereGroup.push({
      type: "between",
      attribute: "createdAt",
      value: [`${onDate} 00:00:00`, `${onDate} 23:59:59`],
      dateTime: true,
    });
  } else if (range === "30d") {
    whereGroup.push({
      type: "lastXDays",
      attribute: "createdAt",
      value: 30,
      dateTime: true,
    });
  } else if (range === "90d") {
    whereGroup.push({
      type: "lastXDays",
      attribute: "createdAt",
      value: 90,
      dateTime: true,
    });
  }
  // range === "all" → no extra filter

  const query = buildQuery(whereGroup);
  const select = [
    "id",
    "status",
    "assignedUserId",
    "assignedUserName",
    "cNextContact",
    "modifiedAt",
    "createdAt",
  ].join(",");

  const all = [];
  let offset = 0;

  while (offset < MAX_LEADS) {
    const url = `${ESPO_BASE}?${query}&select=${select}&maxSize=${PAGE_SIZE}&offset=${offset}&orderBy=createdAt&order=desc`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "/login";
      }
      throw new Error(`Analytics fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const list = data?.list || [];
    all.push(...list);

    if (list.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  writeCachedDataset(filters, range, all, onDate);
  return all;
};

// ---------------------------------------------------------------------------
// Project Distribution dataset
// ---------------------------------------------------------------------------
// Distinct from `fetchLeadsForAnalytics`:
//   - honors ALL page-level filters as-is (status, dateType, source, assignUser…)
//   - separate localStorage cache + queryKey so it never collides with the user-chart fetch
// Used by ProjectChart in the Lead Analytics section.

const PROJECT_KEY_PREFIX = "lead_project_dataset_v1";

const projectCacheKeyFor = (filters) =>
  `${PROJECT_KEY_PREFIX}:${stableFiltersKey(filters)}`;

export const readCachedProjectDataset = (filters) => {
  try {
    const key = projectCacheKeyFor(filters);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp) return null;
    if (Date.now() - parsed.timestamp > DATASET_GC) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const writeCachedProjectDataset = (filters, list) => {
  try {
    localStorage.setItem(
      projectCacheKeyFor(filters),
      JSON.stringify({ list, timestamp: Date.now() }),
    );
  } catch {
    // localStorage quota / disabled — skip silently.
  }
};

export const fetchProjectDataset = async ({ filters = {} }) => {
  const token = localStorage.getItem("auth_token");

  // Honor EVERY page-level filter as-is, including status + date. That's the
  // contract the chart promises to its callers.
  const whereGroup = filtersToWhereGroup(filters, { omitAttributes: [] });
  const query = buildQuery(whereGroup);

  // Slim payload — id + project fields (for the project view) and
  // assignedUserId (so the same dataset can power the "Teams" tab via a
  // user→team map built in the chart layer).
  const select = ["id", "cProject", "cProjectName", "assignedUserId"].join(",");

  const all = [];
  let offset = 0;

  while (offset < MAX_LEADS) {
    const url = query
      ? `${ESPO_BASE}?${query}&select=${select}&maxSize=${PAGE_SIZE}&offset=${offset}&orderBy=createdAt&order=desc`
      : `${ESPO_BASE}?select=${select}&maxSize=${PAGE_SIZE}&offset=${offset}&orderBy=createdAt&order=desc`;

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", token },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.href = "/login";
      }
      throw new Error(`Project dataset fetch failed: ${res.status}`);
    }

    const data = await res.json();
    const list = data?.list || [];
    all.push(...list);
    if (list.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  writeCachedProjectDataset(filters, all);
  return all;
};

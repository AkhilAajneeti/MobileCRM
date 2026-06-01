/**
 * Win Rate analytics data layer.
 *
 * Pattern: ONE backend fetch per (filters × year), paginated up to MAX_LEADS.
 * Frontend groups the records by month + Win / Active / Lost category.
 *
 * Cache:
 *   - In-flight dedup (Map of Promise) so concurrent observers share a request.
 *   - localStorage persistence so the chart paints instantly on reload.
 *   - 10-min TTL on cached entries; React Query handles 5-min background refresh.
 */

const ESPO_BASE = "https://gateway.aajneetiadvertising.com/Lead";

const DATASET_KEY_PREFIX = "win_rate_dataset_v1";
const DATASET_TTL = 1000 * 60 * 10;
const DATASET_GC = 1000 * 60 * 60 * 24;

const PAGE_SIZE = 200;
// Higher than the deals analytics cap because a yearly window can hold more leads.
const MAX_LEADS = 5000;

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
// Query helpers
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

// Mirrors the page-level filters object from reports/index.jsx into ESPO where clauses.
// Drops `status` (we want all statuses for categorisation) and `createdAt` (chart picks the year).
const filtersToWhereGroup = (filters = {}) => {
  const where = [];

  if (filters.search) {
    where.push({ type: "like", attribute: "name", value: `%${filters.search}%` });
  }
  if (filters.source) {
    where.push({ type: "equals", attribute: "source", value: filters.source });
  }
  if (filters.assignUser) {
    where.push({
      type: "equals",
      attribute: "assignedUserId",
      value: filters.assignUser,
    });
  }
  if (filters.cProject) {
    where.push({
      type: "like",
      attribute: "cProject",
      value: `%${filters.cProject}%`,
    });
  }
  if (filters.sector) {
    where.push({ type: "equals", attribute: "cSector", value: filters.sector });
  }

  return where;
};

const dateFilterToWhere = (filters = {}, year) => {
  if (filters.dateFilter === "on" && filters.date) {
    return {
      type: "on",
      attribute: "createdAt",
      value: filters.date,
      dateTime: true,
    };
  }

  if (filters.dateFilter === "between" && filters.startDate && filters.endDate) {
    return {
      type: "between",
      attribute: "createdAt",
      value: [filters.startDate, filters.endDate],
      dateTime: true,
    };
  }

  return {
    type: "between",
    attribute: "createdAt",
    value: [`${year}-01-01 00:00:00`, `${year}-12-31 23:59:59`],
    dateTime: true,
  };
};

// ---------------------------------------------------------------------------
// localStorage cache (per filters + year)
// ---------------------------------------------------------------------------

const stableFiltersKey = (filters = {}) => {
  const keys = Object.keys(filters).sort();
  return JSON.stringify(keys.map((k) => [k, filters[k]]));
};

const cacheKeyFor = (filters, year) =>
  `${DATASET_KEY_PREFIX}:${year}:${stableFiltersKey(filters)}`;

export const readCachedDataset = (filters, year) => {
  try {
    const key = cacheKeyFor(filters, year);
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

export const writeCachedDataset = (filters, year, list) => {
  try {
    localStorage.setItem(
      cacheKeyFor(filters, year),
      JSON.stringify({ list, timestamp: Date.now() }),
    );
  } catch {
    // localStorage quota / disabled — skip silently.
  }
};

export const isCachedDatasetFresh = (filters, year) => {
  const cached = readCachedDataset(filters, year);
  if (!cached) return false;
  return Date.now() - cached.timestamp < DATASET_TTL;
};

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

const inFlight = new Map();

export const fetchWinRateDataset = async ({ filters = {}, year }) => {
  const key = cacheKeyFor(filters, year);
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const token = localStorage.getItem("auth_token");

    const baseWhere = filtersToWhereGroup(filters);
    const whereGroup = [
      ...baseWhere,
      dateFilterToWhere(filters, year),
    ];

    const query = buildQuery(whereGroup);
    const select = [
      "id",
      "status",
      "createdAt",
      "assignedUserId",
      "assignedUserName",
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
        throw new Error(`Win rate fetch failed: ${res.status}`);
      }

      const data = await res.json();
      const list = data?.list || [];
      all.push(...list);
      if (list.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    writeCachedDataset(filters, year, all);
    return all;
  })().finally(() => {
    inFlight.delete(key);
  });

  inFlight.set(key, promise);
  return promise;
};

export const invalidateWinRateCache = () => {
  inFlight.clear();
  // Best-effort wipe of all our localStorage entries.
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(DATASET_KEY_PREFIX)) localStorage.removeItem(k);
    });
  } catch {
    // ignore
  }
};

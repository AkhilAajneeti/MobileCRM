/**
 * Sales Funnel + Rep Insights analytics hook.
 *
 * Shares the same dataset as `useWinRateAnalytics` — both call
 * `fetchWinRateDataset` via React Query under the SAME queryKey, so the network
 * fetch is deduplicated. Two analytics views, one round trip.
 *
 * Returns:
 *   funnel:        [{ stage, count, conversion, dropOff, ... }] in pipeline order
 *   funnelStats:   { highestDropOff, bestConversion, overallConversion, totalLeads }
 *   reps:          [{ id, name, total, purchased, conversion, active, trend, growth }]
 *   isEmpty/isLoading/isFetching
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWinRateDataset, readCachedDataset } from "../services/winRateService";

const STALE = 1000 * 60 * 5;
const GC = 1000 * 60 * 30;

// Funnel stages in pipeline order (top → bottom).
export const FUNNEL_STAGES = [
  { key: "New", label: "New", from: "#60A5FA", to: "#2563EB" },
  { key: "Follow up", label: "Follow up", from: "#A78BFA", to: "#7C3AED" },
  { key: "Interested", label: "Interested", from: "#34D399", to: "#10B981" },
  { key: "Site Visit Scheduled", label: "Site Visit Scheduled", from: "#FBBF24", to: "#F59E0B" },
  { key: "Site Visit Done", label: "Site Visit Done", from: "#FB923C", to: "#EA580C" },
  { key: "Purchased", label: "Purchased", from: "#F472B6", to: "#DB2777" },
];

const FUNNEL_SET = new Set(FUNNEL_STAGES.map((s) => s.key.toLowerCase()));

const ACTIVE_EXTRA_SET = new Set(["call later", "broker"]);
const LOST_SET = new Set([
  "dead",
  "fake lead",
  "invalid number",
  "irrelevant lead",
  "low budget",
  "low interest",
  "not interested",
  "other location",
  "switch off",
  "call not picked",
  "call not connecting",
]);

const norm = (s) => (s || "").trim().toLowerCase();

const firstName = (full) => (full || "").trim().split(" ")[0] || "Unassigned";

// ---------------------------------------------------------------------------
// 8-week activity bucketing
// ---------------------------------------------------------------------------

const startOfWeek = (d) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7; // Monday-start
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - diff);
  return date;
};

const buildWeekBuckets = () => {
  const monday = startOfWeek(new Date());
  const buckets = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date(monday);
    start.setDate(monday.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    buckets.push({ start, end, period: `W${8 - i}`, value: 0 });
  }
  return buckets;
};

const REP_PALETTE = [
  "#6366F1", "#22C55E", "#F59E0B", "#EF4444",
  "#06B6D4", "#8B5CF6", "#EC4899", "#14B8A6",
];
const colorForName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) >>> 0;
  return REP_PALETTE[hash % REP_PALETTE.length];
};

// ---------------------------------------------------------------------------

// Compute the [start, end) date range for the selected month bucket.
// "current" → current calendar month; "last" → previous calendar month.
// Wraps year correctly when "last" is in December of the prior year.
const monthRangeFor = (month) => {
  const now = new Date();
  if (month === "last") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end };
  }
  // "current" (default)
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const rangeForFilter = ({ month, dateFilter, date, startDate, endDate }) => {
  if (dateFilter === "on") {
    const start = parseDateOnly(date);
    if (!start) return monthRangeFor(month);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }

  if (dateFilter === "between") {
    const start = parseDateOnly(startDate);
    const end = parseDateOnly(endDate);
    if (!start || !end) return monthRangeFor(month);
    const inclusiveEnd = new Date(end);
    inclusiveEnd.setDate(end.getDate() + 1);
    return { start, end: inclusiveEnd };
  }

  return monthRangeFor(month);
};

export const useFunnelAnalytics = ({
  filters,
  year = new Date().getFullYear(),
  month = "current",
  dateFilter,
  date,
  startDate,
  endDate,
  enabled = true,
}) => {
  const datasetFilters = useMemo(() => {
    const next = { ...(filters || {}) };

    if (dateFilter === "on" && date) {
      next.dateFilter = "on";
      next.date = date;
    } else if (dateFilter === "between" && startDate && endDate) {
      next.dateFilter = "between";
      next.startDate = startDate;
      next.endDate = endDate;
    }

    return next;
  }, [filters, dateFilter, date, startDate, endDate]);

  // Share the win-rate query — same key = same network request, single fetch.
  const { data: list, isLoading, isFetching, isError } = useQuery({
    queryKey: ["win-rate-dataset", datasetFilters, year],
    queryFn: () => fetchWinRateDataset({ filters: datasetFilters, year }),
    enabled,
    initialData: () => {
      const cached = readCachedDataset(datasetFilters, year);
      return cached?.list ?? undefined;
    },
    initialDataUpdatedAt: 0,
    placeholderData: (previous) => previous,
    staleTime: STALE,
    gcTime: GC,
    refetchInterval: STALE,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const aggregated = useMemo(() => {
    const { start: monthStart, end: monthEnd } = rangeForFilter({
      month,
      dateFilter,
      date,
      startDate,
      endDate,
    });

    // Filter the shared yearly dataset down to the selected calendar month.
    // Done in memory — both charts still share one network fetch.
    const records = (list || []).filter((lead) => {
      if (!lead?.createdAt) return false;
      const d = new Date(`${lead.createdAt.replace(" ", "T")}Z`);
      if (Number.isNaN(d.getTime())) return false;
      return d >= monthStart && d < monthEnd;
    });

    // ---- Funnel: count per stage ----
    const stageCounts = Object.fromEntries(
      FUNNEL_STAGES.map((s) => [s.key, 0]),
    );

    // ---- Per-rep state ----
    const byRep = new Map();
    const weekTemplate = buildWeekBuckets();

    for (const lead of records) {
      const status = lead?.status;
      const statusN = norm(status);

      // Funnel bucketing — match against the canonical labels.
      const canonical = FUNNEL_STAGES.find((s) => s.key.toLowerCase() === statusN);
      if (canonical) stageCounts[canonical.key] += 1;

      // Rep aggregation.
      const uid = lead?.assignedUserId || "unassigned";
      let rep = byRep.get(uid);
      if (!rep) {
        rep = {
          id: uid,
          name: firstName(lead?.assignedUserName),
          fullName: lead?.assignedUserName || "Unassigned",
          color: colorForName(lead?.assignedUserName || "Unassigned"),
          total: 0,
          purchased: 0,
          active: 0,
          lost: 0,
          // Deep copy the week template so each rep gets its own buckets.
          trend: weekTemplate.map((w) => ({ ...w })),
        };
        byRep.set(uid, rep);
      }

      rep.total += 1;
      if (statusN === "purchased") rep.purchased += 1;
      if (FUNNEL_SET.has(statusN) && statusN !== "purchased") rep.active += 1;
      if (ACTIVE_EXTRA_SET.has(statusN)) rep.active += 1;
      if (LOST_SET.has(statusN)) rep.lost += 1;

      // 8-week trend by createdAt.
      if (lead?.createdAt) {
        const d = new Date(`${lead.createdAt.replace(" ", "T")}Z`);
        if (!Number.isNaN(d.getTime())) {
          for (const w of rep.trend) {
            if (d >= w.start && d < w.end) {
              w.value += 1;
              break;
            }
          }
        }
      }
    }

    // ---- Funnel transformations ----
    // conversion = count / max(stageCounts) × 100  (share of top-of-funnel)
    // dropOff   = (previous stage − this stage) / previous × 100, only when stageN ≤ stageN-1
    const topCount = FUNNEL_STAGES.reduce(
      (m, s) => Math.max(m, stageCounts[s.key]),
      0,
    );
    const totalInFunnel = FUNNEL_STAGES.reduce(
      (sum, s) => sum + stageCounts[s.key],
      0,
    );

    let prevCount = null;
    const funnel = FUNNEL_STAGES.map((s) => {
      const count = stageCounts[s.key];
      const conversion = topCount ? Math.round((count / topCount) * 1000) / 10 : 0;
      const dropOff =
        prevCount && prevCount > count
          ? Math.round(((prevCount - count) / prevCount) * 1000) / 10
          : 0;
      const row = { ...s, count, conversion, dropOff, prevCount };
      prevCount = count;
      return row;
    });

    // Highest drop-off — only meaningful when both adjacent stages have leads.
    let highestDropOff = null;
    let bestConversion = null;
    for (let i = 1; i < funnel.length; i++) {
      const row = funnel[i];
      if (row.dropOff > (highestDropOff?.dropOff || 0)) highestDropOff = row;
      // "Best conversion" = stage with smallest drop-off when previous stage had leads.
      if (
        row.prevCount > 0 &&
        row.count > 0 &&
        (!bestConversion || row.dropOff < bestConversion.dropOff)
      ) {
        bestConversion = row;
      }
    }

    const newCount = stageCounts["New"] || 0;
    const purchasedCount = stageCounts["Purchased"] || 0;
    const overallConversion =
      newCount + purchasedCount
        ? Math.round((purchasedCount / Math.max(newCount, purchasedCount)) * 1000) / 10
        : 0;

    // ---- Rep transformations ----
    const reps = [...byRep.values()]
      .filter((r) => r.total > 0)
      .map((r) => {
        const trend = r.trend.map((w) => ({ period: w.period, value: w.value }));

        // Growth: recent 4 weeks vs previous 4 weeks (total leads).
        const recent = trend.slice(4).reduce((s, w) => s + w.value, 0);
        const older = trend.slice(0, 4).reduce((s, w) => s + w.value, 0);
        const growthPct =
          older > 0
            ? Math.round(((recent - older) / older) * 100)
            : recent > 0
              ? 100
              : 0;

        const conversion =
          r.total > 0 ? Math.round((r.purchased / r.total) * 1000) / 10 : 0;

        return {
          id: r.id,
          name: r.name,
          fullName: r.fullName,
          color: r.color,
          total: r.total,
          purchased: r.purchased,
          active: r.active,
          lost: r.lost,
          conversion,
          trend,
          growthPct,
          growthDirection:
            growthPct > 0 ? "up" : growthPct < 0 ? "down" : "flat",
        };
      })
      .sort((a, b) => b.total - a.total);

    const isEmpty = totalInFunnel === 0 && reps.length === 0;

    return {
      funnel,
      funnelStats: {
        highestDropOff,
        bestConversion,
        overallConversion,
        totalLeads: totalInFunnel,
      },
      reps,
      isEmpty,
    };
  }, [list, month, dateFilter, date, startDate, endDate]);

  return {
    ...aggregated,
    isLoading,
    isFetching,
    isError,
  };
};

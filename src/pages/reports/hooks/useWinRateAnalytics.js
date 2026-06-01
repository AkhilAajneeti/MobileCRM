/**
 * Win Rate analytics hook.
 *
 * One backend fetch per (filters × year). Frontend groups records by month and
 * by category (Win / Active / Lost) into:
 *   - monthlyData: 12 rows (Jan–Dec) with { month, won, lost, active, total, winRate }
 *   - pieData:     [{ name: "Won", value, fill }, { name: "Active", … }, { name: "Lost", … }]
 *   - summary:     { totalWon, totalLost, totalActive, overallWinRate, bestMonth, trends }
 *   - isEmpty:     true when every monthly bucket is zero (drives "no data" state)
 *
 * React Query handles in-memory caching and silent background refresh every 5 min.
 * localStorage seeds `initialData` so reloads paint instantly.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchWinRateDataset, readCachedDataset } from "../services/winRateService";

const STALE = 1000 * 60 * 5; // 5 min — silent refresh interval
const GC = 1000 * 60 * 30;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Category sets per spec — lowercase for case-insensitive matching.
const WIN_SET = new Set(["purchased"]);
const ACTIVE_SET = new Set([
  "new",
  "follow up",
  "interested",
  "site visit scheduled",
  "site visit done",
  "call later",
  "broker",
]);
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

const categorize = (status) => {
  const n = (status || "").trim().toLowerCase();
  if (WIN_SET.has(n)) return "won";
  if (ACTIVE_SET.has(n)) return "active";
  if (LOST_SET.has(n)) return "lost";
  return null; // uncategorised — ignore so totals stay clean
};

const buildEmptyMonth = (label) => ({
  month: label,
  won: 0,
  lost: 0,
  active: 0,
  total: 0,
  winRate: 0,
});

const computeTrend = (current, previous) => {
  if (previous === 0 && current === 0) return { direction: "flat", pct: 0 };
  if (previous === 0) return { direction: "up", pct: 100 };
  const delta = current - previous;
  const pct = Math.round((delta / previous) * 100);
  return {
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
    pct: Math.abs(pct),
  };
};

export const useWinRateAnalytics = ({
  filters,
  year = new Date().getFullYear(),
  enabled = true,
}) => {
  const { data: list, isLoading, isFetching, isError } = useQuery({
    queryKey: ["win-rate-dataset", filters, year],
    queryFn: () => fetchWinRateDataset({ filters, year }),
    enabled,
    initialData: () => {
      const cached = readCachedDataset(filters, year);
      return cached?.list ?? undefined;
    },
    // Treat cached as immediately stale so React Query fires a background refetch.
    initialDataUpdatedAt: 0,
    staleTime: STALE,
    gcTime: GC,
    refetchInterval: STALE, // silent background refresh every 5 min
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const aggregated = useMemo(() => {
    const monthly = MONTH_LABELS.map(buildEmptyMonth);
    const records = list || [];

    for (const lead of records) {
      if (!lead?.createdAt) continue;
      const category = categorize(lead.status);
      if (!category) continue;

      const d = new Date(`${lead.createdAt.replace(" ", "T")}Z`);
      if (Number.isNaN(d.getTime())) continue;
      // Only count leads whose year matches the requested year. (Backend already filters,
      // but localStorage hydration could carry stale entries; this is a safety net.)
      if (d.getFullYear() !== year) continue;

      const idx = d.getMonth();
      const row = monthly[idx];
      row[category] += 1;
      row.total += 1;
    }

    // Compute winRate per month — Won / (Won + Lost) × 100.
    for (const row of monthly) {
      const denom = row.won + row.lost;
      row.winRate = denom ? Number(((row.won / denom) * 100).toFixed(1)) : 0;
    }

    // Annual totals.
    let totalWon = 0;
    let totalLost = 0;
    let totalActive = 0;
    for (const r of monthly) {
      totalWon += r.won;
      totalLost += r.lost;
      totalActive += r.active;
    }
    const overallWinRate =
      totalWon + totalLost
        ? Number(((totalWon / (totalWon + totalLost)) * 100).toFixed(1))
        : 0;

    // Best month: max winRate, tie-broken by raw `won` count so a 1/1 month
    // doesn't beat a 8/15 month.
    let bestMonth = null;
    for (const r of monthly) {
      if (r.won + r.lost === 0) continue;
      if (
        !bestMonth ||
        r.winRate > bestMonth.winRate ||
        (r.winRate === bestMonth.winRate && r.won > bestMonth.won)
      ) {
        bestMonth = r;
      }
    }

    // Month-over-month trend (current month vs previous).
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();
    const currentIdx = isCurrentYear ? now.getMonth() : 11;
    const prevIdx = currentIdx - 1;
    const cur = monthly[currentIdx] || buildEmptyMonth("");
    const prev = prevIdx >= 0 ? monthly[prevIdx] : buildEmptyMonth("");

    const trends = {
      won: computeTrend(cur.won, prev.won),
      lost: computeTrend(cur.lost, prev.lost),
      winRate: computeTrend(cur.winRate, prev.winRate),
    };

    const pieData = [
      { name: "Won", value: totalWon, fill: "#10B981" },
      { name: "Active", value: totalActive, fill: "#3B82F6" },
      { name: "Lost", value: totalLost, fill: "#EF4444" },
    ];

    // Distinguish "no data anywhere" from "no wins yet" — both need empty UX,
    // but only `isEmpty` should hide KPIs / donut.
    const isEmpty = totalWon + totalLost + totalActive === 0;
    const hasWins = totalWon > 0;

    return {
      monthlyData: monthly,
      pieData,
      summary: {
        totalWon,
        totalLost,
        totalActive,
        overallWinRate,
        bestMonth,
        trends,
      },
      isEmpty,
      hasWins,
    };
  }, [list, year]);

  return {
    ...aggregated,
    isLoading,
    isFetching,
    isError,
  };
};

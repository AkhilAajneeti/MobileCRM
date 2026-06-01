/**
 * Lead Analytics hooks.
 *
 * Strategy: ONE shared dataset fetch per (filters × range), driven by ESPO
 * `whereGroup` filters. Frontend groups the records for the chart — that's a
 * tight O(N) reduce, not the "filter the paginated table" pattern we avoid.
 *
 * Cache:
 *   - localStorage gives instant render on reload (`initialData`).
 *   - `initialDataUpdatedAt: 0` marks cached data as stale, triggering a
 *     background refetch so the user never sees out-of-date numbers.
 *   - `staleTime` keeps the in-memory cache fresh for 2 min after a real fetch
 *     so chart re-mounts within that window don't re-hit the network.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLeadsForAnalytics,
  readCachedDataset,
  fetchProjectDataset,
  readCachedProjectDataset,
  BUSINESS_STATUSES,
} from "../services/analyticsService";

const FRESH_WINDOW = 1000 * 60 * 2; // 2 min — chart re-mounts within this skip network
const KEEP_IN_MEMORY = 1000 * 60 * 30;

const firstName = (full) => (full || "").trim().split(" ")[0] || "Unassigned";

const isOverdue = (lead, now) => {
  if (lead?.status !== "Follow up") return false;
  if (!lead?.cNextContact) return false;
  const d = new Date(lead.cNextContact);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() < now;
};

// ---------------------------------------------------------------------------
// Primary dataset hook — both charts (current + future StatusChart) share it.
// ---------------------------------------------------------------------------

export const useLeadsForAnalytics = ({
  filters,
  range = "7d",
  onDate = null,
  enabled = true,
}) => {
  // When picking a single day, don't fire the request until a date is chosen.
  const ready = range !== "on" || !!onDate;

  return useQuery({
    queryKey: ["lead-analytics-dataset", filters, range, range === "on" ? onDate : null],
    queryFn: () => fetchLeadsForAnalytics({ filters, range, onDate }),
    enabled: enabled && ready,
    initialData: () => {
      const cached = readCachedDataset(filters, range, onDate);
      return cached?.list ?? undefined;
    },
    // 0 = treat initialData as immediately stale -> RQ fires a background refetch.
    initialDataUpdatedAt: 0,
    staleTime: FRESH_WINDOW,
    gcTime: KEEP_IN_MEMORY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
};

// ---------------------------------------------------------------------------
// Per-user breakdown derived from the shared dataset.
// ---------------------------------------------------------------------------

export const useUserBreakdown = ({
  filters,
  range = "7d",
  onDate = null,
  enabled = true,
}) => {
  const { data: list, isLoading, isFetching, isError } = useLeadsForAnalytics({
    filters,
    range,
    onDate,
    enabled,
  });

  const data = useMemo(() => {
    const records = list || [];
    const now = Date.now();
    const byUser = new Map();

    for (const lead of records) {
      const uid = lead?.assignedUserId || "unassigned";
      let row = byUser.get(uid);
      if (!row) {
        row = {
          userId: uid,
          name: firstName(lead?.assignedUserName),
          fullName: lead?.assignedUserName || "Unassigned",
          interested: 0,
          followUp: 0,
          purchased: 0,
          notInterested: 0,
          newOpen: 0,
          other: 0,
          
          otherBreakdown: {},
          total: 0,
          overdue: 0,
        };
        byUser.set(uid, row);
      }

      // Every lead counts toward the user's total — including technical statuses.
      // That keeps the bar total honest ("Anish made 31 this week" → 31).
      switch (lead?.status) {
        case "Interested":
          row.interested += 1;
          break;
        case "Follow up":
          row.followUp += 1;
          break;
        case "Purchased":
          row.purchased += 1;
          break;
        case "Not Interested":
          row.notInterested += 1;
          break;
        case "New":
        case "Open":
          row.newOpen += 1;
          break;
        default: {
          row.other += 1;
          const key = lead?.status || "Unknown";
          row.otherBreakdown[key] = (row.otherBreakdown[key] || 0) + 1;
          break;
        }
      }

      row.total += 1;
      if (isOverdue(lead, now)) row.overdue += 1;
    }

    return [...byUser.values()];
  }, [list]);

  return { data, isLoading, isFetching, isError };
};

export { BUSINESS_STATUSES };

// Status -> safe object-key mapping. Re-exported for StatusChart (currently
// disabled; will consume the same dataset when re-enabled).
export const STATUS_KEY = {
  "New": "New",
  "Interested": "Interested",
  "Follow up": "FollowUp",
  "Purchased": "Purchased",
  "Not Interested": "NotInterested",
};

// Stub kept so the (currently commented-out) StatusChart import resolves.
// TODO: re-implement on top of useLeadsForAnalytics when StatusChart is re-enabled.
export const useStatusTrend = () => ({
  data: [],
  isLoading: false,
  isFetching: false,
  isError: false,
});

// ---------------------------------------------------------------------------
// Project Distribution
// ---------------------------------------------------------------------------
//
// Groups the leads dataset (filtered by ALL page-level DealsFilters) by
// `cProject` and returns top-N + "Others". Drives the donut chart.
//
// Uses its own dataset path (`fetchProjectDataset`) so:
//   - status/date/source/assignUser filters from DealsFilters all apply
//   - it doesn't share a cache key with the user-breakdown chart (different scope)

const PROJECT_COLORS = [
  "#6366F1", // indigo
  "#22C55E", // emerald
  "#F59E0B", // amber
  "#EF4444", // rose
  "#06B6D4", // cyan
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#14B8A6", // teal
];
const OTHERS_COLOR = "#94A3B8";

// Build the grouping key for one lead given the current `groupBy` mode.
// Returns the human-readable bucket name the donut will use.
const groupKeyForLead = (lead, groupBy, userTeamMap) => {
  if (groupBy === "team") {
    if (!lead?.assignedUserId) return "Unassigned";
    const teamName = userTeamMap?.get(lead.assignedUserId);
    return teamName || "No team";
  }
  // default: project
  const raw = (lead?.cProject || lead?.cProjectName || "").toString().trim();
  return raw || "No project";
};

export const useProjectBreakdown = ({
  filters,
  enabled = true,
  topN = 6,
  // "project" (default) groups by cProject. "team" groups by the assigned user's
  // team — caller provides `userTeamMap: Map<userId, teamName>` so the hook
  // stays pure. Switching modes is free: same dataset, just a different reducer.
  groupBy = "project",
  userTeamMap = null,
}) => {
  const { data: list, isLoading, isFetching, isError } = useQuery({
    queryKey: ["project-distribution-dataset", filters],
    queryFn: () => fetchProjectDataset({ filters }),
    enabled,
    initialData: () => {
      const cached = readCachedProjectDataset(filters);
      return cached?.list ?? undefined;
    },
    initialDataUpdatedAt: 0,
    staleTime: FRESH_WINDOW,
    gcTime: KEEP_IN_MEMORY,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const aggregated = useMemo(() => {
    const records = list || [];
    const counts = new Map();

    for (const lead of records) {
      const key = groupKeyForLead(lead, groupBy, userTeamMap);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const total = records.length;
    const sorted = [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    let top = sorted;
    let othersValue = 0;
    if (sorted.length > topN) {
      top = sorted.slice(0, topN);
      othersValue = sorted.slice(topN).reduce((s, r) => s + r.value, 0);
    }

    const pieData = top.map((r, i) => ({
      name: r.name,
      value: r.value,
      percent: total ? Math.round((r.value / total) * 1000) / 10 : 0,
      fill: PROJECT_COLORS[i % PROJECT_COLORS.length],
    }));

    if (othersValue > 0) {
      pieData.push({
        name: "Others",
        value: othersValue,
        percent: total ? Math.round((othersValue / total) * 1000) / 10 : 0,
        fill: OTHERS_COLOR,
      });
    }

    const topProject = sorted[0] || null;

    return {
      pieData,
      total,
      projectCount: sorted.length,
      topProject: topProject
        ? {
            name: topProject.name,
            value: topProject.value,
            percent: total
              ? Math.round((topProject.value / total) * 1000) / 10
              : 0,
          }
        : null,
    };
  }, [list, topN, groupBy, userTeamMap]);

  return {
    ...aggregated,
    isLoading,
    isFetching,
    isError,
    isEmpty: aggregated.total === 0,
  };
};

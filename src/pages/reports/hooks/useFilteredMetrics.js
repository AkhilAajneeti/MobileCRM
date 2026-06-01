/**
 * Filter-aware metrics for the Reports page top cards.
 *
 * Each card is backed by a dedicated ESPO count query so the displayed number
 * reflects the FULL filtered dataset, not the paginated table response.
 *
 * The query includes:
 *   - base filters (date, source, assigned user, search)
 *   - the page-level status filter (if set) AND the card's own status
 *
 * If the page-level status filter conflicts with a card's status, ESPO returns 0
 * for that card — which is exactly what we want ("the filtered dataset has no
 * leads of this kind").
 *
 * Caching: React Query keeps results for 2 min and silently refetches when stale.
 * `fetchLeadsCount` has its own 10-min in-memory + localStorage cache underneath
 * so identical queries across sessions hit cache, not network.
 */
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchLeadsCount } from "services/leads.service";

// Card definitions — single source of truth for what each tile means.
export const METRIC_DEFS = [
  {
    title: "Follow Up",
    status: "Follow up",
    icon: "TrendingUp",
    iconColor: "bg-success",
    description: "Leads awaiting action",
  },
  {
    title: "Call Not Picked",
    status: "Call Not Picked",
    icon: "PhoneOff",
    iconColor: "bg-primary",
    description: "Leads not reachable on call",
  },
  {
    title: "Call Later",
    status: "Call Later",
    icon: "Clock",
    iconColor: "bg-purple-400",
    description: "Leads scheduled for future follow-up",
  },
  {
    title: "Not Interested",
    status: "Not interested",
    icon: "XCircle",
    iconColor: "bg-red-400",
    description: "Leads marked as not interested",
  },
];

// Page-level filter object -> ESPO whereGroup array.
// Mirrors fetchNewLeads' mapping, EXCEPT we leave the status filter for the
// caller to add — each card injects its own status on top.
const buildBaseWhere = (filters = {}) => {
  const where = [];

  if (filters.dateType) {
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
    } else if (
      t === "between" &&
      filters.closeDateFrom &&
      filters.closeDateTo
    ) {
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

  return where;
};

export const useFilteredMetrics = ({ filters, enabled = true }) => {
  const baseWhere = useMemo(() => buildBaseWhere(filters), [filters]);
  const filterStatus = filters?.status || "";

  const queries = useMemo(() => {
    return METRIC_DEFS.map((m) => {
      // Compose the card's where clause:
      //   base + (global status if set) + card status
      const where = [...baseWhere];
      if (filterStatus) {
        where.push({ type: "equals", attribute: "status", value: filterStatus });
      }
      where.push({ type: "equals", attribute: "status", value: m.status });

      return {
        queryKey: ["filtered-metric", m.title, where],
        queryFn: () => fetchLeadsCount(where),
        enabled,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Keep showing the last value while a new fetch is in flight,
        // so filter changes don't briefly blank the cards.
        placeholderData: (prev) => prev,
        retry: 1,
      };
    });
  }, [baseWhere, filterStatus, enabled]);

  const results = useQueries({ queries });

  const metricsData = useMemo(() => {
    return METRIC_DEFS.map((m, i) => ({
      title: m.title,
      value: results[i]?.data ?? 0,
      change: "—",
      changeType: "positive",
      icon: m.icon,
      iconColor: m.iconColor,
      description: m.description,
    }));
  }, [results]);

  return {
    metricsData,
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
  };
};

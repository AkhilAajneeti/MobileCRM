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

/**
 * Status-row cards — single source of truth for what each tile means.
 *
 * Order is by how much each demands attention: a lead written off, then one
 * that never picked up, then a scheduled callback. Not alphabetical, not by
 * count.
 *
 * Call Not Picked is amber rather than red on purpose — a missed call means
 * retry, not dead, and amber keeps it distinct from Not Interested beside it.
 *
 * `status` is the RAW STORED VALUE, not the dropdown label — note the
 * lower-case i in "Not interested". Getting it wrong raises no error: the
 * backend just returns 0 and the card reads as "none", which is
 * indistinguishable from a true zero. Verify against real data before editing.
 */
export const METRIC_DEFS = [
  {
    title: "Not Interested",
    status: "Not interested",
    icon: "XCircle",
    from: "#F43F5E",
    to: "#E11D48",
    description: "Leads marked as not interested",
  },
  {
    title: "Call Not Picked",
    status: "Call Not Picked",
    icon: "PhoneOff",
    from: "#F59E0B",
    to: "#F97316",
    description: "Leads not reachable on call",
  },
  {
    title: "Call Later",
    status: "Call Later",
    icon: "Clock",
    from: "#8B5CF6",
    to: "#7C3AED",
    description: "Leads scheduled for future follow-up",
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
      // Compose the card's where clause: base filters + the card's own status.
      //
      // The page-level status filter is deliberately NOT applied here. These
      // cards are the table's status filter (spec 4.1), so folding the active
      // selection back into them would zero the other two the moment one is
      // picked, and you could no longer compare or switch between them.
      const where = [
        ...baseWhere,
        { type: "equals", attribute: "status", value: m.status },
      ];

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
      status: m.status,
      value: results[i]?.data ?? 0,
      icon: m.icon,
      from: m.from,
      to: m.to,
      description: m.description,
    }));
  }, [results]);

  return {
    metricsData,
    isLoading: results.some((r) => r.isLoading),
    isFetching: results.some((r) => r.isFetching),
  };
};

/* ------------------------------------------------------------------ *
 * Qualification row (spec 2) — the lead JOURNEY, not current status.
 *
 * Rows 2 and 4 count different things and deliberately overlap: a lead that
 * was Follow up and is now Not Interested appears in both "Qualified, Then
 * Lost" and "Not Interested". Adding the rows together exceeds the total,
 * and that is correct.
 * ------------------------------------------------------------------ */

/** The statuses that make up "Qualified Now". QDTD has its own card. */
export const QUALIFIED_STATUSES = [
  "Follow up",
  "Interested",
  "Site Visit Scheduled",
  "Invitation Sent",
  "Site Visit Done",
  "Purchased",
];

/**
 * "Showed real interest once, now written off."
 * Junk is excluded on purpose — Fake Lead, Invalid Number, Irrelevant Lead,
 * Duplicate and Broker were never real prospects.
 */
export const LOST_STATUSES = [
  "Not interested",
  "Low Budget",
  "Low Interest",
  "Other Location",
];

export const QUALIFICATION_DEFS = [
  {
    title: "All Leads",
    icon: "Users",
    from: "#3B82F6",
    to: "#2563EB",
    description: "Everything in this view — the base for every % below",
    statuses: null, // no status clause: the whole filtered set
  },
  {
    title: "Qualified Now",
    icon: "BadgeCheck",
    from: "#14B8A6",
    to: "#0D9488",
    description: "Interested today — tap to see the split",
    statuses: QUALIFIED_STATUSES,
    expandable: true,
  },
  {
    title: "Qualified On Delay",
    icon: "Hourglass",
    from: "#6366F1",
    to: "#4338CA",
    description: "Status is QDTD — qualified, but on delay",
    statuses: ["QDTD"],
  },
  {
    title: "Qualified, Then Lost",
    icon: "TrendingDown",
    from: "#78716C",
    to: "#57534E",
    description: "Showed real interest once, now written off",
    statuses: LOST_STATUSES,
  },
];

export const useQualificationMetrics = ({ filters, enabled = true }) => {
  const baseWhere = useMemo(() => buildBaseWhere(filters), [filters]);

  const queries = useMemo(
    () =>
      QUALIFICATION_DEFS.map((def) => {
        const where = [...baseWhere];
        if (def.statuses) {
          where.push({ type: "in", attribute: "status", value: def.statuses });
        }

        return {
          queryKey: ["qualification-metric", def.title, where],
          queryFn: () => fetchLeadsCount(where),
          enabled,
          staleTime: 1000 * 60 * 2,
          gcTime: 1000 * 60 * 30,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          placeholderData: (prev) => prev,
          retry: 1,
        };
      }),
    [baseWhere, enabled],
  );

  const results = useQueries({ queries });
  const total = results[0]?.data ?? 0;

  const qualificationData = useMemo(
    () =>
      QUALIFICATION_DEFS.map((def, i) => {
        const value = results[i]?.data ?? 0;
        return {
          ...def,
          value,
          // "All Leads" is the base, so it carries no share of itself.
          share: i === 0 || !total ? null : Math.round((value / total) * 100),
        };
      }),
    [results, total],
  );

  return {
    qualificationData,
    total,
    isLoading: results.some((r) => r.isLoading),
  };
};

/**
 * Per-status counts for the qualified breakdown drawer. Deferred behind
 * `enabled` so the six requests only fire when the drawer is opened.
 */
export const useQualifiedBreakdown = ({ filters, stages, enabled = false }) => {
  const baseWhere = useMemo(() => buildBaseWhere(filters), [filters]);

  const queries = useMemo(
    () =>
      stages.map((stage) => {
        const where = [
          ...baseWhere,
          { type: "equals", attribute: "status", value: stage.status },
        ];
        return {
          queryKey: ["qualified-breakdown", stage.status, where],
          queryFn: () => fetchLeadsCount(where),
          enabled,
          staleTime: 1000 * 60 * 2,
          gcTime: 1000 * 60 * 30,
          refetchOnWindowFocus: false,
          retry: 1,
        };
      }),
    [baseWhere, stages, enabled],
  );

  const results = useQueries({ queries });

  return {
    rows: stages.map((stage, i) => ({ ...stage, value: results[i]?.data ?? 0 })),
    isLoading: enabled && results.some((r) => r.isLoading),
  };
};

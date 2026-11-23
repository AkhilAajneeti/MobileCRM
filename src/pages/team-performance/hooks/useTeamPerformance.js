import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchWinRateDataset,
  readCachedDataset,
} from "../../reports/services/winRateService";
import {
  MIN_SAMPLE,
  hasStatusHistory,
  hasSiteVisitDone,
  isClosedWithoutReaching,
  isConnected,
  isEverQualified,
  isQualifiedThenDropped,
} from "../utils/qualification";

/**
 * Team Performance aggregation.
 *
 * Reuses the Reports dataset service rather than adding a second full-table
 * fetch: that service already pages the year's leads concurrently, dedupes
 * in-flight requests and persists to localStorage, so this report shares a
 * network round trip with the Win Rate and Funnel charts instead of doubling
 * the load on the gateway.
 *
 * All aggregation is a single pass over the records. The dataset can run to
 * thousands of leads, and the per-project index below needs the same pass, so
 * building both in one loop keeps this O(n) rather than O(n x projects).
 *
 * WHY THE FETCH IS NOT PAGED, even though the table is.
 *
 * Every number here is an aggregate over the whole period. Net Q% is a rep's
 * qualified leads over their connected leads; the qualification index is that
 * rate measured against the TEAM's rate on the same projects. Both need every
 * lead in the window counted before either can be stated.
 *
 * Fetch 20 leads at a time and the arithmetic quietly changes meaning: a rep
 * would be ranked on whichever slice happened to load, the team baseline would
 * shift with every page, and the ranking would reorder as you clicked. It would
 * render fine and be wrong — the worst failure mode in a report people make
 * staffing decisions from.
 *
 * So the load is reduced where it can be reduced honestly:
 *   - the period defaults to one MONTH, not a year (~12x fewer rows);
 *   - the select carries seven fields, not the full lead record;
 *   - pages after the first are fetched concurrently, capped at MAX_LEADS;
 *   - the result is cached in localStorage and shared with the Reports charts
 *     under the same query key, so a second view costs nothing.
 *
 * The table itself paginates at 20 rows, which is what pagination can safely
 * do here: it limits what is RENDERED, not what is counted.
 *
 * Paging the fetch becomes correct only when the backend can aggregate — the
 * spec's daily summary table (date, project, source, rep). Then this page asks
 * for a handful of pre-computed rows instead of every lead.
 */
export const useTeamPerformance = ({
  filters = {},
  year,
  enabled = true,
}) => {
  const { data, isLoading, isFetching, isError } = useQuery({
    // Same key PREFIX as the Reports charts on purpose: when the filters and
    // year match, this page and the funnel / win-rate charts resolve to one
    // cache entry and one network request instead of two.
    queryKey: ["win-rate-dataset", filters, year],
    queryFn: () => fetchWinRateDataset({ filters, year }),

    // Lets the page hold the request while a team selection resolves to user
    // ids. Without it the first render would pull every lead unscoped.
    enabled,

    // Paint instantly from the localStorage snapshot, then revalidate.
    //
    // initialDataUpdatedAt: 0 is load-bearing, not boilerplate. Without it
    // React Query stamps the seeded data as fetched NOW, so a snapshot written
    // yesterday counts as fresh for the whole staleTime and the page never
    // refetches on mount — you would be reading last night's numbers with no
    // indication of it. Zero marks it infinitely stale: the cached rows show
    // immediately, and a background refresh starts in the same tick.
    initialData: () => readCachedDataset(filters, year)?.list ?? undefined,
    initialDataUpdatedAt: 0,

    // Keeps the previous rows on screen while a new year or project loads,
    // rather than collapsing the table to its empty state.
    placeholderData: (previous) => previous,

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,

    // Silent hourly refresh, matching the Reports charts. Lead status changes
    // through the day, and this page is one people leave open.
    refetchInterval: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const result = useMemo(() => {
    const records = Array.isArray(data) ? data : [];

    // Per-rep accumulators, plus the per-(rep, project) splits the qualification
    // index needs.
    const byRep = new Map();
    // project -> { connected, qualified } across the WHOLE team
    const teamByProject = new Map();

    const projectOf = (lead) =>
      lead?.cProject || lead?.cProjectName || "Unassigned project";

    for (const lead of records) {
      const repId = lead?.assignedUserId || "unassigned";
      const project = projectOf(lead);

      let rep = byRep.get(repId);
      if (!rep) {
        rep = {
          id: repId,
          name: lead?.assignedUserName || "Unassigned",
          leads: 0,
          connected: 0,
          everQualified: 0,
          qualifiedThenDropped: 0,
          closedWithoutReaching: 0,
          siteVisitsDone: 0,
          // project -> { connected, qualified } for this rep only
          byProject: new Map(),
        };
        byRep.set(repId, rep);
      }

      const connected = isConnected(lead);
      const qualified = isEverQualified(lead);

      rep.leads += 1;
      if (connected) rep.connected += 1;
      if (qualified) rep.everQualified += 1;
      if (isQualifiedThenDropped(lead)) rep.qualifiedThenDropped += 1;
      if (isClosedWithoutReaching(lead)) rep.closedWithoutReaching += 1;
      if (hasSiteVisitDone(lead)) rep.siteVisitsDone += 1;

      let repProject = rep.byProject.get(project);
      if (!repProject) {
        repProject = { connected: 0, qualified: 0 };
        rep.byProject.set(project, repProject);
      }
      if (connected) repProject.connected += 1;
      if (qualified) repProject.qualified += 1;

      let teamProject = teamByProject.get(project);
      if (!teamProject) {
        teamProject = { connected: 0, qualified: 0 };
        teamByProject.set(project, teamProject);
      }
      if (connected) teamProject.connected += 1;
      if (qualified) teamProject.qualified += 1;
    }

    const rows = [...byRep.values()].map((rep) => {
      const grossQ = rep.leads ? (rep.everQualified / rep.leads) * 100 : 0;
      const netQ = rep.connected ? (rep.everQualified / rep.connected) * 100 : 0;
      const contact = rep.leads ? (rep.connected / rep.leads) * 100 : 0;

      // QUALIFICATION INDEX — the column that makes the ranking fair.
      //
      // A flat Net Q% comparison punishes whoever is working the harder
      // project. So instead of comparing a rep to the team average, compare
      // them to what the TEAM achieves on the very same mix of projects:
      //
      //   expected = sum over projects of (rep's connected leads in that
      //              project x the team's Net Q% in that project)
      //   index    = rep's actual qualified / expected
      //
      // 1.2 means 20% better than peers on the same kind of leads. A rep who
      // only ever works an easy project gets no free lift, because their
      // expectation is raised by that project's own team rate.
      let expected = 0;
      for (const [project, repStats] of rep.byProject) {
        const teamStats = teamByProject.get(project);
        if (!teamStats || !teamStats.connected) continue;
        expected += repStats.connected * (teamStats.qualified / teamStats.connected);
      }
      const index = expected > 0 ? rep.everQualified / expected : null;

      return {
        ...rep,
        grossQ,
        netQ,
        contact,
        index,
        // The spec's fairness rule: below the minimum sample a rep is shown but
        // NOT ranked, because a percentage on a handful of leads is noise.
        lowSample: rep.leads < MIN_SAMPLE,
      };
    });

    // Ranked reps first, best index down; low-sample reps always last, so the
    // top of the table is only ever people with a real base.
    rows.sort((a, b) => {
      if (a.lowSample !== b.lowSample) return a.lowSample ? 1 : -1;
      return (b.index ?? -1) - (a.index ?? -1);
    });

    const totals = rows.reduce(
      (acc, r) => ({
        leads: acc.leads + r.leads,
        connected: acc.connected + r.connected,
        everQualified: acc.everQualified + r.everQualified,
        qualifiedThenDropped: acc.qualifiedThenDropped + r.qualifiedThenDropped,
        closedWithoutReaching:
          acc.closedWithoutReaching + r.closedWithoutReaching,
        siteVisitsDone: acc.siteVisitsDone + r.siteVisitsDone,
      }),
      {
        leads: 0,
        connected: 0,
        everQualified: 0,
        qualifiedThenDropped: 0,
        closedWithoutReaching: 0,
        siteVisitsDone: 0,
      },
    );

    return {
      rows,
      totals,
      // Drives the warning banner. Without history every "ever" metric quietly
      // degrades to "currently", which is the exact flaw this report fixes.
      historyAvailable: hasStatusHistory(records),
      recordCount: records.length,
    };
  }, [data]);

  return { ...result, isLoading, isFetching, isError };
};

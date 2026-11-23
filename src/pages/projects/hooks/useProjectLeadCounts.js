/**
 * Lead counts for the campaigns screen — the four KPI values and the two
 * numbers on each project card.
 *
 * Lead-to-project matching lives in `utils/leadScope.js` -- the label is
 * spread across `cProject`, `cProjectName` and `cProjectNomen`
 * inconsistently, so it cannot be a single `equals`. Counts are cached by
 * `fetchLeadsCount` (memory + localStorage, 10 min) so paging back and
 * forth does not re-hit the gateway.
 */
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { fetchLeadsCount } from "services/leads.service";
import { projectLeadFilter, projectsLeadScope } from "../utils/leadScope";

/**
 * Identity for the query key. The FILTER itself comes from
 * `projectLeadFilter`, not from this -- matching on `cProject equals name`
 * alone returned zero for most projects, because `cProject` holds the messy
 * value while the clean label lives in `cProjectNomen`.
 */
const projectKey = (project) =>
  project?.id || project?.name || project?.projectNomen;

/** Per-project total and today counts, for the cards. */
export const useProjectLeadCounts = (projects = [], enabled = true) => {
  // Keep the project objects, not just their names: the scope condition
  // reads projectNomen / clientNomen / name together.
  const scoped = useMemo(
    () =>
      projects
        .filter((project) => projectKey(project))
        .map((project) => ({ key: projectKey(project), project })),
    [projects],
  );

  const queries = useMemo(
    () =>
      scoped.flatMap(({ key, project }) => [
        {
          queryKey: ["project-leads-total", key],
          queryFn: () => fetchLeadsCount(projectLeadFilter(project)),
          enabled,
          staleTime: 1000 * 60 * 5,
          retry: 1,
        },
        {
          queryKey: ["project-leads-today", key],
          queryFn: () =>
            fetchLeadsCount([
              ...projectLeadFilter(project),
              { type: "today", attribute: "createdAt" },
            ]),
          enabled,
          staleTime: 1000 * 60 * 5,
          retry: 1,
        },
      ]),
    [scoped, enabled],
  );

  const results = useQueries({ queries });

  /** Keyed by project id so the card can look its own numbers up. */
  const leadCounts = useMemo(() => {
    const map = {};
    // Indexed against `scoped`, not `projects`: a project with no usable key
    // has no queries, so walking `projects` would shift every pair by one.
    scoped.forEach(({ project }, i) => {
      const total = results[i * 2];
      const today = results[i * 2 + 1];
      // Left undefined while unresolved, so the card shows an em dash
      // rather than a misleading zero.
      if (total?.data == null && today?.data == null) return;
      map[project.id] = { total: total?.data ?? 0, today: today?.data ?? 0 };
    });
    return map;
  }, [scoped, results]);

  return { leadCounts };
};

/**
 * The four KPI values.
 *
 * The three lead-based numbers follow the campaign filter (spec 4.3). Two
 * cases look identical from an empty project array and are not:
 *
 *   - no filter active   -> no scope at all, count company-wide
 *   - filter matched zero campaigns -> match NOTHING, show 0
 *
 * The second is encoded as an impossible condition rather than falling
 * through to no scope, because without it filtering down to zero campaigns
 * showed the whole-company total, which reads as a filter that did nothing.
 *
 * `scopeProjects` must be EVERY filtered campaign, not just the page on
 * screen -- scoping from one page under-counts the moment a filter matches
 * more than a page.
 */
const NO_MATCH = [{ type: "equals", attribute: "id", value: "__no_projects__" }];

export const useProjectKpis = (
  projectCount,
  { scopeProjects = null, isFiltered = false } = {},
) => {
  const scope = useMemo(() => {
    if (!isFiltered) return [];
    return projectsLeadScope(scopeProjects || []) || NO_MATCH;
  }, [isFiltered, scopeProjects]);

  // The scope goes in every query key, so the counts refetch when the filter
  // changes. Static keys would never refetch at all.
  const scopeKey = JSON.stringify(scope);

  const totalLeads = useQuery({
    queryKey: ["campaign-kpi-total-leads", scopeKey],
    queryFn: () => fetchLeadsCount(scope),
    staleTime: 1000 * 60 * 5,
  });

  const leadsToday = useQuery({
    queryKey: ["campaign-kpi-leads-today", scopeKey],
    queryFn: () =>
      fetchLeadsCount([...scope, { type: "today", attribute: "createdAt" }]),
    staleTime: 1000 * 60 * 5,
  });

  const unassigned = useQuery({
    queryKey: ["campaign-kpi-unassigned", scopeKey],
    queryFn: () =>
      fetchLeadsCount([
        ...scope,
        { type: "isNull", attribute: "assignedUserId" },
      ]),
    staleTime: 1000 * 60 * 5,
  });

  return {
    projects: projectCount,
    leadsToday: leadsToday.data,
    unassigned: unassigned.data,
    totalLeads: totalLeads.data,
  };
};

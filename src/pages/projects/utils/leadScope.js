/**
 * Lead ↔ campaign matching — the single source of truth.
 *
 * The linkage is inconsistent: some leads carry the clean label in
 * `cProjectNomen` (with a messy `cProject`), others have it in `cProject`
 * (with a null `cProjectNomen`). So we match EITHER — `cProjectNomen` equals OR
 * `cProject` contains the projectNomen. For a "Default" projectNomen (no real
 * per-campaign label) we scope by `cClientNomen` (client-level) instead.
 *
 * This lived inline in ProjectCard while the KPI row counted leads globally,
 * which is exactly how the two ended up disagreeing (cards showing 103 leads
 * under a "7743 Total Leads" KPI). Both now build their filters from here, so
 * the row and the cards can never drift apart again.
 */

/**
 * The ESPO condition that matches one campaign's leads.
 * Returns a single condition object (not an array) so it can be composed into
 * a larger `or` group across many campaigns.
 */
export const projectLeadCondition = (project = {}) => {
  const hasNomen = project.projectNomen && project.projectNomen !== "Default";

  if (hasNomen) {
    return {
      type: "or",
      value: [
        {
          type: "equals",
          attribute: "cProjectNomen",
          value: project.projectNomen,
        },
        {
          type: "contains",
          attribute: "cProject",
          value: project.projectNomen,
        },
      ],
    };
  }

  if (project.clientNomen) {
    return {
      type: "equals",
      attribute: "cClientNomen",
      value: project.clientNomen,
    };
  }

  return { type: "contains", attribute: "cProject", value: project.name };
};

/** whereGroup (array form) for a single campaign — what ProjectCard counts on. */
export const projectLeadFilter = (project = {}) => [
  projectLeadCondition(project),
];

/**
 * whereGroup that matches the leads of ANY campaign in `projects`.
 *
 * Uses one `or` group rather than summing per-campaign counts, so a lead that
 * matches two campaigns is counted once instead of twice.
 *
 * Returns `null` when there is nothing to scope by — callers treat that as
 * "no campaign scope" (count everything). Note the difference from an EMPTY
 * project list, which callers must handle as "match nothing": a filter that
 * matched zero campaigns should show 0 leads, not all of them.
 */
export const projectsLeadScope = (projects = []) => {
  const conditions = (projects || []).map(projectLeadCondition).filter(Boolean);
  if (conditions.length === 0) return null;
  if (conditions.length === 1) return [conditions[0]];
  return [{ type: "or", value: conditions }];
};

/**
 * The leads-filter match for ONE project — exact, and deliberately narrow.
 *
 * Separate from `projectLeadCondition` above, which campaign counting uses and
 * which is built on `contains` for tolerance. Tolerance is exactly wrong for
 * the Leads page filter: `cProject CONTAINS "MigsunRohini"` also returns every
 * "MigsunRohiniCentral" lead, and a rep filtering to one project wants that one
 * project.
 *
 * Two unknowns are covered by brute force instead of assumption:
 *   - WHICH TOKEN identifies the project on a lead — its short `projectNomen`
 *     ("MigsunRohini") or its full `name` ("ShubhamShakyaPropshopMigsunRohini").
 *   - WHICH FIELD holds it — leads spread the label across `cProject`,
 *     `cProjectName` and `cProjectNomen` inconsistently (the table renders
 *     whichever is populated, which is why the column can look right while a
 *     filter on one field finds nothing).
 * Every token × field pair is OR'd as an exact `equals`. Exact matching means
 * the extra arms cost recall nothing and can't reintroduce prefix bleed:
 * `equals "MigsunRohini"` never matches "MigsunRohiniCentral".
 *
 * `equals` is also the one operator this codebase already relies on everywhere
 * — an earlier attempt here used `notContains` / `isEmpty`, which Espo is only
 * ever asked for as date filters in this app, and the whole query failed.
 */
const PROJECT_LEAD_ATTRIBUTES = ["cProject", "cProjectName", "cProjectNomen"];

export const projectExactLeadCondition = (project = {}) => {
  const tokens = [];
  const seen = new Set();
  for (const raw of [project.projectNomen, project.name]) {
    const token = (raw || "").trim();
    if (!token || token === "Default") continue;
    const key = token.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(token);
  }
  if (tokens.length === 0) return null;

  const value = tokens.flatMap((token) =>
    PROJECT_LEAD_ATTRIBUTES.map((attribute) => ({
      type: "equals",
      attribute,
      value: token,
    })),
  );

  // A single clause doesn't need the `or` wrapper around it.
  return value.length === 1 ? value[0] : { type: "or", value };
};

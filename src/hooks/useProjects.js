// hooks/useProjects.js
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProjects, fetchProjectsById } from "services/projects.service";

export const useProjects = ({
  limit = 10,
  page = 1,
  filters = {},
  orderBy = "createdAt",
  order = "desc",
  // The campaigns page fetches the filtered set a second time, unpaginated,
  // purely to scope the KPI counts; that fetch is skipped when no filter is
  // active. Defaults to true so every existing caller is unaffected.
  enabled = true,
}) => {
  return useQuery({
    queryKey: ["projects", limit, page, filters, orderBy, order],
    queryFn: () => fetchProjects({ limit, page, filters, orderBy, order }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
};

export const useProject = (id, enabled) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProjectsById(id),
    enabled,
  });
};


// ---------------------------------------------------------------------------
// Project options — the canonical project list, shaped for a <Select>.
// ---------------------------------------------------------------------------
//
// Why a dedicated hook instead of deriving the list from the leads on screen:
// the Leads table is server-paginated (20 rows/page), so the browser only ever
// holds one page of leads. Distinct `cProject` values harvested from those rows
// would change on every page flip and would never contain the project the rep
// is actually looking for. CProjects is the canonical list, and one request
// covers all of it.
//
// Cheap by design:
//   - localStorage seed (`initialData`) so a reload paints the dropdown with
//     zero network wait;
//   - `initialDataUpdatedAt: 0` marks that seed stale so React Query refreshes
//     it in the background — the rep never sees a stale project list;
//   - 30-min `staleTime`, so navigating around the app doesn't refetch.

// v2 — the cached shape now carries projectNomen for the short display label.
// v3: the cached shape gained whatsappTemplate. The key MUST move with the
// shape — a v2 entry deserialises fine and simply has no template, which
// would silently send every WhatsApp message blank.
const PROJECT_OPTIONS_CACHE_KEY = "project_options_v3";
// Deliberately long. The cached copy is only ever used to PAINT instantly; it's
// marked stale on read (initialDataUpdatedAt: 0 below), so React Query refreshes
// it in the background every session regardless. A long TTL therefore can't
// serve a stale list — it just means the instant paint keeps working for a rep
// who hasn't opened the CRM in a while.
const PROJECT_OPTIONS_TTL = 1000 * 60 * 60 * 24 * 30; // 30 days

// Espo caps `maxSize` per request, so page through rather than asking for
// everything at once. In practice this is a single round trip.
const PROJECT_PAGE_SIZE = 200;
const PROJECT_MAX = 2000;

/**
 * Drop the cached project list after a project is created or edited.
 *
 * Both halves matter. Invalidating the query alone leaves the localStorage
 * blob behind, and that blob is what seeds the next page load — so an edited
 * WhatsApp template would keep being sent by anyone who reloads, for up to the
 * 30-day TTL, with nothing on screen saying the pitch is out of date.
 */
export const invalidateProjectOptions = (queryClient) => {
  try {
    localStorage.removeItem(PROJECT_OPTIONS_CACHE_KEY);
  } catch {
    // disabled storage — the query invalidation below still refreshes it.
  }
  queryClient?.invalidateQueries({ queryKey: ["project-options"] });
};

const readCachedProjectOptions = () => {
  try {
    const raw = localStorage.getItem(PROJECT_OPTIONS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !Array.isArray(parsed.list)) return null;
    if (Date.now() - parsed.timestamp > PROJECT_OPTIONS_TTL) {
      localStorage.removeItem(PROJECT_OPTIONS_CACHE_KEY);
      return null;
    }
    return parsed.list;
  } catch {
    return null;
  }
};

const writeCachedProjectOptions = (list) => {
  try {
    localStorage.setItem(
      PROJECT_OPTIONS_CACHE_KEY,
      JSON.stringify({ list, timestamp: Date.now() }),
    );
  } catch {
    // quota / disabled — the hook still works, it just refetches each session.
  }
};

export const useProjectOptions = ({ enabled = true } = {}) => {
  const query = useQuery({
    queryKey: ["project-options"],
    queryFn: async () => {
      const all = [];
      for (let page = 1; all.length < PROJECT_MAX; page += 1) {
        const res = await fetchProjects({
          page,
          limit: PROJECT_PAGE_SIZE,
          orderBy: "name",
          order: "asc",
        });
        const list = res?.list || [];
        // Keep only the fields the filter needs — the cached blob stays small
        // and doesn't go stale against unrelated project edits.
        all.push(
          ...list.map((p) => ({
            id: p?.id,
            name: p?.name,
            projectNomen: p?.projectNomen,
            clientNomen: p?.clientNomen,
            // Carried so the lead drawer can prefill a WhatsApp message from
            // the project's template. This list is already fetched and cached
            // for the Leads project filter, so the lookup costs nothing — the
            // alternative was fetching the project again per lead opened.
            whatsappTemplate: p?.whatsappTemplate,
          })),
        );
        if (list.length < PROJECT_PAGE_SIZE) break;
      }
      writeCachedProjectOptions(all);
      return all;
    },
    enabled,
    initialData: () => readCachedProjectOptions() ?? undefined,
    // 0 = treat the localStorage seed as immediately stale so React Query
    // fires a background refresh behind the instantly-painted list.
    initialDataUpdatedAt: 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // `value` stays the project NAME because it's the one field guaranteed
  // unique, and it keeps the filter value a plain string end to end (the pill,
  // the sessionStorage persistence and the free-text fallback in the service
  // all work on it untouched). The full record rides along in `project` for the
  // caller to stash as `cProjectRef`.
  //
  // The LABEL is the short `projectNomen` — the same name the leads table and
  // the analytics chart show. The dropdown used to display the full
  // concatenated name ("ShubhamShakyaPropshopMigsunRohiniCentral") while every
  // other screen said "MigsunRohiniCentral", so a rep had to learn a second
  // vocabulary just to use the filter. The full name drops to `subLabel`, which
  // keeps two similarly-named projects distinguishable and stays searchable.
  const options = useMemo(() => {
    const seen = new Set();
    return (query.data || [])
      .map((p) => ({
        ...p,
        name: (p?.name || "").trim(),
        projectNomen: (p?.projectNomen || "").trim(),
      }))
      .filter((p) => {
        if (!p.name) return false;
        const key = p.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => {
        // "Default" is a placeholder nomen, not a real short name — fall back
        // to the full name for those, same as ProjectCard does.
        const short =
          p.projectNomen && p.projectNomen !== "Default" ? p.projectNomen : p.name;
        return {
          value: p.name,
          label: short,
          // Only worth a second line when it actually says something new.
          subLabel: short === p.name ? undefined : p.name,
          project: p,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [query.data]);

  return { options, isLoading: query.isLoading && !query.data };
};

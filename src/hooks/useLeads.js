import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchLeads, fetchLeadsCount, fetchNewLeads } from "services/leads.service"

// `= {}` so `useLeads()` with no argument does not throw while destructuring.
// The sales-team page calls it that way and the whole page crashed on render.
export const useLeads = ({ limit, page } = {}) => {
    return useQuery({
        queryKey: ["leads", limit, page],
        queryFn: () => fetchLeads({ limit, page }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,

        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    })
}

/**
 * `enabled` lets a caller defer a count until it is actually needed — the
 * dashboard's qualified-breakdown drawer uses it so its six per-status
 * counts only fire when the drawer is opened, not on every dashboard load.
 * Defaults to true, so existing callers are unaffected.
 */
export const useLeadsCount = (filters, enabled = true) => {
    return useQuery({
        queryKey: ["leads-count", filters], // 🔥 important for caching
        queryFn: () => fetchLeadsCount(filters),
        enabled,
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5, // cache 5 min
        cacheTime: 1000 * 60 * 30, // keep in memory 30 min
    });
};
export const useNewLeads = ({ limit, page, filters }) => {
    return useQuery({
        queryKey: ["leads", limit, page, filters],
        queryFn: () => fetchNewLeads({ limit, page, filters }),
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    })
}

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { fetchLeads, fetchLeadsCount, fetchNewLeads } from "services/leads.service"

export const useLeads = ({ limit, page }) => {
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

export const useLeadsCount = (filters) => {
    return useQuery({
        queryKey: ["leads-count", filters], // 🔥 important for caching
        queryFn: () => fetchLeadsCount(filters),
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

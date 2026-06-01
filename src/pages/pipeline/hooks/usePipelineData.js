/**
 * usePipelineData
 *
 * Owns the server side of the pipeline: fetches leads through the cached,
 * deduped pipeline service, layers the store's optimistic patches / deletes
 * on top, then normalizes + classifies them into enriched deals.
 *
 * React Query gives us a second caching/dedup layer plus background refresh.
 */
import { useCallback, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchPipelineLeads,
  invalidatePipelineCache,
} from "../services/pipelineService";
import { buildPipelineDeals } from "../utils/pipelineHelpers";
import { usePipelineStore } from "../store/pipelineStore";
import {
  PIPELINE_QUERY_KEY,
  PIPELINE_STALE_TIME,
  PIPELINE_GC_TIME,
  PIPELINE_PAGE_SIZE,
} from "../utils/pipelineConstants";

export const usePipelineData = ({ page = 1, limit = PIPELINE_PAGE_SIZE } = {}) => {
  const query = useQuery({
    queryKey: [PIPELINE_QUERY_KEY, page, limit],
    queryFn: () => fetchPipelineLeads({ page, limit }),
    placeholderData: keepPreviousData,
    staleTime: PIPELINE_STALE_TIME,
    gcTime: PIPELINE_GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const { optimisticPatches, removedIds } = usePipelineStore();

  // Apply optimistic state, then normalize + classify. Memoized so the heavy
  // work only re-runs when the data or the optimistic layer actually changes.
  const deals = useMemo(() => {
    const list = query.data?.list || [];
    if (!list.length) return [];

    const removed = new Set(removedIds);
    const patched = list
      .filter((lead) => !removed.has(lead.id))
      .map((lead) =>
        optimisticPatches[lead.id]
          ? { ...lead, ...optimisticPatches[lead.id] }
          : lead,
      );

    return buildPipelineDeals(patched);
  }, [query.data, optimisticPatches, removedIds]);

  // An explicit refetch must bypass the service-level TTL cache, otherwise the
  // dashboard alert / pipeline Refresh would re-render the same stale data on
  // every visit. Clear the cache first, then let React Query re-hit the network.
  const refetch = useCallback(() => {
    invalidatePipelineCache();
    return query.refetch();
  }, [query]);

  return {
    deals,
    total: query.data?.total || 0,
    hasMore: query.data?.hasMore || false,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch,
  };
};

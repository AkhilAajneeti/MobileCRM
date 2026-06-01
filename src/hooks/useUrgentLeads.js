/**
 * useUrgentLeads
 *
 * Shared hook that returns just the urgent slice of the pipeline:
 *   { overdue: [...], dueToday: [...], total: number }
 *
 * Both the Dashboard summary alert and the Header notification dropdown
 * consume this. Because it leans on `usePipelineData` under the hood (same
 * React Query key), there is exactly ONE network fetch powering both
 * surfaces — and once the user visits the Pipeline page or either consumer
 * mounts, the other one renders from cache.
 */
import { useMemo } from "react";
import { usePipelineData } from "../pages/pipeline/hooks/usePipelineData";
import { PIPELINE_CATEGORIES } from "../pages/pipeline/utils/pipelineConstants";

export const useUrgentLeads = () => {
  const { deals, isLoading, isFetching, refetch } = usePipelineData();

  const urgent = useMemo(() => {
    const overdue = [];
    const dueToday = [];
    for (const d of deals || []) {
      if (d.category === PIPELINE_CATEGORIES.OVERDUE) overdue.push(d);
      else if (d.category === PIPELINE_CATEGORIES.DUE_TODAY) dueToday.push(d);
    }
    return { overdue, dueToday, total: overdue.length + dueToday.length };
  }, [deals]);

  // `refetch` is passed through so the Dashboard alert (and any other consumer)
  // can force a fresh pipeline fetch on visit instead of waiting for staleTime.
  return { ...urgent, isLoading, isFetching, refetch };
};

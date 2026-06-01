/**
 * usePipelineFilters
 *
 * Reads the filter selections from the pipeline store, applies them to the
 * enriched deals and re-groups the result into kanban columns. Both the
 * filtering and the grouping are memoized so columns only recompute when the
 * deals or the filters change.
 */
import { useMemo, useCallback } from "react";
import { pipelineStore, usePipelineStore } from "../store/pipelineStore";
import {
  applyFilters,
  groupDealsByCategory,
  countActiveFilters,
} from "../utils/pipelineHelpers";

export const usePipelineFilters = (deals = []) => {
  const { filters } = usePipelineStore();

  const filteredDeals = useMemo(
    () => applyFilters(deals, filters),
    [deals, filters],
  );

  const groupedDeals = useMemo(
    () => groupDealsByCategory(filteredDeals),
    [filteredDeals],
  );

  const activeFilterCount = useMemo(
    () => countActiveFilters(filters),
    [filters],
  );

  const setFilter = useCallback(
    (key, value) => pipelineStore.setFilter(key, value),
    [],
  );
  const setFilters = useCallback(
    (next) => pipelineStore.setFilters(next),
    [],
  );
  const resetFilters = useCallback(() => pipelineStore.resetFilters(), []);

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    filteredDeals,
    groupedDeals,
    activeFilterCount,
  };
};

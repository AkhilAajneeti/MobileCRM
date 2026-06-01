/**
 * Lightweight, self-contained store for pipeline UI state.
 *
 * Intentionally NOT wired into the global Redux store - the pipeline module
 * stays independent. It is a tiny observable backed by `useSyncExternalStore`,
 * holding only client-side concerns:
 *  - the filter bar selections
 *  - optimistic patches applied to leads while a mutation is in flight
 *  - ids removed optimistically (pending delete)
 *
 * Server data itself lives in React Query - this store never caches leads.
 */
import { useSyncExternalStore } from "react";
import { DEFAULT_FILTERS } from "../utils/pipelineConstants";

let state = {
  filters: { ...DEFAULT_FILTERS },
  optimisticPatches: {}, // { [leadId]: Partial<rawLead> }
  removedIds: [], // leadIds hidden pending a delete
};

const listeners = new Set();

const emit = () => {
  listeners.forEach((listener) => listener());
};

const setState = (partial) => {
  state = { ...state, ...partial };
  emit();
};

export const pipelineStore = {
  getState: () => state,

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // --- filters --------------------------------------------------------------
  setFilter: (key, value) =>
    setState({ filters: { ...state.filters, [key]: value } }),

  setFilters: (filters) => setState({ filters: { ...filters } }),

  resetFilters: () => setState({ filters: { ...DEFAULT_FILTERS } }),

  // --- optimistic patches ---------------------------------------------------
  applyPatch: (id, patch) =>
    setState({
      optimisticPatches: {
        ...state.optimisticPatches,
        [id]: { ...(state.optimisticPatches[id] || {}), ...patch },
      },
    }),

  clearPatch: (id) => {
    if (!state.optimisticPatches[id]) return;
    const next = { ...state.optimisticPatches };
    delete next[id];
    setState({ optimisticPatches: next });
  },

  // --- optimistic delete ----------------------------------------------------
  removeDeal: (id) => {
    if (state.removedIds.includes(id)) return;
    setState({ removedIds: [...state.removedIds, id] });
  },

  restoreDeal: (id) =>
    setState({
      removedIds: state.removedIds.filter((removedId) => removedId !== id),
    }),

  // --- housekeeping ---------------------------------------------------------
  clearOptimistic: () => setState({ optimisticPatches: {}, removedIds: [] }),
};

/**
 * Subscribe a component/hook to the whole store. The snapshot reference only
 * changes when `setState` runs, so consumers re-render only on real updates.
 */
export const usePipelineStore = () =>
  useSyncExternalStore(pipelineStore.subscribe, pipelineStore.getState);

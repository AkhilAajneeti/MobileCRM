/**
 * usePipelineActions
 *
 * All pipeline mutations live here so components stay presentation-only.
 * Every action is optimistic: the store updates instantly, the mutation
 * persists in the background, and the store rolls back on failure.
 *
 *  - moveDeal:   drag a card between date columns -> reschedules the follow-up
 *  - deleteDeal: remove a lead from the pipeline
 *
 * The three derived columns (Active / Stale / Budget Issue) are computed from
 * data, so dropping a card into them is rejected with an explanatory toast -
 * this is what guarantees a follow-up date is never silently lost.
 */
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  persistDealReschedule,
  deletePipelineDeal,
} from "../services/pipelineService";
import { pipelineStore } from "../store/pipelineStore";
import { toEspoDateTime, addDays } from "../utils/dateHelpers";
import {
  PIPELINE_CATEGORIES,
  PIPELINE_QUERY_KEY,
  PIPELINE_COLUMNS,
} from "../utils/pipelineConstants";

const { OVERDUE, DUE_TODAY, UPCOMING } = PIPELINE_CATEGORIES;

// Maps a droppable date-column to the follow-up date a card should get.
const RESCHEDULE_TARGETS = {
  [DUE_TODAY]: () => toEspoDateTime(new Date()),
  [UPCOMING]: () => toEspoDateTime(addDays(new Date(), 3)),
  [OVERDUE]: () => toEspoDateTime(addDays(new Date(), -1)),
};

const columnName = (categoryId) =>
  PIPELINE_COLUMNS.find((column) => column.id === categoryId)?.name ||
  categoryId;

export const usePipelineActions = () => {
  const queryClient = useQueryClient();

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: [PIPELINE_QUERY_KEY] }),
    [queryClient],
  );

  // --- reschedule (drag between date columns) -------------------------------
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, nextContactDate }) =>
      persistDealReschedule(id, nextContactDate),
    onError: (_error, variables) => {
      pipelineStore.clearPatch(variables.id); // roll back optimistic move
      toast.error("Couldn't update the follow-up. Reverted.");
    },
    onSuccess: () => {
      toast.success("Follow-up updated");
    },
    onSettled: () => {
      invalidate();
    },
  });

  // --- delete ---------------------------------------------------------------
  const deleteMutation = useMutation({
    mutationFn: (id) => deletePipelineDeal(id),
    onError: (_error, id) => {
      pipelineStore.restoreDeal(id); // un-hide on failure
      toast.error("Failed to delete the lead. Restored.");
    },
    onSuccess: () => {
      toast.success("Lead removed from pipeline");
    },
    onSettled: () => {
      invalidate();
    },
  });

  /**
   * Move a card to another column.
   * Date columns reschedule the follow-up; derived columns are read-only.
   */
  const moveDeal = useCallback(
    (dealId, toCategory) => {
      const resolveDate = RESCHEDULE_TARGETS[toCategory];

      if (!resolveDate) {
        toast(`"${columnName(toCategory)}" is auto-calculated from activity.`, {
          icon: "ℹ️",
        });
        return;
      }

      const nextContactDate = resolveDate();
      // Optimistic: patch the lead so it re-classifies into the new column.
      pipelineStore.applyPatch(dealId, {
        cNextContactAt: nextContactDate,
        cNextContact: nextContactDate,
      });
      rescheduleMutation.mutate({ id: dealId, nextContactDate });
    },
    [rescheduleMutation],
  );

  /** Optimistically remove a lead, then persist the delete. */
  const deleteDeal = useCallback(
    (dealId) => {
      pipelineStore.removeDeal(dealId);
      deleteMutation.mutate(dealId);
    },
    [deleteMutation],
  );

  return {
    moveDeal,
    deleteDeal,
    isMoving: rescheduleMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

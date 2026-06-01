/**
 * usePipelineStats
 *
 * Memoized summary counts (overdue / due today / upcoming / active / stale /
 * budget issue) plus totals. Drives both the top summary cards and the login
 * summary banner. The calculation itself lives in pipelineHelpers.
 */
import { useMemo } from "react";
import { computeStats } from "../utils/pipelineHelpers";

export const usePipelineStats = (deals = []) =>
  useMemo(() => computeStats(deals), [deals]);

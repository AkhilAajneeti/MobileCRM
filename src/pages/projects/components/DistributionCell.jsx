import React from "react";
import { getDistributionSummary } from "../utils/distributionModel";

/**
 * Distribution summary (spec 7.3).
 *
 * This exists for one reason: lead distribution used to live behind an
 * "Enable Configuration" checkbox inside a drawer tab, where nobody would
 * find it unless told. Putting the state on every row is the fix.
 *
 * It reads fields already on the row — no extra request — so the whole table
 * can show it for free. Shared by the desktop cell and the mobile card,
 * because the mobile card dropping it is exactly the regression the spec
 * calls out (7.5).
 */
const DistributionCell = ({ project }) => {
  const { hasMembers, isCustom, activeCount, pausedCount } =
    getDistributionSummary(project);

  if (!hasMembers) {
    return (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        Not set up
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
          isCustom
            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700"
        }`}
      >
        {isCustom ? "Custom" : "Round robin"}
      </span>

      <span className="ml-2 text-xs text-muted-foreground">
        {activeCount} {activeCount === 1 ? "member" : "members"}
      </span>

      {/* Paused is called out rather than folded into the count: no return
          date is stored, so nothing else reminds anyone to switch someone
          back on — a rep can sit paused for weeks on quietly falling
          numbers. */}
      {pausedCount > 0 && (
        <span className="ml-2 rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold text-orange-700">
          {pausedCount} paused
        </span>
      )}
    </span>
  );
};

export default DistributionCell;

import React, { useMemo } from "react";
import { cn } from "../../utils/cn";
import {
  QUICK_STATUS_ORDER,
  getStageColor,
  getStatusAccent,
  getStatusLabel,
} from "../../utils/statusTokens";

/**
 * The 44px status chip grid (spec 6, body > Status chips).
 *
 * Shared verbatim by the Quick Update bottom sheet and the detail view's
 * inline status editor (spec 6.3): they are two entry points to one
 * interaction and must be indistinguishable in styling. Only the
 * surrounding chrome differs, so that lives with each caller.
 */
const StatusChipGrid = ({ value, onChange, options, className = "" }) => {
  /**
   * Chip order is curated by how often a rep picks it, not alphabetical.
   * Any extra statuses the backend offers are appended so nothing the API
   * supports becomes unreachable.
   */
  const chips = useMemo(() => {
    const available = options?.length ? options : QUICK_STATUS_ORDER;
    const ordered = QUICK_STATUS_ORDER.filter((s) => available.includes(s));
    const extras = available.filter((s) => !QUICK_STATUS_ORDER.includes(s));
    return [...ordered, ...extras];
  }, [options]);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {chips.map((option) => {
        const isSelected = value === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange?.(option)}
            aria-pressed={isSelected}
            className={cn(
              "inline-flex min-h-[44px] items-center rounded-full border px-4 text-sm font-medium transition-all duration-150 active:scale-95",
              isSelected
                ? `${getStageColor(option)} shadow-sm ring-2 ring-offset-1 ring-offset-background`
                : "border-border bg-card text-muted-foreground"
            )}
            // The ring takes the status's own accent, never the brand
            // maroon -- otherwise it clashes with the chip it surrounds.
            style={isSelected ? { "--tw-ring-color": getStatusAccent(option) } : undefined}
          >
            {getStatusLabel(option)}
          </button>
        );
      })}
    </div>
  );
};

export default StatusChipGrid;

import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";
import {
  getSourceBadgeColor,
  getSourceLabel,
  getStageColor,
  getStatusLabel,
} from "../../utils/statusTokens";

/**
 * Status chip (spec 2.1). `size="card"` is the lead-card variant,
 * `size="pill"` the slightly larger detail-view variant.
 *
 * The QDTD -> "Qualify Due To Delay" label override applies in the detail
 * view only; the narrow card keeps the short code. Either way the colour
 * lookup uses the raw code.
 */
export const StatusBadge = ({ status, size = "card", className = "" }) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full font-medium",
      size === "card" ? "px-2.5 py-1 text-[10px]" : "px-2.5 py-0.5 text-xs",
      getStageColor(status),
      className
    )}
  >
    {size === "card" ? status || "—" : getStatusLabel(status)}
  </span>
);

/**
 * Source chip (spec 2.4). Takes the whole lead so it can apply the
 * cSubSource / "Aajneeti" label rule.
 */
export const SourceBadge = ({ lead, className = "" }) => {
  const label = getSourceLabel(lead);
  if (!label || label === "—") return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        getSourceBadgeColor(lead),
        className
      )}
    >
      <Icon name="Tag" size={10} />
      {label}
    </span>
  );
};

export default StatusBadge;

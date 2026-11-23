import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";
import FieldIcon from "./FieldIcon";

/**
 * Detail-view section card (spec 7.5): a bordered rounded-xl card with a
 * tinted header strip, holding a one-column grid of field rows (two columns
 * from `md`).
 */
export const SectionCard = ({ icon, title, singleColumn = false, children }) => (
  <div className="rounded-xl border border-border bg-card">
    <div className="flex items-center gap-2 rounded-t-xl border-b border-border bg-slate-50/60 px-5 py-3">
      <Icon name={icon} size={16} className="shrink-0 text-slate-500" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>

    <div
      className={cn(
        "grid grid-cols-1 gap-5 p-5",
        !singleColumn && "md:grid-cols-2"
      )}
    >
      {children}
    </div>
  </div>
);

/**
 * A single field: a gradient FieldIcon tile, then the label and value.
 */
export const FieldRow = ({ icon, tone, label, children }) => (
  <div className="group flex items-start gap-3">
    <FieldIcon name={icon} tone={tone} />
    <div className="min-w-0 flex-1">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  </div>
);

/** Empty value placeholder. */
export const Empty = () => (
  <span className="text-sm text-muted-foreground">None</span>
);

export default SectionCard;

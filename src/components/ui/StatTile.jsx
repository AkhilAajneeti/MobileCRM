import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";

/**
 * Compact stat tile (spec 8.4). Same visual language as the KPI card, every
 * accent derived from one hex.
 *
 * Zero stays grey: a tile showing 0 drops its accent entirely and only
 * lights up with real activity. Keeps a dashboard honest at a glance.
 */
const withAlpha = (hex, alpha) => {
  if (!hex || typeof hex !== "string" || !hex.startsWith("#")) return undefined;
  const value = hex.slice(1);
  const full =
    value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return undefined;
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
};

const StatTile = ({
  label,
  value,
  icon,
  accent = "#AC2334",
  selected = false,
  onClick,
  className = "",
}) => {
  const numeric = Number(value);
  const isZero = !value || (Number.isFinite(numeric) && numeric === 0);

  const Element = onClick ? "button" : "div";

  return (
    <Element
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border border-[rgba(20,20,30,0.07)] bg-card p-4 text-left shadow-kpi transition-all duration-300 ease-premium",
        onClick && "active:scale-[0.99]",
        className
      )}
      style={
        selected && !isZero
          ? { borderColor: accent, boxShadow: `0 0 0 1px ${accent}` }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 text-2xl font-bold leading-none tabular-nums",
              isZero ? "text-muted-foreground/50" : "text-card-foreground"
            )}
          >
            {value ?? 0}
          </p>
        </div>

        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
            isZero && "bg-muted"
          )}
          style={!isZero ? { backgroundColor: withAlpha(accent, 0.12) } : undefined}
        >
          <Icon
            name={icon}
            size={18}
            className={isZero ? "text-muted-foreground" : undefined}
            color={isZero ? undefined : accent}
          />
        </div>
      </div>
    </Element>
  );
};

export default StatTile;

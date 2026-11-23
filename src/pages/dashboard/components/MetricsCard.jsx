import React from "react";
import Icon from "../../../components/AppIcon";

/**
 * MetricsCard (spec 4.2) — the qualification row.
 *
 * Same premium language as the KPI card, but with a two-stop gradient icon
 * tile instead of a flat tint. Accents all derive from the `from` hex.
 *
 * One rule worth preserving: the lift and glow apply to EVERY card, so the
 * row reacts as one surface, but only a card with a handler gets
 * `cursor-pointer` and button semantics. Tying the hover treatment to
 * interactivity left three cards looking dead beside the fourth.
 */
const alpha = (hex, value) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${value})`;
};

const MetricsCard = ({
  title,
  value,
  share,
  description,
  icon,
  from,
  to,
  isLoading,
  isOpen,
  onToggle,
  // A chevron promises "this expands". A card that merely filters something
  // else must not show one, or it reads as a disclosure that never opens.
  expandable = false,
}) => {
  const isInteractive = Boolean(onToggle);
  const Element = isInteractive ? "button" : "div";

  return (
    <Element
      type={isInteractive ? "button" : undefined}
      onClick={onToggle}
      aria-expanded={isInteractive ? isOpen : undefined}
      style={{
        "--card-glow": alpha(from, 0.3),
        ...(isOpen ? { borderColor: from, boxShadow: `0 0 0 1.5px ${from}` } : null),
      }}
      className={`
        group relative h-full w-full overflow-hidden rounded-2xl border
        border-[rgba(20,20,30,0.07)] bg-card p-4 text-left sm:p-5
        shadow-kpi transition-all duration-300 ease-premium
        hover:-translate-y-1
        hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--card-glow)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        motion-reduce:transition-none motion-reduce:hover:translate-y-0
        ${isInteractive ? "cursor-pointer" : ""}
      `}
    >
      {/* Corner glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle, ${alpha(from, 0.22)}, transparent 70%)` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            title={title}
            className="truncate text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground"
          >
            {title}
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
              {isLoading ? "—" : Number(value || 0).toLocaleString("en-IN")}
            </span>

            {/* A bare 6,382 means nothing without "15% of all leads" beside it */}
            {!isLoading && share != null && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums text-muted-foreground">
                {share}%
              </span>
            )}
          </div>
        </div>

        {/* Gradient icon tile */}
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_10px_-2px_var(--card-glow)] transition-transform duration-300 ease-premium group-hover:scale-105 sm:h-11 sm:w-11"
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          <Icon name={icon} size={20} />
        </span>
      </div>

      {/* Description is desktop-only: the compact mobile tile has no room and
          the title carries the meaning on its own. */}
      {description && (
        <p className="relative mt-3 hidden items-center gap-1 text-[12px] text-muted-foreground sm:flex">
          <span className="min-w-0 flex-1">{description}</span>
          {expandable && (
            <Icon
              name={isOpen ? "ChevronUp" : "ChevronDown"}
              size={14}
              className="shrink-0"
            />
          )}
        </p>
      )}
    </Element>
  );
};

export default MetricsCard;

import React from "react";
import Icon from "../../../components/AppIcon";

/**
 * Today's Activity funnel (spec 8).
 *
 * Four "today" metrics presented as one funnel in journey order, so the row
 * reads as a progression toward a close rather than four unrelated tiles.
 * Colour runs cool -> warm -> green for the same reason.
 */

export const FUNNEL_STAGES = [
  { key: "meetings", label: "Meetings", icon: "Calendar", from: "#3B82F6", to: "#6366F1" },
  { key: "siteVisitsScheduled", label: "Visit Booked", icon: "CalendarCheck", from: "#06B6D4", to: "#0EA5E9" },
  { key: "visits", label: "Site Visits", icon: "MapPin", from: "#F59E0B", to: "#F97316" },
  { key: "purchased", label: "Purchased", icon: "BadgeCheck", from: "#10B981", to: "#059669" },
];

/** `#RRGGBB` + alpha -> `rgba(...)`. */
const alpha = (hex, value) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${value})`;
};

const StageTile = ({ stage, value, isSelected, onSelect }) => {
  // Zero stays grey: the funnel still reads as four stages, but the eye
  // lands on what actually happened today.
  const isZero = !value;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(stage.key)}
      style={{
        background: `linear-gradient(135deg, ${alpha(stage.from, 0.1)}, ${alpha(stage.to, 0.05)})`,
        "--stage-glow": alpha(stage.from, 0.3),
        "--stage-ring": stage.from,
        ...(isSelected ? { boxShadow: `0 0 0 1.5px ${stage.from}` } : null),
      }}
      className="group relative basis-[calc(50%-0.375rem)] overflow-hidden rounded-2xl border border-[rgba(20,20,30,0.06)] p-4 text-left transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-[0_16px_36px_-14px_var(--stage-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--stage-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:mx-1.5 md:flex-1 md:basis-0 md:first:ml-0 md:last:mr-0"
    >
      {/* Burst glow behind the icon */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-6 -top-6 h-24 w-24 rounded-full opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle, ${alpha(stage.from, 0.35)}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-[0_4px_10px_-2px_var(--stage-glow)] transition-transform duration-300 ease-premium group-hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${stage.from}, ${stage.to})`,
          }}
        >
          <Icon name={stage.icon} size={20} />
        </span>

        <span
          className={`text-3xl font-bold leading-none tracking-tight tabular-nums ${
            isZero ? "text-muted-foreground/50" : "text-foreground"
          }`}
        >
          {value ?? 0}
        </span>
      </div>

      <p className="relative mt-3 truncate text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
        {stage.label}
      </p>
    </button>
  );
};

const ActivityFunnel = ({ counts = {}, activeKey, onSelect }) => (
  <section className="rounded-2xl border border-[rgba(20,20,30,0.08)] bg-card p-4 shadow-kpi sm:p-5">
    <header className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
        Today's Activity
      </h2>
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
        Pipeline flow
      </span>
    </header>

    {/* Wraps 2x2 on mobile. The chevron connectors are desktop-only so they
        never count as wrap cells and break the tiling. */}
    <div className="flex flex-wrap items-stretch gap-3 md:flex-nowrap md:gap-0">
      {FUNNEL_STAGES.map((stage, index) => (
        <React.Fragment key={stage.key}>
          <StageTile
            stage={stage}
            value={counts[stage.key]}
            isSelected={activeKey === stage.key}
            onSelect={onSelect}
          />
          {index < FUNNEL_STAGES.length - 1 && (
            <span
              aria-hidden
              className="hidden shrink-0 items-center justify-center self-center text-muted-foreground/30 md:flex"
            >
              <Icon name="ChevronRight" size={18} />
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  </section>
);

export default ActivityFunnel;

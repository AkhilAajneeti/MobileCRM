import React from "react";
import Icon from "../../../components/AppIcon";
import { formatWeekendRange, getDayBadgeCopy } from "../utils/siteVisitHelpers";

/**
 * Weekend confirmation hero (spec 3).
 *
 * Answers one question before the user scrolls: how many of this weekend's
 * visits are locked in.
 */

/**
 * Progress ring (3.4). No animation — the dash offset is set directly and
 * does not sweep in. A zero total renders an empty ring reading 0/0, never
 * a division error and never a full ring.
 */
const ProgressRing = ({ done, total, size = 64, stroke = 6 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = total > 0 ? done / total : 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4ade80"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - fraction)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold">
        {done}/{total}
      </span>
    </div>
  );
};

const DayCard = ({ label, count, confirmed }) => (
  <div className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-center">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
      {label}
    </p>
    <p className="text-2xl font-bold leading-tight">{count}</p>
    {/* "Confirmed" means Visited. Aspirational wording for a panel read on
        a Friday — kept on purpose. */}
    <p className="text-[11px] text-white/60">{confirmed} confirmed</p>
  </div>
);

const WeekendHero = ({ saturday, sunday, done, total, pending, onStartCalls }) => (
  <section className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-[#7a1420] via-[#5a0f18] to-[#360a10] p-5 text-white shadow-lg sm:p-6">
    {/* Graph-paper grid. Inline rather than a utility class: the nested
        commas in the gradient values do not survive some class compilers.
        Kept at 8% — at 15% it starts to look like a spreadsheet. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "34px 34px",
      }}
    />

    {/* Meta row */}
    <div className="relative mb-5 flex flex-wrap items-center gap-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">
        This weekend · {formatWeekendRange()}
      </p>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        {getDayBadgeCopy()}
      </span>
    </div>

    {/* Stacked on mobile, two groups side by side from lg (spec 3.6) */}
    <div className="relative flex flex-col gap-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between lg:gap-6">
      <div className="flex items-center gap-3">
        <DayCard label="Sat" count={saturday.total} confirmed={saturday.done} />
        <DayCard label="Sun" count={sunday.total} confirmed={sunday.done} />
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing done={done} total={total} size={56} />
        <div className="min-w-0">
          <p className="font-semibold">Weekend confirmations</p>
          <p className="text-sm text-white/60">
            {done} of {total} visits locked in
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex items-center gap-2.5">
          <Icon name="AlertTriangle" size={18} className="shrink-0 text-amber-300" />
          {/* Chip text is the panel maroon, not white, so it reads as a cut-out */}
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-amber-400/90 px-1.5 text-xs font-bold text-[#5a0f18]">
            {pending}
          </span>
          <span className="text-white/85">still need confirming</span>
        </div>

        {/* Wired to filter the list down to what still needs confirming.
            On web this button had no handler; a prominent control that does
            nothing is worse on touch, where there is no hover to hint at it. */}
        <button
          type="button"
          onClick={onStartCalls}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#7a1420] transition-colors hover:bg-white/90 active:scale-[0.98] lg:w-auto"
        >
          <Icon name="Phone" size={15} />
          Start Friday calls
        </button>
      </div>
    </div>
  </section>
);

export default WeekendHero;

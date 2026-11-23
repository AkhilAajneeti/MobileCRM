import React from "react";
import Icon from "../../../components/AppIcon";

/**
 * KPI row (spec 4).
 *
 * Two columns on a phone — do not drop to one, the four numbers are meant to
 * be compared.
 *
 * 4.1 — one accent hex drives four values at fixed alphas. The same
 * derivation as the dashboard KPI cards and the Team Performance tiles, so
 * all three rows read as one system. Do not hand-pick tints per card.
 */
const withAlpha = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

const CARDS = [
  { key: "projects", label: "Projects", icon: "Layers", accent: "#8A1B29" },
  { key: "leadsToday", label: "Leads Today", icon: "UserPlus", accent: "#F59E0B" },
  {
    key: "unassigned",
    label: "Unassigned",
    icon: "AlertCircle",
    accent: "#EF4444",
    // The only sub-line on the row, and the only red text: unassigned leads
    // are what this screen exists to fix, so the row names the remedy rather
    // than just the count.
    sub: "Needs distribution",
  },
  { key: "totalLeads", label: "Total Leads", icon: "Users", accent: "#0D9488" },
];

const ProjectKpiRow = ({ values = {} }) => (
  <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
    {CARDS.map((card) => {
      const value = values[card.key];

      return (
        <div
          key={card.key}
          style={{
            "--kpi-glow": withAlpha(card.accent, 0.35),
            backgroundImage: `linear-gradient(135deg, ${withAlpha(card.accent, 0.06)} 0%, transparent 60%)`,
          }}
          className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,.04),0_2px_8px_rgba(16,24,40,.05)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--kpi-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle, ${withAlpha(card.accent, 0.22)}, transparent 70%)`,
            }}
          />

          {/* Icon above the number on a phone, beside it from sm */}
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <span
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 ease-premium group-hover:scale-105 sm:h-12 sm:w-12"
              style={{ backgroundColor: withAlpha(card.accent, 0.12) }}
            >
              <Icon name={card.icon} size={20} color={card.accent} />
            </span>

            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                {card.label}
              </p>
              {/* An em dash shows while a count is unresolved. */}
              <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground sm:text-3xl">
                {value == null ? "—" : Number(value).toLocaleString("en-IN")}
              </p>
              {card.sub && (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {card.sub}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default ProjectKpiRow;

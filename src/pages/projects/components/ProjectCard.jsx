import React from "react";
import Icon from "../../../components/AppIcon";

/**
 * Project card (spec 6).
 */

/**
 * 6.1 — six accent sets applied by card POSITION modulo 6. The accent is
 * rhythm for the grid, not identity: re-sorting or paging changes which
 * colour a project wears, and that is accepted. The avatar colours below
 * *are* identity.
 *
 * Exposed as CSS custom properties on the card root and consumed by the top
 * rule, the initials tile, the parent name, the momentum bar and the Open
 * button — five hard-coded copies of the same hex per card is how a palette
 * drifts.
 */
const ACCENTS = [
  { from: "#7E1524", to: "#B5533A", tint: "rgba(126,21,36,0.28)", glow: "rgba(126,21,36,0.22)" },
  { from: "#264F4A", to: "#5B9187", tint: "rgba(38,79,74,0.28)", glow: "rgba(38,79,74,0.22)" },
  { from: "#7A5A22", to: "#C79A4A", tint: "rgba(122,90,34,0.28)", glow: "rgba(122,90,34,0.22)" },
  { from: "#4A3550", to: "#8B6FA0", tint: "rgba(74,53,80,0.28)", glow: "rgba(74,53,80,0.22)" },
  { from: "#2C4A6E", to: "#6C93BE", tint: "rgba(44,74,110,0.28)", glow: "rgba(44,74,110,0.22)" },
  { from: "#5C6B2A", to: "#9CB05A", tint: "rgba(92,107,42,0.28)", glow: "rgba(92,107,42,0.22)" },
];

/**
 * 6.2 — five solid fills, chosen NOT to be the accent pairs so the team
 * reads as its own visual system rather than more card chrome. Sum-of-char
 * codes hash on the member name.
 */
const TEAM_PALETTE = ["#6E1420", "#0F766E", "#B45309", "#4338CA", "#BE123C"];

const teamColor = (name) => {
  const value = String(name || "");
  let sum = 0;
  for (let i = 0; i < value.length; i += 1) sum += value.charCodeAt(i);
  return TEAM_PALETTE[sum % TEAM_PALETTE.length];
};

const initials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

/**
 * 6.4 — run-together PascalCase and camelCase are split into words:
 * `GangaCounty` -> `Ganga County`. Not cosmetic polish — these labels arrive
 * run-together often enough that without it the card titles are unreadable.
 */
export const humanize = (value) =>
  String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

/** 6.5 — last-activity line. */
const activityLabel = (project) => {
  const raw = project?.modifiedAt || project?.createdAt;
  if (!raw) return "No activity";

  const date = new Date(String(raw).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "No activity";

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86400000,
  );

  if (days <= 0) return "Active today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const ProjectCard = ({ project, index, totalLeads, newToday, isLoading, onOpen }) => {
  const accent = ACCENTS[index % ACCENTS.length];

  // Title is projectNomen unless empty or the literal placeholder "Default".
  const rawTitle =
    project?.projectNomen && project.projectNomen !== "Default"
      ? project.projectNomen
      : project?.name;
  const title = humanize(rawTitle);

  // Subtitle is clientNomen when it differs from the title source, else the
  // literal string "Project".
  const rawSubtitle =
    project?.clientNomen && project.clientNomen !== rawTitle
      ? project.clientNomen
      : "Project";
  const subtitle = humanize(rawSubtitle);

  // "Active" means a lead landed today, nothing more — there is no status
  // field on the project. "Steady", not "Inactive": a campaign with no leads
  // today is warm but quiet.
  const isActive = (newToday || 0) > 0;

  const members = Object.values(project?.collaboratorsNames || {}).filter(Boolean);
  const uniqueMembers = [...new Set(members)];
  const shown = uniqueMembers.slice(0, 4);
  const overflow = uniqueMembers.length - shown.length;

  // 6.8 — momentum is the share of lifetime leads that arrived today. The
  // bar and the label disagree on purpose: momentum is naturally tiny on a
  // mature campaign, so the bar floors at 4% while the label prints truth.
  const momentum = totalLeads > 0 ? ((newToday || 0) / totalLeads) * 100 : 0;
  const momentumLabel =
    momentum === 0 ? "0" : momentum < 10 ? momentum.toFixed(1) : Math.round(momentum);
  const barWidth = momentum === 0 ? 0 : Math.max(4, momentum);

  const address = project?.address;
  const parentName = project?.parentName;

  return (
    <article
      style={{
        "--accent-from": accent.from,
        "--accent-to": accent.to,
        "--accent-tint": accent.tint,
        "--accent-glow": accent.glow,
      }}
      onClick={() => onOpen(project)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[rgba(20,20,30,0.08)] bg-card shadow-[0_1px_2px_rgba(16,24,40,.04),0_2px_6px_rgba(16,24,40,.05)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-[color:var(--accent-tint)] hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_18px_40px_-12px_var(--accent-glow)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span
        aria-hidden
        className="h-[3px] w-full bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)]"
      />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-gradient-to-br from-[color:var(--accent-from)] to-[color:var(--accent-to)] text-[13px] font-bold tracking-tight text-white shadow-[0_2px_6px_rgba(16,24,40,.12)]"
          >
            {initials(title)}
          </span>

          <div className="min-w-0 flex-1">
            <h3
              title={title}
              className="truncate text-[14.5px] font-bold leading-tight tracking-[-0.01em] text-foreground"
            >
              {title}
            </h3>
            <p
              title={subtitle}
              className="mt-0.5 truncate text-[11.5px] leading-tight text-muted-foreground"
            >
              {subtitle}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[10.5px] font-bold uppercase tracking-[0.06em] ${
                isActive
                  ? "border-emerald-600/20 bg-emerald-50 text-emerald-700"
                  : "border-slate-300/60 bg-slate-50 text-slate-500"
              }`}
            >
              <span className="relative grid h-1.5 w-1.5 place-items-center">
                {isActive && (
                  <span className="absolute h-full w-full rounded-full bg-emerald-500 animate-pulse-ring motion-reduce:hidden" />
                )}
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isActive ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
              </span>
              {isActive ? "Active" : "Steady"}
            </span>
            <span className="text-[10px] leading-none text-muted-foreground">
              {activityLabel(project)}
            </span>
          </div>
        </div>

        {/* 6.6 — omitted entirely when neither field is present. The negative
            top margin closes the gap the card body spacing would leave. */}
        {(address || parentName) && (
          <div className="-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {address && (
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="MapPin" size={11} className="shrink-0" />
                <span className="truncate">{address}</span>
              </span>
            )}
            {parentName && (
              <span className="truncate font-semibold text-[color:var(--accent-from)]">
                {parentName}
              </span>
            )}
          </div>
        )}

        {/* 6.7 Metrics panel */}
        <div className="rounded-[14px] border border-[rgba(20,20,30,0.07)] bg-gradient-to-b from-slate-50/80 to-white p-3.5">
          <dl className="flex items-stretch">
            <div className="flex-1 pr-3.5">
              <dt className="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
                Total Leads
              </dt>
              <dd className="mt-1 text-[22px] font-bold leading-none tracking-tight tabular-nums">
                {isLoading ? "—" : Number(totalLeads || 0).toLocaleString("en-IN")}
              </dd>
            </div>

            <div className="w-px shrink-0 bg-[rgba(20,20,30,0.08)]" />

            <div className="flex-1 pl-3.5">
              <dt className="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
                New Today
              </dt>
              <dd
                className={`mt-1 flex items-center gap-1 text-[22px] font-bold leading-none tracking-tight tabular-nums ${
                  isActive ? "text-emerald-600" : ""
                }`}
              >
                {isActive ? `+${newToday}` : 0}
                {isActive && (
                  <Icon name="TrendingUp" size={13} className="mb-px shrink-0" />
                )}
              </dd>
            </div>
          </dl>

          {/* 6.8 Momentum */}
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[9.5px] font-extrabold uppercase tracking-[0.09em] text-muted-foreground">
                Momentum
              </span>
              <span className="text-[10.5px] font-bold tabular-nums text-foreground">
                {momentumLabel}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={Math.round(momentum)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Momentum: ${Math.round(momentum)}% of leads arrived today`}
              className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[rgba(20,20,30,0.07)]"
            >
              <div
                style={{ width: `${barWidth}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] transition-[width] duration-700 ease-premium motion-reduce:transition-none"
              />
            </div>
          </div>
        </div>

        {/* 6.9 Footer */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          {uniqueMembers.length ? (
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex transition-transform duration-300 ease-premium group-hover:-translate-y-0.5">
                {shown.map((name) => (
                  <span
                    key={name}
                    title={name}
                    style={{ backgroundColor: teamColor(name) }}
                    className="-ml-2 grid h-7 w-7 place-items-center rounded-full text-[9.5px] font-bold text-white ring-2 ring-card first:ml-0"
                  >
                    {initials(name)}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="-ml-2 grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[9.5px] font-bold text-slate-600 ring-2 ring-card">
                    +{overflow}
                  </span>
                )}
              </div>
              <span className="truncate text-[10.5px] font-semibold text-muted-foreground">
                {uniqueMembers.length}{" "}
                {uniqueMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground">Unassigned</span>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(project);
            }}
            aria-label={`Open ${title}`}
            className="group/cta relative inline-flex min-h-[44px] shrink-0 items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] py-1.5 pl-4 pr-1.5 text-[12px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-6px_var(--accent-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-to)] focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-0"
          >
            Open
            <span className="relative grid h-5 w-5 place-items-center rounded-full bg-white/20 transition-transform duration-300 group-hover/cta:translate-x-0.5">
              <Icon name="ArrowRight" size={12} />
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProjectCard;

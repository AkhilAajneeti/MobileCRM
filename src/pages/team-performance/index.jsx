import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet";
import Icon from "../../components/AppIcon";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import TeamPerformanceTable from "./components/TeamPerformanceTable";
import Select from "../../components/ui/Select";
import Tooltip from "../../components/ui/Tooltip";
import { useTeams, useTeamUsers } from "hooks/useTeams";
import { useProjectOptions } from "hooks/useProjects";
import { useTeamPerformance } from "./hooks/useTeamPerformance";
import { MIN_SAMPLE } from "./utils/qualification";

/**
 * Team Performance — Report 2 of the CRM Reports Module spec.
 *
 * Ranks reps on how many of their CONNECTED leads they qualify, counting every
 * lead that was ever qualified rather than only those sitting in a qualifying
 * status today. See utils/qualification.js for the rule and where the history
 * comes from.
 *
 * Visible to the Owner role and to admins by type — see canSeeTeamPerformance
 * in utils/permission. Managers are excluded on purpose: this is a review of
 * how leads were worked, not rep tooling.
 *
 * Gated in two places, because either one alone is not a gate:
 *   - the sidebar entry (presentation), and
 *   - the route itself, via ProtectedRoute's `allow` — without it the page is
 *     one typed URL away for anybody.
 *
 * Both read the SAME predicate, so the button and the URL cannot disagree.
 */

/**
 * Reporting period.
 *
 * This is the lever that controls how much data crosses the wire, and it
 * defaults to the current MONTH rather than the year. The dataset service pulls
 * every lead in the window so the aggregates can be computed, so a year-wide
 * default meant ~12x the rows for a report most people read month to month.
 *
 * Why the window and not a paged fetch: see the note on the fetch in
 * hooks/useTeamPerformance.js. Narrowing the window is the only way to load
 * less without making the numbers wrong.
 */
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d, endOfDay = false) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${
    endOfDay ? "23:59:59" : "00:00:00"
  }`;

const monthRange = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return [fmt(start), fmt(end, true)];
};

const dayRange = () => {
  const now = new Date();
  return [fmt(now), fmt(now, true)];
};

// Monday-to-today, not a rolling seven days: "this week" has to mean the same
// window to everyone reading the report, and a rolling window makes two people
// comparing screens on different days disagree about the same number.
const weekRange = () => {
  const now = new Date();
  const start = new Date(now);
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  start.setDate(now.getDate() - dow);
  return [fmt(start), fmt(now, true)];
};

// A month is the WIDEST window offered, deliberately. A quarter or a year runs
// past the dataset service's 5,000-lead cap at this volume, and over that cap
// the aggregates are computed on a TRUNCATED set with nothing on screen saying
// so. Today and This week are narrower than a month and so are always safe.
// Wider windows come back when the backend can aggregate, not before.
const PERIODS = [
  { key: "today", label: "Today", range: dayRange },
  { key: "thisWeek", label: "This week", range: weekRange },
  { key: "thisMonth", label: "This month", range: () => monthRange(0) },
  { key: "lastMonth", label: "Last month", range: () => monthRange(-1) },
];

/**
 * KPI card.
 *
 * The tinted icon tile is what carries the meaning at a glance — four grey
 * cards read as one block of numbers and nobody can find the one they want
 * without reading all four labels. Colour is decoration ONLY: every card still
 * says what it is in words, so the tint is never the sole carrier of meaning.
 */
// One accent hex per card drives the icon tile, the wash behind the card, the
// corner glow and the hover halo. Derived rather than hand-written so the four
// can never drift out of step — the same approach as the dashboard's KPICard,
// so both screens read as one system.
const hexToRgba = (hex = "#3B82F6", a = 1) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  // eslint-disable-next-line no-bitwise
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const Tile = ({ label, value, hint, icon, accent = "#3B82F6" }) => {
  const tint = hexToRgba(accent, 0.12); // icon tile
  const wash = hexToRgba(accent, 0.06); // the card's own gradient
  const blob = hexToRgba(accent, 0.22); // corner glow
  const glow = hexToRgba(accent, 0.35); // hover halo

  return (
    <div
      style={{
        "--tile-glow": glow,
        backgroundImage: `linear-gradient(135deg, ${wash} 0%, transparent 60%)`,
      }}
      className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_2px_8px_rgba(16,24,40,.05)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--tile-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
        style={{ background: `radial-gradient(circle, ${blob}, transparent 70%)` }}
      />

      {/* Two per row on phones, so the icon stacks above the text rather than
          stealing half the width from a label like "Qualified, then dropped". */}
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 transition-transform duration-300 ease-premium group-hover:scale-105 motion-reduce:transition-none"
          style={{ backgroundColor: tint }}
        >
          <Icon name={icon} size={20} color={accent} className="sm:h-[22px] sm:w-[22px]" />
        </span>

        <div className="min-w-0">
          <Tooltip title={label} text={hint}>
            <span className="cursor-help border-b border-dotted border-muted-foreground/40 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {label}
            </span>
          </Tooltip>
          <p className="mt-1.5 text-2xl font-bold sm:text-3xl leading-none tabular-nums tracking-tight text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Period switcher — one soft pill that slides between the options.
 *
 * The indicator is MEASURED from the active button rather than assumed to be
 * 1/n of the track. Equal segments only work if every label fits in its share,
 * and "This month" does not: the pill came out narrower than its own text and
 * the words spilled over both edges. Measuring also means labels of any length
 * can be added later without the control quietly breaking.
 *
 * Re-measured on resize through a ResizeObserver, because a font loading late
 * or the sidebar collapsing changes the geometry after the first paint.
 */
const PeriodTabs = ({ periods, value, onChange }) => {
  const trackRef = useRef(null);
  const btnRefs = useRef({});
  const [pill, setPill] = useState({ left: 0, width: 0 });

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      const btn = btnRefs.current[value];
      if (!track || !btn) return;
      setPill({ left: btn.offsetLeft, width: btn.offsetWidth });
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);

    // On a phone the strip scrolls, so the selected period can sit off-screen
    // after a tap — bring it into view rather than leaving the user to guess
    // which one is active.
    btnRefs.current[value]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });

    return () => ro.disconnect();
  }, [value, periods]);

  return (
    <div className="no-scrollbar w-full overflow-x-auto rounded-full border border-border bg-background p-1.5 shadow-sm md:w-auto md:overflow-visible">
      {/* w-max, so the track is as wide as its labels and the strip scrolls
          instead of the labels being squeezed. Four periods do not fit a
          360px screen at a readable size, and shrinking them to fit was the
          overflow. */}
      <div ref={trackRef} className="relative flex w-max items-center md:w-full">
        <span
          aria-hidden="true"
          style={{ left: pill.left, width: pill.width }}
          className="pointer-events-none absolute inset-y-0 rounded-full border border-primary/30 bg-primary/10 transition-[left,width] duration-300 ease-premium motion-reduce:transition-none"
        />

        {periods.map((p) => {
          const active = p.key === value;
          return (
            <button
              key={p.key}
              type="button"
              ref={(el) => {
                btnRefs.current[p.key] = el;
              }}
              onClick={() => onChange(p.key)}
              aria-pressed={active}
              className={`relative z-10 flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 md:px-4 md:text-sm ${
                active
                  ? "font-semibold text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {/* The dot only renders on the active tab, and it holds its
                  space when inactive so the label never shifts sideways as
                  the pill arrives. */}
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200 ${
                  active ? "bg-primary" : "bg-transparent"
                }`}
              />
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const TeamPerformance = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [periodKey, setPeriodKey] = useState("thisMonth");
  const [project, setProject] = useState("");
  const [team, setTeam] = useState("");

  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[0];

  // TEAM FILTER. Lead has no native team attribute, so "filter by team" means
  // "assigned to anyone on that team": the selected team's users are resolved
  // to ids and applied as assignedUserId IN [...]. Same approach as the Reports
  // and Deals pages, so all three agree on what a team contains.
  const { data: teamsData } = useTeams();
  const { data: teamUsersData, isSuccess: teamUsersLoaded } = useTeamUsers(team);

  // null = "not known yet", [] = "this team genuinely has no users".
  // The distinction matters: `|| []` while the request is still in flight would
  // read as an empty team and the query would resolve to "match nothing",
  // flashing an empty report before the real one arrives.
  const teamUserIds = useMemo(() => {
    if (!team) return null;
    if (!teamUsersLoaded) return null;
    return (teamUsersData?.list || []).map((u) => u.id);
  }, [team, teamUsersLoaded, teamUsersData]);

  // Shared cache with the Leads page filter, so this is normally a cache read
  // rather than a request.
  const { options: projectOptions } = useProjectOptions();

  const teamOptions = (teamsData?.list || []).map((t) => ({
    value: t.id,
    label: t.name,
  }));

  // The picker's value is the project's `name`; leads may store either the
  // name or the nomen, so send both and let the service OR them.
  const projectTokens = useMemo(() => {
    const selected = projectOptions.find((o) => o.value === project)?.project;
    if (!selected) return [];
    return [selected.projectNomen, selected.name]
      .map((v) => (v || "").trim())
      .filter((v) => v && v !== "Default")
      .filter((v, i, arr) => arr.indexOf(v) === i);
  }, [project, projectOptions]);

  // Debounce-free on purpose: the dataset service dedupes in-flight requests
  // and caches per filter set, so typing re-reads cache rather than re-fetching.
  const { filters, year } = useMemo(() => {
    const [startDate, endDate] = period.range();
    return {
      filters: {
        // Both tokens, because a lead may carry either. "Default" is a
        // placeholder nomen shared by many projects, so it is never a filter
        // token — including it would pull in every project that has it.
        ...(projectTokens.length ? { _projectTokens: projectTokens } : {}),
        // Only present once the team's users are known — see teamUserIds above.
        ...(team && teamUserIds ? { _teamUserIds: teamUserIds } : {}),
        // `between` on createdAt — the service falls back to a whole-year
        // window when no explicit range is given, which is what we are
        // avoiding here.
        dateFilter: "between",
        startDate,
        endDate,
      },
      // Only used to namespace the cache key; the range above is what the
      // query actually filters on.
      year: Number(startDate.slice(0, 4)),
    };
  }, [period, projectTokens, team, teamUserIds]);

  // Hold the dataset request until the team resolves. Firing it early would
  // fetch the WHOLE team's leads unscoped, then immediately refetch scoped —
  // a wasted full pull, and a second of wrong numbers on screen.
  const {
    rows,
    totals,
    historyAvailable,
    recordCount,
    isLoading,
    isFetching,
    isError,
  } =
    useTeamPerformance({
      filters,
      year,
      enabled: !team || teamUserIds !== null,
    });

  const rankedCount = rows.filter((r) => !r.lowSample).length;

  return (
    <>
      <Helmet>
        <title>Team Performance · AAJneeti CRM</title>
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Header
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="top-bar-offset lg:ml-64">
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                Team Performance
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Ranked on qualification, counting every lead that was{" "}
                <span className="font-medium text-foreground">ever</span>{" "}
                qualified — not only those qualified today. Every number counts
                leads <span className="font-medium text-foreground">created</span>{" "}
                in the selected period, so it will not match an all-time filter
                on the Leads page.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 md:w-auto md:flex-row md:flex-wrap md:items-center">
              {/* Project / team. The app's own Select, not a native one: a
                  native <select> renders the OS list, which cannot be styled
                  and looked nothing like the rest of the page. Searchable on
                  the project because the list runs to hundreds. */}
              <div className="w-full md:w-56">
                <Select
                  options={[
                    { value: "", label: "All projects" },
                    ...projectOptions.map((p) => ({
                      value: p.value,
                      label: p.label,
                      description: p.subLabel,
                    })),
                  ]}
                  value={project}
                  onChange={setProject}
                  placeholder="Filter by project…"
                  searchable
                  clearable
                />
              </div>

              <div className="w-full md:w-48">
                <Select
                  options={[
                    { value: "", label: "All teams" },
                    ...teamOptions,
                  ]}
                  value={team}
                  onChange={setTeam}
                  placeholder="All teams"
                />
              </div>

              <PeriodTabs
                periods={PERIODS}
                value={periodKey}
                onChange={setPeriodKey}
              />

              {isFetching && (
                <span className="text-xs text-muted-foreground">Updating…</span>
              )}
            </div>
          </div>

          {/* The honest-failure banner. If no record carries cStatusObj, every
              "ever" metric collapses to "currently" — the precise flaw this
              report exists to fix — and the numbers would look perfectly
              plausible while being wrong. Say so rather than show them bare. */}
          {!isLoading && recordCount > 0 && !historyAvailable && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <Icon name="AlertTriangle" size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">
                  No status history on these leads
                </p>
                <p className="mt-0.5">
                  None of the {recordCount} leads in this period carry a
                  status-change history, so Ever-Qualified is falling back to
                  each lead&apos;s current status. Leads that qualified and later
                  went cold are being under-counted.
                </p>
              </div>
            </div>
          )}

          {isError && (
            <div className="mb-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              Could not load the dataset. The report is showing whatever was
              cached from the last successful load.
            </div>
          )}

          <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Tile
              icon="Users"
              accent="#F43F5E"
              label="Total leads"
              value={totals?.leads ?? 0}
              hint={`Every lead created ${period.label.toLowerCase()}. This is the base every other number on the page is measured against.`}
            />
            <Tile
              icon="ShieldCheck"
              accent="#10B981"
              label="Ever-qualified"
              value={totals?.everQualified ?? 0}
              hint="Leads that held a qualifying status at any point — counted even if the lead is closed or cold today."
            />
            <Tile
              icon="Filter"
              accent="#F59E0B"
              label="Qualified, then dropped"
              value={totals?.qualifiedThenDropped ?? 0}
              hint="Leads that qualified and were later lost. They still count as qualified — this is the weekly coaching list, not a penalty."
            />
            <Tile
              icon="Trophy"
              accent="#8B5CF6"
              label="Reps ranked"
              value={`${rankedCount} / ${rows.length}`}
              hint={`Reps with at least ${MIN_SAMPLE} leads in this period. Below that they still appear in the table but are not ranked, because the sample is too small to judge.`}
            />
          </div>

          <TeamPerformanceTable
            rows={rows}
            totals={totals}
            isLoading={isLoading}
          />

          {/* Stated in the UI, not only in the code comments: a reader needs to
              know why the speed columns the spec asks for are not here. */}
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-muted/40 p-4 lg:border-0 lg:bg-transparent lg:p-0">
          <Icon
            name="Info"
            size={16}
            className="mt-0.5 shrink-0 text-muted-foreground lg:hidden"
          />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Median first response, reached-within-5-minutes and overdue
            follow-ups are not shown. The CRM records which statuses a lead has
            passed through, but not when each change happened, so there is no
            honest way to measure response time yet — that needs a status-change
            log on the backend. Contact&nbsp;% is derived from statuses alone and
            so is a floor: a rep who spoke to a buyer without moving the status
            reads as not connected.
          </p>
          </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default TeamPerformance;

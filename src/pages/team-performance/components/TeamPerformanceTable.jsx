import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../../components/AppIcon";
import TablePagination from "../../reports/components/TablePagination";
import Tooltip from "../../../components/ui/Tooltip";
import { MIN_SAMPLE } from "../utils/qualification";

/**
 * Columns.
 *
 * The spec's table also carries Median first response, Reached-within-5-min %
 * and Overdue follow-ups. Those are deliberately ABSENT rather than present and
 * empty: `cStatusObj` gives us which statuses a lead passed through but not
 * when, so there is no honest way to compute a response time today. An empty
 * column reads as a broken report; a missing one reads as a later phase.
 */
const COLUMNS = [
  { key: "name", label: "TEAM MEMBER", align: "left", numeric: false },
  {
    key: "leads",
    label: "Total Leads",
    hint: "Total leads assigned to this team member that were created during the selected period."
  },
  {
    key: "connected",
    label: "Contacted",
    hint: "Leads where the team member appears to have made contact, based on the lead's current status. Actual calls are not tracked yet, so this count may be lower than the real number."
  },
  {
    key: "everQualified",
    label: "Interested Leads",
    hint: "Leads that showed interest at any point, even if they were later marked as lost or not interested."
  },
  {
    key: "netQ",
    label: "Interest Rate",
    hint: "Shows how many contacted leads became interested. For example, 5 of 10 means 5 interested leads out of 10 contacted leads."
  },
  {
    key: "index",
    label: "Team Comparison",
    hint: "Compares this team member's results with the team average on the same projects. 1.00 means average, 1.20 means 20% above average, and 0.80 means 20% below average."
  },
  {
    key: "qualifiedThenDropped",
    label: "Interested, Then Lost",
    hint: "Leads that showed interest but were later marked as lost. Use this number to identify leads that may need follow-up."
  },
  {
    key: "closedWithoutReaching",
    label: "No Contact Made",
    hint: "Leads marked as lost without reaching a contact status. This helps identify leads that may have been closed before contact was established."
  },
  {
    key: "siteVisitsDone",
    label: "Site Visits Completed",
    hint: "Leads created during the selected period that reached the Site Visit Done status. This is based on when the lead was created, not when the visit happened."
  },
];

/**
 * Card tint, from the rep's INTEREST RATE — interested / contacted.
 *
 * Not from the team-comparison index, which was the first version. The index
 * only exists above MIN_SAMPLE leads, and at this team's volumes almost every
 * rep sits below it, so almost every card came out grey and the colour said
 * nothing. The interest rate exists for anyone who has contacted a single
 * lead, so the colour is always there and always means something.
 *
 * The two signals stay separate on purpose:
 *   the TINT  = how well this rep is converting what they touched;
 *   the BADGE = whether there is enough volume to rank them against the team.
 * A rep can therefore be bright green and still say "Not ranked" — strong
 * conversion, too few leads to call it a trend. Collapsing those into one
 * colour would claim a confidence the data does not have.
 *
 * Colour is never the only carrier: every number is on the card in words.
 */
const TIERS = {
  emerald: {
    card: "bg-gradient-to-br from-emerald-100/80 via-emerald-50/40 to-background border-emerald-200/70",
    badge: "bg-emerald-100 text-emerald-700",
    avatar: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    ring: "ring-emerald-200/60",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    // Desktop row hover — the rep's own colour, so the tint that
    // identifies them on mobile is the one that follows the cursor.
    rowHover: "hover:bg-emerald-50/70",
  },
  sky: {
    card: "bg-gradient-to-br from-sky-100/80 via-sky-50/40 to-background border-sky-200/70",
    badge: "bg-sky-100 text-sky-700",
    avatar: "bg-gradient-to-br from-sky-500 to-sky-700",
    ring: "ring-sky-200/60",
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    // Desktop row hover — the rep's own colour, so the tint that
    // identifies them on mobile is the one that follows the cursor.
    rowHover: "hover:bg-sky-50/70",
  },
  amber: {
    card: "bg-gradient-to-br from-amber-100/80 via-amber-50/40 to-background border-amber-200/70",
    badge: "bg-amber-100 text-amber-800",
    avatar: "bg-gradient-to-br from-amber-500 to-amber-600",
    ring: "ring-amber-200/60",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    // Desktop row hover — the rep's own colour, so the tint that
    // identifies them on mobile is the one that follows the cursor.
    rowHover: "hover:bg-amber-50/70",
  },
  rose: {
    card: "bg-gradient-to-br from-rose-100/80 via-rose-50/40 to-background border-rose-200/70",
    badge: "bg-rose-100 text-rose-700",
    avatar: "bg-gradient-to-br from-rose-500 to-rose-700",
    ring: "ring-rose-200/60",
    dot: "bg-rose-500",
    chip: "bg-rose-100 text-rose-700",
    text: "text-rose-700",
    // Desktop row hover — the rep's own colour, so the tint that
    // identifies them on mobile is the one that follows the cursor.
    rowHover: "hover:bg-rose-50/70",
  },
  violet: {
    card: "bg-gradient-to-br from-violet-100/80 via-violet-50/40 to-background border-violet-200/70",
    badge: "bg-violet-100 text-violet-700",
    avatar: "bg-gradient-to-br from-violet-500 to-violet-700",
    ring: "ring-violet-200/60",
    dot: "bg-violet-400",
    chip: "bg-violet-100 text-violet-700",
    text: "text-violet-700",
    // Desktop row hover — the rep's own colour, so the tint that
    // identifies them on mobile is the one that follows the cursor.
    rowHover: "hover:bg-violet-50/70",
  },
};

const perfTier = (row) => {
  // Nobody contacted: there is no rate to colour by. Violet rather than grey —
  // "nothing worked yet" is a state worth seeing, not worth hiding.
  const tier =
    !row.connected
      ? TIERS.violet
      : (() => {
          const rate = row.everQualified / row.connected;
          if (rate >= 0.6) return TIERS.emerald;
          if (rate >= 0.35) return TIERS.sky;
          if (rate > 0) return TIERS.amber;
          return TIERS.rose;
        })();

  // The badge still tells the truth about ranking, independently of the tint.
  const label =
    row.lowSample || row.index == null
      ? "Not ranked"
      : row.index >= 1.15
        ? `${row.index.toFixed(2)} ↑`
        : row.index <= 0.85
          ? `${row.index.toFixed(2)} ↓`
          : row.index.toFixed(2);

  return { ...tier, label };
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase() || "?";

const MobileRow = ({ row, open, onToggle }) => {
  const tier = perfTier(row);

  // Each metric gets an icon so the expanded grid is scannable by shape rather
  // than by reading six labels in a column.
  const details = [
    { icon: "Users", label: "Total Leads", value: row.leads },
    { icon: "Phone", label: "Contacted", value: row.connected },
    {
      icon: "ShieldCheck",
      label: "Interest Rate",
      value: (
        <>
          {row.everQualified}{" "}
          <span className="font-normal text-muted-foreground/70">of</span>{" "}
          {row.connected}
        </>
      ),
    },
    {
      icon: "PackageX",
      label: "Interested, Then Lost",
      value: row.qualifiedThenDropped,
    },
    { icon: "XCircle", label: "No Contact Made", value: row.closedWithoutReaching },
    {
      icon: "CalendarCheck",
      label: "Site Visits Completed",
      value: row.siteVisitsDone,
    },
  ];

  return (
    <div
      className={`mx-3 my-2.5 rounded-[28px] border p-5 shadow-sm transition-all duration-200 ${tier.card}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Initials rather than a photo: the CRM stores no avatars, and a
            generic silhouette on every row carries nothing. The dot says
            ranked or not — the same thing the badge says in words, which is
            what keeps it from being colour-only. */}
        <div className="relative shrink-0">
          <span
            className={`grid h-14 w-14 place-items-center rounded-full text-base font-bold text-white shadow-md ring-4 ${tier.avatar} ${tier.ring}`}
          >
            {initials(row.name)}
          </span>
          <span
            className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-[3px] border-card ${tier.dot}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-bold capitalize text-foreground">
            {row.name}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Icon name="Users" size={15} />
              {row.leads} {row.leads === 1 ? "lead" : "leads"}
            </span>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Icon name="Phone" size={15} />
              {row.connected} contacted
            </span>
            <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Icon name="ShieldCheck" size={15} />
              {row.everQualified} interested
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-medium ${tier.badge}`}
          >
            {tier.label}
          </span>

          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className={`flex items-center gap-1.5 rounded-full bg-background/80 px-3.5 py-2 text-[13px] font-semibold shadow-sm backdrop-blur transition-all duration-150 hover:bg-background active:scale-95 ${tier.text}`}
          >
            {open ? "Less" : "More"}
            <Icon
              name="ChevronDown"
              size={14}
              className={`transition-transform duration-200 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-3 rounded-[20px] bg-background/70 p-3.5 shadow-sm backdrop-blur"
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${tier.chip}`}
                >
                  <Icon name={d.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-muted-foreground">
                    {d.label}
                  </p>
                  <p className="mt-1 text-xl font-bold leading-none tabular-nums text-foreground">
                    {d.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* The "Not ranked" badge needs explaining somewhere a phone can
              read it: there is no hover to put it behind. */}
          {/* {row.lowSample && (
            <div className="flex items-start gap-3 rounded-[20px] bg-background/70 p-3.5 shadow-sm backdrop-blur">
              <Icon
                name="Info"
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Fewer than {MIN_SAMPLE} leads this period — shown, but not
                ranked against the team.
              </p>
            </div>
          )} */}
        </div>
      )}
    </div>
  );
};


const TeamPerformanceTable = ({ rows = [], totals, isLoading }) => {
  const [sort, setSort] = useState({ key: "index", dir: "desc" });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  // Mobile accordion. One id, not a set — opening a card closes the last one.
  const [openId, setOpenId] = useState(null);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      // Low-sample reps stay pinned to the bottom whatever the sort, so the
      // top of the table is never a rep with four leads and a lucky ratio.
      if (a.lowSample !== b.lowSample) return a.lowSample ? 1 : -1;
      const av = a[sort.key];
      const bv = b[sort.key];
      if (typeof av === "string" || typeof bv === "string") {
        return sort.dir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      }
      const an = av ?? -1;
      const bn = bv ?? -1;
      return sort.dir === "asc" ? an - bn : bn - an;
    });
    return copy;
  }, [rows, sort]);

  // Paginate AFTER sorting, never before — slicing first would sort only the
  // visible page and the ranking would change as you clicked through.
  const paged = useMemo(
    () => sorted.slice((page - 1) * perPage, page * perPage),
    [sorted, page, perPage],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));

  // Any change to the ordering or the underlying rows invalidates the current
  // page number — page 3 of a re-sorted table shows unrelated reps, and page 3
  // of a shorter result set shows nothing at all.
  useEffect(() => {
    setPage(1);
  }, [sort.key, sort.dir, perPage, rows.length]);

  // An open card on page 1 would otherwise stay open against whichever rep
  // lands in that position on page 2.
  useEffect(() => {
    setOpenId(null);
  }, [page, sort.key, sort.dir]);

  const toggle = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    );

  if (isLoading && rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Loading team performance…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        No leads in this period.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Phones and small tablets get the accordion; the table returns at lg,
          where all nine columns fit without a horizontal scroller. */}
      <div className="py-1 lg:hidden">
        {paged.map((row) => (
          <MobileRow
            key={row.id}
            row={row}
            open={openId === row.id}
            onToggle={() => setOpenId((id) => (id === row.id ? null : row.id))}
          />
        ))}

        {totals && (
          <div className="mx-3 my-2.5 flex items-center gap-3.5 rounded-[28px] border border-border bg-muted/40 p-5 shadow-sm">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-background text-muted-foreground shadow-sm">
              <Icon name="Users" size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-[17px] font-bold text-foreground">Team</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {totals.leads} leads ·{" "}
                <span className="font-semibold text-foreground">
                  {totals.everQualified}
                </span>{" "}
                interested · {totals.siteVisitsDone}{" "}
                {totals.siteVisitsDone === 1 ? "visit" : "visits"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse">
          <thead className="border-b border-border bg-[#F8FAFC] dark:bg-muted">
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  className={`cursor-pointer select-none whitespace-nowrap px-6 py-4 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground ${col.align === "left" ? "text-left" : "text-right"
                    } ${
                    // The rep column is pinned so a name stays on screen while
                    // the metric columns scroll under it — otherwise you scroll
                    // right to read a number and lose whose number it is. It
                    // needs its own OPAQUE background: a sticky cell sits on top
                    // of the scrolling ones and would show them through.
                    col.key === "name"
                      ? "sticky left-0 z-20 bg-[#F8FAFC] dark:bg-muted shadow-[1px_0_0_0_var(--color-border)]"
                      : ""
                    }`}
                >
                  <Tooltip title={col.label} text={col.hint}>
                    <span
                      className={
                        col.hint
                          ? "cursor-pointer border-b border-dotted border-muted-foreground/50"
                          : ""
                      }
                    >
                      {col.label}
                    </span>
                    {sort.key === col.key && (
                      <Icon
                        name={sort.dir === "asc" ? "ChevronUp" : "ChevronDown"}
                        size={12}
                      />
                    )}
                  </Tooltip>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paged.map((row) => {
              const tier = perfTier(row);
              return (
              <tr
                key={row.id}
                className={`border-b border-border/60 transition-colors last:border-b-0 ${tier.rowHover}`}
              >
                {/* The rep cell carries the same avatar + tint as the mobile
                    card, so a rep is recognisable by colour on either screen.
                    The row itself is left plain: nine tinted cells per row,
                    twenty rows deep, turns the table into a colour field
                    nobody can read a number out of. */}
                <td className="sticky left-0 z-10 whitespace-nowrap bg-card px-6 py-3 text-left shadow-[1px_0_0_0_var(--color-border)]">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ring-2 ${tier.avatar} ${tier.ring}`}
                    >
                      {initials(row.name)}
                    </span>
                    <span className="text-[15px] font-semibold capitalize text-foreground">
                      {row.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{row.leads}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">
                  {row.connected}
                </td>
                <td className="px-6 py-4 text-right text-[15px] font-semibold tabular-nums text-foreground">
                  {row.everQualified}
                </td>
                {/* Counts, not a percentage — "22 of 37" is checkable against
                    a rep's own list in a way that "59.5%" never is. */}
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">
                  {row.everQualified} <span className="text-muted-foreground/70">of</span> {row.connected}
                </td>
                {/* The comparison as a pill, matching the mobile badge —
                    including "Not ranked" in words rather than a bare dash,
                    which read as missing data. */}
                <td className="px-6 py-4 text-right">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${
                      row.lowSample || row.index == null
                        ? "bg-muted text-muted-foreground"
                        : tier.badge
                    }`}
                  >
                    {tier.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{row.qualifiedThenDropped}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{row.closedWithoutReaching}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{row.siteVisitsDone}</td>
              </tr>
              );
            })}
          </tbody>

          {/* Totals are for the WHOLE team, not the visible page. A footer
              that re-totalled per page would read as the team's numbers while
              silently meaning "these 20 reps", which is worse than no footer. */}
          {totals && (
            <tfoot>
              <tr className="border-t-2 border-border bg-[#F8FAFC] dark:bg-muted text-[15px] font-bold">
                <td className="sticky left-0 z-10 bg-[#F8FAFC] dark:bg-muted px-6 py-4 text-left shadow-[1px_0_0_0_var(--color-border)]">
                  Team
                </td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{totals.leads}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">
                  {totals.connected}
                </td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{totals.everQualified}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">
                  {totals.everQualified} <span className="text-muted-foreground/70">of</span> {totals.connected}
                </td>
                {/* The team is its own baseline, so its index is 1.00 by
                    definition — printing it would imply a comparison. */}
                <td className="px-6 py-4 text-right text-muted-foreground">—</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{totals.qualifiedThenDropped}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{totals.closedWithoutReaching}</td>
                <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">{totals.siteVisitsDone}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {sorted.length > perPage && (
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={sorted.length}
          itemsPerPage={perPage}
          onPageChange={setPage}
          onItemsPerPageChange={(n) => setPerPage(Number(n))}
        />
      )}
    </div>
  );
};

export default TeamPerformanceTable;

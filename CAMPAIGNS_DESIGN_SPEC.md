# Campaigns / Projects Page — Design Specification

A design-only specification for porting the web CRM Campaigns page — route
`/campaigns`, titled **My Projects** — to the Capacitor mobile CRM. Its
subject is **project and lead distribution**: which projects exist, and who
receives leads from each one and how many.

Describes layout, colour, type, spacing, states, copy and motion. Logic is
described only where a visual rule depends on it.

Companion documents: `MOBILE_DESIGN_SPEC.md` (shared tokens, chrome, lead
cards, quick-edit sheet), `DASHBOARD_DESIGN_SPEC.md`,
`REPORTS_DESIGN_SPEC.md`, `SITE_VISITS_DESIGN_SPEC.md`.

**A note on apostrophes in this file:** every quoted copy string below uses
the typographic apostrophe (U+2019). The shipped web copy uses a plain ASCII
apostrophe. Match the web, not this document, on that one character.

---

## 0. Naming — read this first

This screen has **three names** in the running app and they do not agree:

| Where | Name |
|---|---|
| Route | `/campaigns` |
| Sidebar label | My Campaigns |
| Page heading | My Projects |
| Browser title | My Projects - Aajneeti Connect ltd |
| Filter card heading | Projects (N) |
| Primary button | New Campaign |
| Table empty state | No projects available |
| Card empty state | No projects found |
| Card loading state | Loading campaigns… |

**Reproduce this inconsistency exactly.** It is not worth fixing unilaterally
during a port — the two vocabularies are load-bearing in different places and
changing one without the other will read as a bug to anyone who uses both
builds. If it is to be unified, that is a product decision taken once, on both
platforms together.

The subtitle exists specifically because of this split: the sidebar says
Campaigns, the heading says Projects, and without the subtitle nothing on
screen tells someone hunting for lead distribution that they have arrived.

---

## 1. Screen anatomy

Render order, top to bottom:

1. **Page header** — heading, distribution subtitle, `New Campaign` button.
2. **KPI row** — four stat cards.
3. **Filter card and view toggle** — side by side from `lg`, stacked below.
4. **Body**, one of two views:
   - **Cards** (default) — a responsive grid of project cards.
   - **Table** — a sortable table with checkbox selection, inside a rounded
     card whose footer is the pagination.
5. **Pagination** — inside the table card in table view, free-standing below
   the grid in cards view.
6. **Project drawer** — three tabs, opening on **Lead Distribution**.

### 1.1 The two things most likely to be ported wrong

**One.** The web mobile card in table view **drops the Distribution column
entirely**. On a phone, the one column that exists to make lead distribution
discoverable disappears. Section 7.4 specifies adding a distribution line to
the mobile card. This is a deliberate deviation, called out so it can be
overridden.

**Two.** The drawer opens on **Lead Distribution**, not Overview, and resets
to it on every open. On web the drawer is never unmounted — it is hidden with
a transform — so without that reset a user who last viewed Overview would
reopen the *next* project on Overview. If mobile unmounts its sheet on close
the reset is free, but the **default tab must still be Lead Distribution**.
Section 9.1.

---

## 2. The distribution data model

Every visual on this screen derives from three fields on the project record.
Reproducing the UI without this model produces controls that look right and
mean nothing, so it is specified here rather than left to the implementer.

| Field | Meaning |
|---|---|
| `collaboratorsIds` | **Who** receives leads. Presence in this list is the entire on/off switch — out of it means out of the rotation. |
| `configuration` | **How many** each one gets. A newline-separated string of `id:name:count` rows. |
| `enableConfiguration` | `false` → **Equal (round robin)**: counts ignored, leads split evenly. `true` → **Custom**: the counts are used. |

Four consequences that shape the UI:

1. **Switching to Equal does not rewrite the counts.** The flag alone is
   enough, and leaving the numbers in place means switching back to Custom
   restores exactly what was there. So the number inputs must be **disabled,
   not cleared**, in Equal mode.
2. **A paused member keeps their `configuration` line** even though their id
   has left `collaboratorsIds`. The backend ignores an orphan line, so they
   receive nothing — but their number survives the pause instead of silently
   resetting to the default. This is why pause and remove are two different
   actions with two different controls.
3. **No stored row means Auto.** The format has no way to say "no fixed
   number", so Auto is expressed by the absence of a row. Clearing the number
   input deletes the row.
4. **There is no per-day assignment history.** The split preview is a
   **plan**, not a record. Every piece of copy around it must say so.

### 2.1 Row parsing rules that are visible to the user

- A row is split on its **first** and **last** colon only: id is the head,
  count the tail, name whatever is between. A name containing a colon
  (`Dr: Foo`) therefore survives.
- Ids are **deduped**. A duplicated id renders two rows sharing an id, and
  every per-member action keys off that id — so pausing one pauses both. They
  look like separate people because their names come from the configuration
  rows, which makes the bug read as a toggle glitch rather than as duplicate
  data.
- **Name resolution order:** the server map `collaboratorsNames` first, then
  the name stored in `configuration`, then the raw id. The configuration name
  is only a fallback because a paused member is absent from the server map by
  definition and it is the only name available for them.

### 2.2 Row order is stable, and that is the point

Rows follow the order recorded in `configuration`; anyone present only in
`collaboratorsIds` is appended.

Do **not** sort active members above paused ones. An earlier version did, and
pausing the top row moved it to the bottom. The click always applied to the
right person, but the row jumped — so it read as "I clicked the top toggle and
the bottom one changed", and clicking again moved it back. A control that
relocates the moment you use it is unusable however correct it is underneath.

Pausing must flip a switch **in place**.

### 2.3 How the split is planned

Given a daily volume:

- **Equal mode:** every active member is Auto by definition. Base share is the
  floor of volume over member count; the remainder is handed out one each to
  the first few rows.
- **Custom mode:** fixed numbers are honoured first, each capped at whatever
  volume remains — so a campaign whose numbers add up to more than it receives
  never reports a split larger than the leads that exist. Whatever is left is
  shared equally among the Auto members, remainder distributed one each.
- The result is reordered back into the member list order, so the preview
  matches the list above it row for row.

---

## 3. Page shell and header

- Root `min-h-screen bg-background relative`, with the `TricolorBurst`
  decorative layer behind everything. It is festive theming and **must be
  switchable off** with the rest of the seasonal styling.
- Content `lg:ml-64 pt-16`, inner padding `p-4 lg:p-6`. On mobile drop the
  sidebar offset and use the shared scaffold plus
  `env(safe-area-inset-bottom)` at the end of the scroll region.

### 3.1 Header

`flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6`.

- Heading: `My Projects` — `text-2xl lg:text-3xl font-bold heading-gradient`
  (currently resolves to solid `var(--color-foreground)`).
- Subtitle — `text-muted-foreground mt-1`, with **lead distribution** emphasised
  inline at `font-medium text-foreground`:

  > Create and track projects, and manage **lead distribution** — who receives
  > leads from each project and how many.

  The emphasis is the whole point of the line. Keep the two-weight treatment;
  a uniformly grey subtitle loses it.
- Button: `New Campaign` with a `Plus` icon size 16, `mr-2`.
  Classes: `linearbg-1 text-white hover:text-white border border-[#6E1420]/30`
  with shadow
  `0_1px_2px_rgba(16,24,40,.06),0_6px_16px_-6px_rgba(110,20,32,.45)`
  deepening on hover to
  `0_2px_4px_rgba(16,24,40,.08),0_10px_22px_-6px_rgba(110,20,32,.55)`,
  `transition-shadow`.
  `linearbg-1` is the shared `linear-gradient(52deg, #000000, #AC2334)`.

On mobile make the button full width below the subtitle and at least 44px tall.

---

## 4. KPI row

`mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4`. Two columns on a
phone — do not drop to one, the four numbers are meant to be compared.

Four cards, in order:

| Label | Icon | Accent | Sub-line |
|---|---|---|---|
| Projects | `Layers` | `#8A1B29` | — |
| Leads Today | `UserPlus` | `#F59E0B` | — |
| Unassigned | `AlertCircle` | `#EF4444` | `Needs distribution` |
| Total Leads | `Users` | `#0D9488` | — |

Only Unassigned carries a sub-line, and it is the only red text on the row:
`mt-1.5 text-xs font-medium text-red-600`. Unassigned leads are the thing this
screen exists to fix, so the row names the remedy rather than just the count.

### 4.1 One accent drives four values

From a single accent hex, at these alphas:

| Use | Alpha |
|---|---|
| Icon tile background | 0.12 |
| Card wash gradient | 0.06 |
| Corner glow blob | 0.22 |
| Hover halo | 0.35 |

This is the **same derivation as the dashboard KPI cards and the Team
Performance tiles**, so all three rows read as one system. Do not hand-pick
tints per card.

### 4.2 Card

`group relative h-full overflow-hidden rounded-2xl border border-border bg-card
p-4 shadow-[0_1px_2px_rgba(16,24,40,.04),0_2px_8px_rgba(16,24,40,.05)]
transition-all duration-300 ease-premium hover:-translate-y-1
hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--kpi-glow)]
motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-5`

Card wash, as an inline background image:
`linear-gradient(135deg, {wash} 0%, transparent 60%)`.

Corner glow: `pointer-events-none absolute -right-8 -top-8 h-28 w-28
rounded-full opacity-70 blur-2xl transition-opacity duration-300
group-hover:opacity-100`, background
`radial-gradient(circle, {blob}, transparent 70%)`.

Inner layout `relative flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4`
— so the icon sits **above** the number on a phone and **beside** it from
`sm`.

- Icon tile: `grid h-10 w-10 shrink-0 place-items-center rounded-xl
  transition-transform duration-300 ease-premium group-hover:scale-105
  sm:h-12 sm:w-12`, background the 0.12 tint, icon size 20 in the full accent.
- Label: `text-[11px] font-semibold uppercase tracking-[0.06em]
  text-muted-foreground`
- Value: `mt-1.5 text-2xl font-bold leading-none tabular-nums tracking-tight
  text-foreground sm:text-3xl`

### 4.3 Scoping — why the numbers can look wrong

The three lead-based numbers **follow the campaign filter**, and getting this
wrong produces a visibly broken row.

- **No filter active** → counted company-wide.
- **Filter active** → counted across **every matching campaign**, not just the
  page on screen. The filtered set is fetched once, unpaginated, for scoping
  only. Scoping from the visible page would under-count the moment a filter
  matched more than one page.
- **Filter matched zero campaigns** → counted as **zero**, via an impossible
  condition. This must be distinguished from "no filter": both look identical
  from an empty campaign list alone, and falling through would show every lead
  in the database.
- While the scope request is in flight, fall back to the current page so the
  cards show a filtered-ish number rather than flashing the global total.

The failure this guards against: filtering to 2 campaigns holding 103 leads
once showed `Total Leads 7743` beside a correctly filtered `Projects 2` — one
filtered number next to three global ones.

A placeholder em dash (`—`) shows while a count is unresolved. Previous data
is kept as placeholder during a refetch so numbers do not blink.

### 4.4 A missing metric

The original design called for **Avg response**, which needs response-time
tracking the backend does not have. It is replaced by a real **Total Leads**
metric. Do not add a placeholder or a fabricated average on mobile.

---

## 5. Filter card and view toggle

Row: `flex flex-col gap-3 lg:flex-row lg:items-start`, filter card in a
`min-w-0 flex-1` wrapper, toggle `shrink-0`.

### 5.1 Filter card

`bg-card border border-border rounded-lg p-4 mb-6`.

Header row: `mb-4 flex flex-col items-center justify-between gap-4 text-center
lg:flex-row lg:items-center lg:text-left` — **centred on a phone, left-aligned
from `lg`**. The count and the filter toggle are the only things in the card,
and left-aligning a lone short heading in a full-width card leaves it adrift.

- Heading: `Projects (N)` — `text-lg font-semibold text-foreground`, count
  locale-formatted.
- Active-filter chip, only when at least one filter is set:
  `px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full`,
  text `N filter active` / `N filters active`, followed by a ghost `Clear all`
  button at `text-xs`.
- Selection block, only when rows are selected: `N selected` at
  `text-sm text-muted-foreground`, then an outline `Actions` button with a
  `MoreHorizontal` icon opening a dropdown.

**Empty arrays do not count as active filters.** A multi-select with nothing
picked is truthy in JavaScript but means no filter — counting it lights the
chip on a screen with no filters applied.

### 5.2 Bulk actions dropdown

`absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg
shadow-elevation-2 z-50`, with a full-screen `fixed inset-0 z-40` click-catcher
behind it. Items: `flex items-center w-full px-3 py-2 text-sm
text-popover-foreground hover:bg-muted transition-smooth`, icon size 16 `mr-2`.

| Action | Label | Visibility |
|---|---|---|
| `massupdate` | Mass Update | everyone |
| `delete` | Delete Selected | admin or manager only |

`Export Selected` is **commented out** on web. Do not port it. Note the CSV
export helper still exists and is wired to the `export` action, which nothing
can now trigger — leave it out entirely rather than re-exposing it.

### 5.3 Filter controls

Grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4`, collapsed below `lg`
behind the Filters button (`hidden lg:grid` when not expanded).

1. **Search** — `type="search"`, placeholder `Search by project name…`,
   spanning `lg:col-span-2`
2. **Assign User** — searchable select, options built from the user list,
   value is the user **id**
3. **Filter by date** — select: `Today`, `Last 7 Days`, `Current Month`,
   `Last Month`, `On`, `Before`, `After`
4. **Date input** — appears only for `On`, `Before` or `After`, capped at
   today

The `between` branch in the source is unreachable — `between` is not in the
options list — so the second date input never renders. Do not build it.

Filters toggle button (below `lg` only): `w-full justify-center rounded-full
border-border px-5 sm:w-auto lg:hidden`, with a `Filter` icon and a
`ChevronDown` that rotates 180 degrees when expanded.

Changing any filter resets to page 1.

### 5.4 View toggle

`mx-auto flex w-full shrink-0 rounded-full border border-[#6E1420]/15 bg-card
p-1 shadow-[0_1px_2px_rgba(16,24,40,.06),0_4px_12px_-4px_rgba(16,24,40,.12)]
sm:w-auto sm:max-w-[260px] lg:mx-0`

Two segments, `cards` and `table`, labels capitalised via `capitalize`:
`flex-1 rounded-full px-5 py-2 text-sm font-semibold capitalize
transition-colors sm:flex-none`. Active `bg-[#6E1420] text-white shadow-sm`;
inactive `text-muted-foreground hover:text-foreground`.

**Two equal pills, full width and centred on a phone**, shrinking to their own
width beside the filters from `lg`. The pair previously sat hard against the
left edge of an otherwise empty row.

Default view is **cards**. The choice is not persisted.

---

## 6. Project card (cards view)

Grid: `mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 xl:grid-cols-3`.
Note the unusual `26px` gap — the cards carry a lift-on-hover and a halo, and
a tighter gutter makes neighbouring halos overlap.

Loading: `flex items-center justify-center py-20 text-muted-foreground` with a
`Loader` icon size 22 `mr-2 animate-spin` and the text `Loading campaigns…`.

Empty: `flex flex-col items-center justify-center py-20 text-center`, a
`Layers` icon size 28 `mb-2 text-muted-foreground`, then
`No projects found` at `text-sm font-medium text-foreground`.

### 6.1 Per-card accent, rotated by index

Six accent sets, applied by card position modulo 6. Index 0 is the brand
maroon.

| # | from | to | tint (hover border) | glow (halo) |
|---|---|---|---|---|
| 0 | `#7E1524` | `#B5533A` | `rgba(126,21,36,0.28)` | `rgba(126,21,36,0.22)` |
| 1 | `#264F4A` | `#5B9187` | `rgba(38,79,74,0.28)` | `rgba(38,79,74,0.22)` |
| 2 | `#7A5A22` | `#C79A4A` | `rgba(122,90,34,0.28)` | `rgba(122,90,34,0.22)` |
| 3 | `#4A3550` | `#8B6FA0` | `rgba(74,53,80,0.28)` | `rgba(74,53,80,0.22)` |
| 4 | `#2C4A6E` | `#6C93BE` | `rgba(44,74,110,0.28)` | `rgba(44,74,110,0.22)` |
| 5 | `#5C6B2A` | `#9CB05A` | `rgba(92,107,42,0.28)` | `rgba(92,107,42,0.22)` |

Exposed as CSS custom properties on the card root (`--accent-from`,
`--accent-to`, `--accent-tint`, `--accent-glow`) and consumed by the top rule,
the initials tile, the parent-name text, the momentum bar and the Open button.
Keep that single-source approach — five hard-coded copies of the same hex per
card is how a palette drifts.

**The accent is positional, not per-project.** Re-sorting or paging changes
which colour a project wears. That is accepted: the accent is rhythm for the
grid, not identity. The avatar colours below *are* identity.

### 6.2 Avatar palette — deliberately different

Five solid fills for the team stack:

```
#6E1420  #0F766E  #B45309  #4338CA  #BE123C
```

Chosen **not** to be the accent pairs, so the team reads as its own visual
system rather than more card chrome. Picked by a sum-of-char-codes hash of the
member name.

Note this is the same palette as the reports table, and **not** the
eight-colour palette used by the campaigns table and the deals table. Four
surfaces, three palettes. Do not unify them.

### 6.3 Card frame

`group relative flex flex-col overflow-hidden rounded-[20px] border
border-[rgba(20,20,30,0.08)] bg-card
shadow-[0_1px_2px_rgba(16,24,40,.04),0_2px_6px_rgba(16,24,40,.05)]
transition-all duration-300 ease-premium hover:-translate-y-1
hover:border-[color:var(--accent-tint)]
hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_18px_40px_-12px_var(--accent-glow)]
motion-reduce:transition-none motion-reduce:hover:translate-y-0`

Topped by a 3px accent rule: `h-[3px] w-full bg-gradient-to-r
from-[color:var(--accent-from)] to-[color:var(--accent-to)]`, `aria-hidden`.

Body: `flex flex-1 flex-col gap-4 p-5`.

### 6.4 Header

`flex items-start gap-3`.

- **Initials tile** — `grid h-10 w-10 shrink-0 place-items-center
  rounded-[11px] bg-gradient-to-br from-[color:var(--accent-from)]
  to-[color:var(--accent-to)] text-[13px] font-bold tracking-tight text-white
  shadow-[0_2px_6px_rgba(16,24,40,.12)]`, `aria-hidden`.
- **Title** — `truncate text-[14.5px] font-bold leading-tight
  tracking-[-0.01em] text-foreground`, with a `title` attribute for the full
  value.
- **Subtitle** — `mt-0.5 truncate text-[11.5px] leading-tight
  text-muted-foreground`, also with a `title`.
- **Right column** — `flex shrink-0 flex-col items-end gap-1.5`: status pill
  over a last-activity line at `text-[10px] leading-none text-muted-foreground`.

**Title and subtitle derivation:**

- Title is `projectNomen` — the short label — unless it is empty or the literal
  placeholder `Default`, in which case the full `name`.
- Subtitle is `clientNomen` when it differs from the title source; otherwise
  the literal string `Project`.
- Both are **humanized**: run-together PascalCase and camelCase are split into
  words. `GangaCounty` becomes `Ganga County`;
  `ShashankVirtualRealty` becomes `Shashank Virtual Realty`. Already-spaced
  names pass through unchanged. Collapse runs of whitespace and trim.

The humanizer is not cosmetic polish — these labels arrive run-together often
enough that without it the card titles are unreadable.

### 6.5 Status pill

`inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px]
text-[10.5px] font-bold uppercase tracking-[0.06em]`

| State | Classes | Dot | Label |
|---|---|---|---|
| Active | `border-emerald-600/20 bg-emerald-50 text-emerald-700` | `bg-emerald-500` plus a pulsing ring | `Active` |
| Idle | `border-slate-300/60 bg-slate-50 text-slate-500` | `bg-slate-400` | `Steady` |

The pulse ring: `absolute h-full w-full rounded-full bg-emerald-500
animate-pulse-ring motion-reduce:hidden`, inside a
`relative grid h-1.5 w-1.5 place-items-center` wrapper.

**Active means a lead landed today**, nothing more. There is no `status` field
on the project that the UI reads. The idle label is `Steady`, not `Inactive` —
a campaign with no leads today is warm but quiet, and calling it inactive
misrepresents it.

Last-activity line comes from `modifiedAt`, falling back to the fetched detail,
then `createdAt`. Rendered as `Active today`, `1 day ago`, `N days ago`, or
`No activity` when there is no date at all.

### 6.6 Optional location line

Only when an address or a parent name exists:
`-mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]
text-muted-foreground`.

- Address: a `MapPin` icon size 11 `shrink-0` plus a truncating span
- Parent name: `truncate font-semibold text-[color:var(--accent-from)]` — the
  only accent-coloured text in the card body

Both fields are optional on the record and the whole line is omitted when
neither is present. The negative top margin pulls it up under the header,
closing the gap that the card body spacing would otherwise leave.

### 6.7 Metrics panel

`rounded-[14px] border border-[rgba(20,20,30,0.07)] bg-gradient-to-b
from-slate-50/80 to-white p-3.5`.

Two columns in a `dl` at `flex items-stretch`, divided by a
`w-px shrink-0 bg-[rgba(20,20,30,0.08)]` rule. Left `flex-1 pr-3.5`, right
`flex-1 pl-3.5`.

- Label (`dt`): `text-[9.5px] font-extrabold uppercase tracking-[0.09em]
  text-muted-foreground` — `Total Leads` and `New Today`
- Value (`dd`): `mt-1 text-[22px] font-bold leading-none tabular-nums
  tracking-tight`

Total Leads renders an em dash while loading, otherwise the count formatted
`en-IN`. New Today renders `+N` when positive and a bare `0` otherwise, turns
`text-emerald-600` when positive, and gains a `TrendingUp` icon size 13
(`mb-px shrink-0`) in that state.

### 6.8 Momentum

`Momentum` is the share of the lifetime leads of that campaign which arrived
today. Both operands are real counts — this is not illustrative.

- Label row: `flex items-baseline justify-between`; label as in 6.7; value
  `text-[10.5px] font-bold tabular-nums text-foreground` suffixed `%`
- Track: `mt-1.5 h-1 w-full overflow-hidden rounded-full
  bg-[rgba(20,20,30,0.07)]`
- Fill: `h-full rounded-full bg-gradient-to-r from-[color:var(--accent-from)]
  to-[color:var(--accent-to)] transition-[width] duration-700 ease-premium
  motion-reduce:transition-none`

**The bar and the label disagree on purpose.** Momentum is naturally tiny on a
mature campaign (2 of 500 is 0.4 percent), so:

- the **bar** floors at 4 percent of width whenever momentum is above zero,
  so a real figure is never invisible
- the **label** prints the true value — one decimal place below 10 percent,
  rounded above it
- at exactly zero the bar is zero width, not 4 percent

ARIA: `role="progressbar"` with `aria-valuenow` as the rounded true value,
min 0, max 100, and a label reading
`Momentum: N% of leads arrived today`.

### 6.9 Footer

`mt-auto flex items-center justify-between gap-3 pt-1`.

**Team stack** — up to **4** avatars, then an overflow chip:

- Avatar: `-ml-2 grid h-7 w-7 place-items-center rounded-full text-[9.5px]
  font-bold text-white ring-2 ring-card first:ml-0`, background from the
  palette in 6.2, `title` set to the full name
- Overflow: same geometry, `bg-slate-100 text-[9.5px] font-bold
  text-slate-600`, label `+N`
- The stack lifts on card hover:
  `flex transition-transform duration-300 ease-premium
  group-hover:-translate-y-0.5`
- Count label: `truncate text-[10.5px] font-semibold text-muted-foreground`,
  `N member` / `N members`
- No team at all: the single word `Unassigned` at
  `text-[11px] text-muted-foreground`

Team members are the project **collaborators**, deduped. Projects use
`collaboratorsNames` rather than an assigned user — and the list endpoint does
not return it, so the card fetches the project detail when the row lacks it.

**Open button** — `group/cta relative inline-flex shrink-0 items-center gap-2
overflow-hidden rounded-full bg-gradient-to-r from-[color:var(--accent-from)]
to-[color:var(--accent-to)] py-1.5 pl-4 pr-1.5 text-[12px] font-bold
text-white transition-all duration-300 ease-premium hover:-translate-y-0.5
hover:shadow-[0_8px_18px_-6px_var(--accent-glow)] focus-visible:ring-2
focus-visible:ring-[color:var(--accent-to)] focus-visible:ring-offset-2
focus-visible:ring-offset-card motion-reduce:transition-none
motion-reduce:hover:translate-y-0`

Note the asymmetric padding — `pl-4 pr-1.5` — because the trailing arrow sits
in its own circle: `relative grid h-5 w-5 place-items-center rounded-full
bg-white/20 transition-transform duration-300 group-hover/cta:translate-x-0.5`
with an `ArrowRight` icon size 12.

A diagonal light sweep crosses the button on hover:
`pointer-events-none absolute inset-y-0 -left-8 w-8 -skew-x-12 bg-white/25
opacity-0 transition-transform duration-700 ease-premium
group-hover/cta:translate-x-[220px] group-hover/cta:opacity-100
motion-reduce:hidden`.

Accessible label: `Open {title}`.

### 6.10 Card on mobile

The grid already collapses to one column, so the card works as-is. Changes:

- **The hover sweep, the hover lift and the stack lift have no touch
  equivalent.** Drop the sweep entirely rather than firing it on tap. Keep an
  `active:` press state on the card and the Open button instead.
- The card itself is **not tappable** on web — only the Open button is. On a
  phone make the whole card tappable and keep the Open button as the visible
  affordance, since a 24px-tall button is otherwise the only target on a large
  card.
- Raise the Open button to at least 44px tall.
- Keep the 3px accent rule, both metric columns, the momentum floor and the
  avatar stack unchanged.

---

## 7. Table view

Table and pagination share one rounded card — the table is the body, the
pagination is the footer:
`overflow-hidden rounded-2xl border border-[rgba(20,20,30,0.08)]
shadow-[0_1px_2px_rgba(16,24,40,.04),0_4px_16px_rgba(16,24,40,.06)]`.
This matches the deals and reports tables.

### 7.1 Columns

Desktop only (`hidden md:block overflow-x-auto`). Header
`bg-muted/50 border-b border-border`, cells `px-4 py-3`, body rows
`divide-y divide-border`.

| Column | Sortable | Notes |
|---|---|---|
| checkbox | no | `w-12`, header checkbox supports an indeterminate state |
| Project Name | **yes** (`name`) | shows `projectNomen` or the literal `Default` |
| Assigned User | no | avatar pill |
| **Distribution** | no | see 7.3 |
| Created At | **yes** (`createdAt`) | |
| Modified At | **yes** (`modifiedAt`) | |
| Actions | no | `w-24` |

Sort header: `flex items-center space-x-2 text-sm font-medium text-foreground
hover:text-primary transition-smooth`, with `ArrowUpDown` (size 16,
`text-muted-foreground`) when inactive and `ArrowUp` / `ArrowDown`
(`text-primary`) when active. The sort key must drive **both** the click
handler and the arrow — they were mismatched once, so the arrow lit up on a
column other than the one clicked.

Sorting is server-side and resets to page 1. Clicking the active column flips
direction; clicking a new column starts ascending.

Row: `hover:bg-sky-50 cursor-pointer transition-smooth`; the whole row opens
the drawer. The checkbox cell and the actions cell stop propagation so
neither opens it.

Under the project name, **the client nomen is shown to admins only**
(`mt-0.5 text-xs text-muted-foreground`). Non-admins never see that line.

### 7.2 Assigned user pill

`inline-flex items-center gap-2 pl-1 pr-2.5 py-0.5 rounded-full bg-slate-50
border border-slate-200 hover:bg-slate-100 transition-colors max-w-full`,
with a `w-6 h-6 rounded-full` initials chip at `text-[10px] font-bold
text-white` and the name at `text-sm font-medium text-slate-700 truncate`.
No assignee renders an em dash at `text-sm text-muted-foreground`.

Palette — the **eight-colour** set, shared with the deals table and the
assigned-user chart so the colour for a rep stays the same across modules:

```
#6366F1  #22C55E  #F59E0B  #EF4444
#06B6D4  #8B5CF6  #EC4899  #14B8A6
```

Initials here are **first plus last** (`Rishab Saxena` becomes `RS`), unlike
the first-two-words rule used elsewhere in the app. A single-word name gives
one letter.

### 7.3 Distribution cell — the discoverability answer

This column exists for one reason: lead distribution used to live behind an
`Enable Configuration` checkbox inside a drawer tab, where nobody would find
it unless told. Putting the state on every row is the fix. **Do not drop it.**

It reads the fields already on the row — no extra request — so the whole table
can show it for free.

- No members at all: `Not set up` at
  `text-sm text-muted-foreground whitespace-nowrap`
- Otherwise a mode pill, `inline-flex items-center gap-1 rounded-full px-2
  py-0.5 text-xs font-semibold`:
  - Custom: `bg-indigo-50 text-indigo-700 border border-indigo-200`
  - Round robin: `bg-emerald-50 text-emerald-700 border border-emerald-200`
- Then `N member` / `N members` at `ml-2 text-xs text-muted-foreground`,
  counting **active** members only
- Then, only when some are paused, `N paused` at
  `ml-2 rounded-full bg-orange-50 px-1.5 py-0.5 text-[11px] font-semibold
  text-orange-700 border border-orange-200`

**Paused is called out rather than folded into the count.** No return date is
stored, so nothing else reminds anyone to switch someone back on — a rep can
sit paused for weeks on quietly falling numbers.

### 7.4 Actions column, and the ownership split

`flex items-center space-x-1`, ghost icon buttons at `h-8 w-8`:

- **Own record** → `Edit` (icon size 14) and `Trash2` (size 14,
  `text-destructive hover:text-destructive`)
- **Not own record** → a single `Eye` (size 14,
  `text-sky-600 hover:text-sky-700`), label `View project`

The eye is a fallback so the column has something to click instead of empty
space, and it opens the same drawer that clicking the row does.

Delete goes through a native confirm reading
`Delete Project {name}?`. There is also a styled `ConfirmDeleteModal`
component in this folder — see section 12.

A **record-level permission check** runs before the request, against the ACL
scope `CProjects` — matching the REST endpoint — **not** `Project`. The wrong
name made the guard always resolve to no and blocked deletes the backend
actually allows. On failure: `You do not have permission to delete this
project`.

### 7.5 Mobile cards in table view

`space-y-4 px-3 pb-4 pt-5`. Card:
`group relative cursor-pointer overflow-hidden rounded-2xl border bg-card p-4
shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all hover:-translate-y-0.5
hover:shadow-md active:scale-[0.99]`, border `border-border` normally and
`border-[#6E1420]/40 ring-1 ring-[#6E1420]/20` when selected.

A maroon rail runs down the left edge: `absolute inset-y-0 left-0`, `w-1
bg-[#6E1420]/25` normally, thickening to `w-1.5 bg-[#6E1420]` when selected.
The checkbox alone was the only selection cue and it is easy to miss at arm
length.

Content `flex items-start gap-3 pl-1.5` — checkbox (`mt-0.5`), then a
`min-w-0 flex-1` column:

1. Title row — project `name` at `truncate text-[15px] font-semibold
   text-foreground`, with a `ChevronRight` size 16 at
   `mt-0.5 shrink-0 text-muted-foreground group-hover:translate-x-0.5`
2. Short-name line, conditional — a `Layers` icon size 12 plus the
   `projectNomen` (or full name when that is `Default`), at
   `mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground`.
   **Hidden when it would merely repeat the title.** It shows the short name
   rather than the address, because the address is blank on most records and
   that line was usually missing entirely.
3. Footer row behind a divider — `mt-3 flex flex-wrap items-center gap-x-3
   gap-y-2 border-t border-border/60 pt-3`: the assignee pill (smaller:
   `h-5 w-5` chip at `text-[9px]`, `py-0.5 pl-0.5 pr-2.5`) and, pushed right
   with `ml-auto`, a `Calendar` icon size 12 plus the created date at
   `text-xs text-muted-foreground`.

The divider is what gives the card a head and a foot rather than four stacked
lines.

**The deviation.** This card has **no Distribution line** — the one column
that makes the feature discoverable vanishes on a phone. Add it, as a fourth
element in the footer row or as its own line above the divider, using the
exact pill and count treatment from 7.3. Keep the mode pill at full size; it
is the single most useful thing on the card.

Loading: five `animate-pulse p-4` blocks in a `divide-y divide-border`
container, each a `h-4 w-32` bar over a `h-3 w-24` bar.
Empty: `flex items-center justify-center h-[200px] text-gray-400 text-sm`
with `No projects available`.

Note the desktop empty state uses the same copy but the cards view uses
`No projects found`. Reproduce both.

---

## 8. Pagination

`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card
border-t border-border`.

**Renders nothing when there is one page or fewer.** The screen simply ends.

- Left: `Showing X to Y of Z results`, all locale-formatted, at
  `text-sm text-muted-foreground`; beside it a per-page select
  (`w-32`, options 10 / 25 / 50 / 100, labelled `N per page`) that is
  `hidden sm:block`.
- Centre: `Previous`, the page numbers, `Next`. Previous and Next are outline
  buttons at `h-9 px-3` whose **labels are hidden below `sm`** — the chevron
  carries them on a phone. Page buttons are `h-9 w-9 p-0`, the current page
  filled (`variant="default"`), the rest outline. Ellipses are plain text at
  `px-3 py-2 text-sm text-muted-foreground`.
- Bottom: the per-page select again, `sm:hidden w-full`, this time with a
  visible `Items per page` label.

So the per-page control is rendered **twice** and swapped by breakpoint, with
a label on mobile and none on desktop. Keep that — a bare select at the bottom
of a phone screen needs the label.

Page window: the current page plus or minus 2, always with the first and last
page, with ellipses inserted when there is a gap.

Changing the page size resets to page 1.

Placement differs by view:

- **Table view** — inside the rounded card, as its footer, sharing the border
  and corners.
- **Cards view** — free-standing below the grid, outside any card.

### 8.1 Pagination on mobile

Numbered pagination is a poor fit for touch. Either keep it with every target
raised to 44px, or replace the number strip with `Page N of M` between two
44px chevron buttons and keep the results line and the labelled per-page
select. Do not switch to infinite scroll while selection and bulk actions
exist — selecting across an endless list has no sensible meaning here.

---

## 9. Project drawer

Opened by a card Open button, a table row, or the row Edit / View actions.
Also opened in two non-record modes: `add` (New Campaign) and `mass-update`
(the bulk action).

### 9.1 Tabs

Three, in this order:

| id | Label | Icon |
|---|---|---|
| `distribution` | Lead Distribution | `Share2` |
| `overview` | Overview | `Eye` |
| `Teams` | Teams / Collaborators | `Users` |

**Lead Distribution is first and is the default.** It resets to the default on
every open, keyed on both the open flag and the project id.

Tab strip: `flex items-center gap-1 overflow-x-auto border-b border-border
bg-muted/40 px-4 py-2.5` — a **tinted strip with a pill for the active tab**,
so the bar reads as navigation rather than three loose buttons floating on
white.

Tab button: `group flex shrink-0 items-center gap-2 whitespace-nowrap
rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200
ease-premium`. Active `bg-[#AC2334] text-white shadow-md
shadow-[#AC2334]/25`; inactive `text-muted-foreground hover:-translate-y-0.5
hover:bg-card hover:text-foreground hover:shadow-sm`.

Icon size 16 with `transition-transform duration-200 group-hover:scale-110` —
**the icon leads the hover**, moving before the label does, which is what
makes a tab feel responsive rather than merely coloured. On mobile that hover
is unreachable; drop it rather than binding it to tap.

The strip already scrolls horizontally, which is what a phone needs. Keep the
`py-2` height so each tab clears 44px.

Content region: `flex-1 overflow-y-auto p-6`.

### 9.2 Drawer loading behaviour, and why it matters visually

The drawer opens from **the row already in hand**, then the by-id fetch fills
in what the list endpoint omits (chiefly `collaboratorsNames`). The fetched
copy is merged over the row and wins as soon as it lands.

Before this, the drawer was handed only the fetched record, so clicking a
project showed an **empty panel** until the request returned — even though the
list response already held the name, nomen, dates, configuration and
collaborator ids.

So on mobile: open the sheet populated from the row immediately. Never show a
blocking spinner for data you already have.

### 9.3 Overview and Teams tabs

Out of scope for this document, which covers project and lead distribution.
Two notes that affect distribution:

- The **Teams / Collaborators** tab has its own collaborator picker. Adding
  someone there is **exactly the same operation** as adding them in the
  distribution panel — their id goes into `collaboratorsIds`. Two pickers,
  one effect. Do not let them diverge.
- The Overview form includes a WhatsApp notification toggle and a message
  template. Editing the template invalidates a separately cached project
  options list — the lead drawer WhatsApp pitch reads it, and without the
  refresh an edited template keeps going out.

---

## 10. Lead Distribution panel

The centre of this screen. Container `space-y-6 pb-20` — the bottom padding
clears the sticky save bar.

Five blocks, in render order:

1. At-a-glance stat row
2. Mode card (`How should leads be shared?`) plus the expected-volume stepper
3. Team list
4. Sticky save bar — **conditional**
5. Today split preview

It lives in the drawer because that is where the data lives: the three fields
it edits all belong to the project record. A copy of this in Settings would
mean two screens writing the same three fields, which is how they end up
disagreeing.

### 10.1 Every change is a draft until Save

Toggling someone off, retyping a count and switching mode all edit **local
state only**. One request goes out when Save is pressed, carrying just the
three distribution fields.

Batched rather than saved per action on purpose: setting up a campaign means
several changes in a row, and firing a request per change both hammers the
gateway and leaves the campaign in half-applied states if one call fails. One
save is also one thing to undo — Discard puts everything back to what the
server holds.

Two rules the visuals depend on:

- **Dirty** means local differs from the server. It drives the save bar.
- **Touched** means the *user* changed something. It is tracked separately,
  and it is not optional.

Why both: the drawer seeds its draft from the list row, which carries no
collaborator ids, so the draft starts empty and the full record arrives a beat
later. At that instant dirty flips true through no action of the user — and a
sync that skips while dirty would then never run. That is the bug where every
member read **Paused** on first open and was correct on the second. The panel
follows the server while untouched, and a user edit outranks a background
refresh. A new project id resets the verdict.

### 10.2 Shared helpers

Member avatar colours — an **eight-colour** palette, picked by a
multiply-and-add hash of the member **id** (not the name):

```
#2563EB  #C2410C  #0D9488  #7C3AED
#BE185D  #0369A1  #B45309  #4338CA
```

Keyed on id so a rename never moves someone colour, and so the same person is
the same colour in the member list, the split bar and the next-up chip.

Initials: first letter of each of the first two whitespace-separated words,
upper-cased, falling back to `?`.

The stat tiles reuse the KPI accent derivation from section 4.1.

### 10.3 Section heading component

`flex flex-wrap items-start gap-x-3 gap-y-2`:

- Icon tile: `grid h-9 w-9 shrink-0 place-items-center rounded-xl
  bg-[#AC2334]/10 text-[#AC2334]`, icon size 17
- Title: `min-w-0 flex-1 self-center text-base font-semibold text-foreground`
- Optional action, inline on the first row
- Optional subtitle: `w-full text-xs leading-relaxed text-muted-foreground`

**The subtitle is a sibling of the title, not nested under it**, so it wraps to
its own full-width line. Nested, it shared the row with the action button and
was squeezed into whatever width that left — on a phone, four words tall
beside the Add Member button. The `w-full` plus the parent flex-wrap is what
moves it down; icon, title and action keep the first line to themselves.

### 10.4 At-a-glance stat row

`grid grid-cols-2 gap-3 lg:grid-cols-4`.

| Label | Icon | Accent |
|---|---|---|
| Team members | `Users` | `#6366F1` |
| Getting leads now | `UserCheck` | `#10B981` |
| On leave | `PauseCircle` | `#F59E0B` |
| Expected leads today | `TrendingUp` | `#8A1B29` |

Tile: `group relative overflow-hidden rounded-2xl border border-border bg-card
p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all duration-300
ease-premium hover:-translate-y-1
hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--kpi-glow)]`
plus the inline wash gradient from 4.1. No corner glow blob here — only the
page KPI row has that.

Icon tile `mb-3 grid h-9 w-9 place-items-center rounded-xl
group-hover:scale-105`, icon size 17. Then the value at `text-2xl font-bold
leading-none tabular-nums tracking-tight text-foreground`, then the label at
`mt-1.5 text-xs font-medium text-muted-foreground` — **value above label**,
the opposite of the page KPI cards.

Every number is already derived elsewhere on the panel; nothing extra is
fetched. The row exists because the panel answers "who gets leads and how
many", and that answer was previously only readable by counting rows in the
list below.

Note the vocabulary: **On leave**, not Paused, and **Getting leads now**, not
Active. The stat row is written for someone scanning, the list below is
written for someone editing.

### 10.5 Mode block

Card `rounded-xl border border-border bg-card p-5`.

Heading: icon `Share2`, title `How should leads be shared?`, subtitle
`Choose a distribution method to decide how leads are assigned to team
members.`

Two mode cards, `mt-4 flex flex-col gap-3 sm:flex-row` — **stacked on a
phone**, side by side from `sm`.

Mode card: `flex-1 rounded-xl border p-4 text-left transition-all`, with
`aria-pressed`. Active `border-[#AC2334] bg-[#AC2334]/[0.04] shadow-sm`;
inactive `border-border bg-card hover:border-border/80 hover:bg-muted/30`.

Inside: a custom radio — `grid h-4 w-4 shrink-0 place-items-center
rounded-full border-2`, `border-[#AC2334]` when active with an inner
`h-2 w-2 rounded-full bg-[#AC2334]`, else
`border-muted-foreground/40` — then the title at `text-sm font-semibold
text-foreground`, then the body at `mt-1.5 block text-xs leading-relaxed
text-muted-foreground`.

| Title | Body |
|---|---|
| `Equal (Round robin)` | `Leads go one by one to each active member in turn. Everyone gets the same number.` |
| `Custom numbers` | `Fix how many leads a day someone gets. Everyone else shares the rest equally.` |

The copy is written for a non-technical reader and carries the whole
explanation. There is no help icon and no tooltip on these two cards; the body
text is the documentation. Keep it in full — truncating it to fit a phone
removes the only explanation of the feature.

### 10.6 Expected leads per day

A divided footer in the same card: `mt-4 flex flex-wrap items-center gap-3
border-t border-border pt-4`.

- Icon tile: `grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted
  text-muted-foreground` with `BarChart3` size 16 — **neutral, not the maroon
  tile**, because this is an input and not a section heading
- Label: `Expected leads per day` at `text-sm font-medium text-foreground`
- Stepper: minus button, input, plus button at `flex items-center gap-1`
  - Buttons `grid h-8 w-8 place-items-center rounded-lg border border-border
    text-muted-foreground hover:bg-muted`, icons `Minus` / `Plus` size 14,
    labelled `Fewer leads` and `More leads`
  - Input `h-8 w-16 rounded-lg border border-border bg-background text-center
    text-sm font-semibold tabular-nums text-foreground focus:ring-2
    focus:ring-primary/30`, `inputMode="numeric"`
  - Floors at 0; no upper bound. Unparseable input becomes 0
- Note: `Used to plan the split. Not saved — if more leads come in, they keep
  rotating.` at `text-xs text-muted-foreground`

**This value is never persisted.** It defaults to 10 on every open. It answers
"if N leads arrive today, who gets them", which is a question about the future,
not a property of the campaign. The note must stay — without it, a number box
sitting beside real saved settings reads as a setting.

It is deliberately **outside** the save bar logic: changing it never makes the
panel dirty.

### 10.7 Team list

Card `rounded-xl border border-border bg-card p-5`.

Heading: icon `Users`, title `Team (N)`, action the Add Member button, and a
subtitle that **changes with the mode**:

| Mode | Subtitle |
|---|---|
| Equal | `Everyone active shares the day equally. Switch to Custom numbers to fix someone’s share.` |
| Custom | `Type a number to fix someone’s leads per day. Leave it blank for Auto: they share whatever is left, equally.` |

Add Member button: `inline-flex shrink-0 items-center gap-1.5 rounded-lg
bg-[#AC2334] px-3 py-1.5 text-sm font-semibold text-white transition-opacity
hover:opacity-90`, `Plus` icon size 15. It toggles the picker, and **clears the
search each time it opens** so a previous query cannot hide the person being
looked for now.

### 10.8 Column headings

`mt-4 hidden items-center gap-3 border-b border-border pb-2 sm:flex`, each
`text-[11px] font-semibold uppercase tracking-wide text-muted-foreground`:
a `w-9` spacer, `Member` (`min-w-0 flex-1`), `Leads/day` (`w-20 text-center`),
`Status` (`w-[104px]`), a `w-9` spacer.

They exist because without them the number box and the toggle are two
unlabelled controls — a reader cannot tell what either one does, or that the
greyed box is greyed because Round robin is on.

**Hidden below `sm`.** The headings belong to the table layout; on a phone the
row stacks and the headings had nothing to sit over, so `MEMBER` and
`LEADS/DAY` collided into one word. Shown only when there is at least one
member.

### 10.9 Member row

Container `divide-y divide-border`. Row:
`flex flex-col gap-3 py-3.5 sm:flex-row sm:flex-wrap sm:items-center`, plus
`opacity-60` when paused.

**Two lines on a phone, one row from `sm`.** Five fixed-width controls do not
fit 360px: the name truncated to two characters, its sub-line wrapped to two,
and the numbers crowded the toggle. Below `sm` the avatar and name take the
first line and the controls the second, where they have room to be tapped. The
web build does this with two wrapper divs that become `sm:contents` — reproduce
the *behaviour*, by whatever means the platform offers.

Line one — `flex min-w-0 items-center gap-3 sm:contents`:

- Avatar: `grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs
  font-bold text-white`, colour from 10.2
- Name: `truncate text-sm font-semibold text-foreground`
- Sub-line: `text-xs text-muted-foreground`, one of:
  - `Paused — not receiving leads`
  - `N a day` when a fixed count is set
  - `Auto`

Note the sub-line states the paused reason **before** the number, so a paused
member never shows a count that is not being honoured.

Line two — `flex items-center gap-3 sm:contents`:

- **Number input** — `h-9 w-20 shrink-0 rounded-lg border border-border
  bg-background px-2 text-center text-sm tabular-nums text-foreground
  focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed
  disabled:bg-muted disabled:opacity-60`, placeholder `Auto`,
  `inputMode="numeric"`.
  Disabled in Equal mode **and** when the member is paused. Tooltip:
  `Switch to Custom numbers to set a fixed share` when disabled by mode,
  `Leads per day. Blank = Auto` otherwise.
  **Commits on blur, not on change** — it is an uncontrolled field seeded from
  the stored count. Blank, non-numeric or below 1 all mean Auto, which deletes
  the row.
- **Toggle plus its word** — `flex flex-1 items-center gap-2 sm:w-[104px]
  sm:flex-none sm:shrink-0`:
  - Switch: `relative h-6 w-11 shrink-0 rounded-full border transition-colors`
    — paused `border-[#C2410C] bg-[#C2410C]`, active
    `border-emerald-600 bg-emerald-500`
  - Knob: `absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow
    transition-transform`, `translate-x-[2px]` active,
    `translate-x-[22px]` paused
  - Label: `text-xs font-semibold`, `Paused` in `text-[#C2410C]` or `Active`
    in `text-emerald-700`
  - `role="switch"` with `aria-checked` set to **paused**, label
    `Pause {name}` / `Resume {name}`, tooltips
    `Pause — stop sending leads while they are away` and
    `Resume — start sending leads again`

  The word beside the switch is not decoration. The switch alone was almost
  invisible when off — a pale ring with no label — so nobody could tell it was
  a control, let alone which way it was set.

  Note the toggle moves **right to pause**, and `aria-checked` tracks paused
  rather than active. Unusual, but the visual and the semantics agree, so keep
  both or flip both.

- **Remove button** — `grid h-9 w-9 shrink-0 place-items-center rounded-lg
  border border-border text-muted-foreground transition-colors
  hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600`, `Trash2`
  size 15, tooltip `Remove from this project`.

The controls are pushed apart on the second line so the delete button is not
next to the toggle by accident. On a phone, keep that separation and raise
every target to 44px — pause and remove sitting adjacent at 36px is a real
mis-tap risk, and remove has no confirmation.

Empty state: `mt-4 text-sm italic text-muted-foreground` reading
`No collaborators on this project yet. Add them under Teams / Collaborators.`

### 10.10 Add-member picker

Shown inline below the heading when open:
`mt-4 rounded-xl border border-border bg-muted/30 p-3`.

**Two different empty states, for two different problems:**

- The pool is empty before any search — `Everyone available is already on this
  project.` at `text-sm italic text-muted-foreground`. The search field is not
  rendered at all in this case.
- The pool has people but the query matches none — `No one matches “{query}”.`
  at `px-2 py-3 text-sm italic text-muted-foreground`, with curly quotes around
  the query.

Those are different fixes — one means remove someone first, the other means
retype. Collapsing them into one message loses that.

Otherwise:

- Caption: `Add to this project` at `mb-2 text-xs font-semibold uppercase
  tracking-wide text-muted-foreground`
- Search: `h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9
  text-sm text-foreground placeholder:text-muted-foreground focus:ring-2
  focus:ring-primary/30`, placeholder `Search name or username…`, autofocused,
  with a `Search` icon size 15 inset left and — only when there is a query — a
  clear button at `absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2
  place-items-center rounded-full text-muted-foreground hover:bg-muted
  hover:text-foreground` with an `X` icon size 13
- Results: `max-h-48 space-y-1 overflow-y-auto`

Result row: `flex w-full items-center gap-2 rounded-lg border
border-transparent px-2 py-2 text-left text-sm text-foreground
transition-colors hover:border-[#AC2334]/25 hover:bg-[#AC2334]/[0.07]
hover:text-[#AC2334]`.

**The hover state is a tinted maroon surface with a border, not white.** These
rows sit on a tinted panel, so hovering to white alone was almost
indistinguishable from not hovering, and you could not tell which name you were
about to add. On mobile, use that same treatment as the pressed state.

Inside: a `grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px]
font-bold text-white` avatar, the name at `min-w-0 flex-1 truncate text-left`,
and — only when a username exists and differs from the name — `@username` at
`shrink-0 text-xs text-muted-foreground`.

**Search matches the display name OR the login name.** The list shows `Aarti`
but people search for `aarti_2`, and vice versa. The pool is every active user
not already on the project, sorted alphabetically by display name. Inactive
users are excluded.

Adding someone writes **both** fields: their id into `collaboratorsIds`, and a
configuration row with a count of 1 so a later switch to Custom has something
to edit. Ids are deduped on the way in. The picker closes and the query clears.

### 10.11 Sticky save bar

**Present only while there is something to save.**

`sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border
border-[#AC2334]/30 bg-[#AC2334]/[0.04] px-4 py-3 backdrop-blur`

- `AlertCircle` icon size 16, `shrink-0 text-[#AC2334]`
- Message: `You have unsaved distribution changes.` at
  `min-w-0 flex-1 text-sm text-foreground`
- `Discard` — `rounded-lg border border-border bg-card px-3 py-1.5 text-sm
  font-medium text-foreground hover:bg-muted disabled:opacity-50`
- `Save changes` — `rounded-lg bg-[#AC2334] px-4 py-1.5 text-sm font-semibold
  text-white transition-opacity hover:opacity-90 disabled:opacity-50`,
  label becoming `Saving…` while in flight

A bar that is always there gets ignored; one that appears the moment you
change something is the reminder that the change has not landed yet. Keep it
conditional.

The `-mx-1` lets it bleed slightly past the content width so it reads as a
bar rather than another card. On mobile, pin it above the safe-area inset and
raise both buttons to 44px; the two buttons plus the message will wrap, which
`flex-wrap` already allows.

Discard restores the server state exactly and clears the touched verdict.

### 10.12 Today split preview

Card `rounded-xl border border-border bg-card p-5`. Heading: icon `PieChart`,
title `Today’s split`, subtitle:

> `Based on N lead today.` / `Based on N leads today.` — then
> `A plan, not a record — the CRM does not store who received what on a given
> day.`

The singular and plural both matter; so does the disclaimer. Do not shorten it.

**Stacked bar** — `mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted`,
one segment per member with a share above zero, width
`share / expected * 100` percent, background the member colour, `title` set to
`{name}: {share}`.

**Legend** — `mt-4 space-y-2`, one row per member in the split at
`flex items-center gap-2 text-sm`: a `h-2.5 w-2.5 shrink-0 rounded-full` dot,
the name (`min-w-0 flex-1 truncate text-foreground`) followed by the word
`auto` or `fixed` at `text-muted-foreground`, then the share at
`font-semibold tabular-nums text-foreground`.

Note the legend lists **every active member**, including those on a share of
zero, while the bar only draws non-zero segments. Someone allocated nothing
still needs to appear, or they look absent rather than empty-handed.

Empty: `mt-4 text-sm italic text-muted-foreground` reading
`Nobody is set to receive leads on this project.`

**Paused footnote** — only when someone is paused:
`mt-4 border-t border-border pt-3 text-xs text-muted-foreground`, with the
names in `font-medium text-foreground`:

> **Paused: {names, comma-separated}.** Their share goes to the rest of the
> team.

**Next-up chip** — only when there is a non-zero share and at least one active
member: `mt-4 flex items-center gap-2 border-t border-border pt-3`, an
`h-8 w-8` avatar at `text-[11px] font-bold`, then
`Next lead goes to {name}` at `text-sm text-muted-foreground` with the name in
`font-semibold text-foreground`.

The next-up member is simply the first in the split with a share above zero —
list order, not a live rotation pointer. The CRM stores no pointer, so this is
a reasonable guess presented as a statement. That is acceptable at this
precision, but do not add a countdown, a queue position or anything else that
implies the rotation state is actually known.

### 10.13 The panel on mobile

The panel is already responsive — every block has a phone layout. Required
changes:

1. All targets to 44px: the toggle, the remove button, the volume stepper, the
   number input, the picker rows, both save-bar buttons.
2. The save bar pins above the safe-area inset.
3. The number input commits on blur, and on a phone blur is unreliable — a
   user can tap Save directly from the focused field. **Commit the focused
   input before saving**, or the typed number is silently dropped. This is the
   single most likely functional regression in the port.
4. Keep the mode-card body copy and every disclaimer in full.
5. Drop hover-only affordances: the tile lift, the icon scale, the
   hover-tinted picker row becomes a pressed state.

---

## 11. Motion inventory

| Element | Motion |
|---|---|
| KPI card, stat tile, project card | `hover:-translate-y-1`, shadow swap, 300ms `ease-premium` |
| KPI icon tile | `group-hover:scale-105` |
| Corner glow blob | opacity 70 to 100 on hover, 300ms |
| Card accent rule, metrics panel | static |
| Momentum bar | `transition-[width] duration-700 ease-premium` |
| Active status dot | `animate-pulse-ring`, hidden under reduced motion |
| Avatar stack | `group-hover:-translate-y-0.5`, 300ms |
| Open button | lift, shadow, arrow nudge, and a 700ms diagonal sweep |
| Drawer tab | `transition-all duration-200 ease-premium`; icon `scale-110` ahead of the label |
| Table row | `hover:bg-sky-50 transition-smooth` |
| Mobile project card | `hover:-translate-y-0.5`, `active:scale-[0.99]` |
| Mode card, toggle, pills | `transition-colors` / `transition-all` |
| Toggle knob | `transition-transform` |
| Save bar | appears and disappears with no transition |
| View toggle | `transition-colors` only — the pill does not slide |

`ease-premium` is the shared `cubic-bezier(0.2, 0.8, 0.2, 1)`.

Every lift and every sweep carries `motion-reduce:` guards on web. **Keep
them.** The pulse ring and the diagonal sweep are `motion-reduce:hidden` —
removed outright, not slowed.

For mobile, the only additions worth making: a sheet enter and exit
transition, and a brief colour transition when the save bar appears. Everything
hover-driven has no touch equivalent and should be dropped rather than
remapped to tap.

---

## 12. Present but not used

- **`ConfirmDeleteModal`** — a styled confirmation dialog exists in this
  folder and is **not imported**. Both deletes use the native browser confirm:
  `Delete Project {name}?` for a single row and
  `Delete N selected projects?` for the bulk action. On mobile a native
  confirm is acceptable, but if you build a styled dialog instead, use this
  component as the design: backdrop `fixed inset-0 bg-black/50 z-40`, panel
  `bg-background border border-border rounded-lg w-full max-w-md p-6
  shadow-lg`, a `w-10 h-10` destructive-tinted circle with a `Trash2` icon
  size 20, title at `text-lg font-semibold`, description at
  `text-sm text-muted-foreground mt-1`, and `Cancel` plus a destructive
  `Delete` right-aligned.
- **CSV export** — the helper exists and is wired to an `export` bulk action
  whose menu entry is commented out. Nothing can trigger it. Do not port.
- **`Export All`** — a commented-out button in the filter card. Do not port.
- **`between` date filter** — handled in the code but absent from the options
  list, so its second date input never renders. Do not build it.
- **`isSidebarOpen` state** and the menu-toggle handlers are unused leftovers
  from a previous layout.
- **The `currentPage` and `itemsPerPage` props on the table** are passed but
  ignored. Pagination is fully server-side; the table treats its rows as an
  already-paged slice. Slicing again double-paginated and rendered an empty
  table on page 2.

---

## 13. Toasts

| Action | Loading | Success | Failure |
|---|---|---|---|
| Create project | — | `Project created successfully` | `Project is not created!` |
| Update project | — | `Project Update successfully` | `Project is not Update!` |
| Bulk update | `Updating projects...` | `N Projects updated` | `Mass update failed` |
| Delete | `Deleting Project...` | `Project deleted successfully` | `Failed to delete Project` |
| Bulk delete | `Deleting projects...` | `Project deleted successfully` | `Failed to delete Project` |
| Export with nothing selected | — | — | `No data to export` |
| Bulk action with nothing selected | — | — | `Please select at least one task` |
| Bulk delete with nothing selected | — | — | `Please select at least one projects` |
| Delete without permission | — | — | `You do not have permission to delete this project` |

The grammar is inconsistent — `Project is not Update!`, `at least one
projects`, `at least one task` on a project screen. Reproduce it verbatim
anyway, for the reason in section 0: a silent divergence between the two
builds is worse than a visible wart. Fix it in both at once or not at all.

Loading toasts are replaced in place by their result, keyed per operation, so
a failure dismisses the spinner rather than leaving it turning forever.

---

## 14. Acceptance checklist

Naming and structure

- [ ] All three names reproduced: route `/campaigns`, sidebar `My Campaigns`,
      heading `My Projects`, button `New Campaign`
- [ ] Subtitle emphasises **lead distribution** at `font-medium
      text-foreground` inside grey body text
- [ ] Six regions in order: header, KPI row, filters plus view toggle, body,
      pagination, drawer
- [ ] Cards is the default view; the choice is not persisted
- [ ] `TricolorBurst` honours the festive on/off switch

KPI row

- [ ] Two columns on a phone, four from `lg`
- [ ] Four cards in order with the exact labels, icons and accents
- [ ] Only Unassigned has a sub-line, and it is the only red text
- [ ] One accent hex drives tile 0.12, wash 0.06, blob 0.22, halo 0.35
- [ ] Icon above value on a phone, beside it from `sm`
- [ ] Lead counts scope to **every** filtered campaign, not the visible page
- [ ] A filter matching zero campaigns shows **0**, not everything
- [ ] Em dash placeholder while unresolved; previous data kept during refetch
- [ ] No fabricated `Avg response` metric

Project card

- [ ] Six accent sets rotated by index; index 0 is the maroon
- [ ] Accents delivered as CSS custom properties, not five copies per card
- [ ] Five-colour avatar palette, distinct from the accents and from the
      table palette
- [ ] 3px gradient rule across the top
- [ ] Title is `projectNomen` unless empty or `Default`; subtitle is
      `clientNomen` or the literal `Project`
- [ ] Both are humanized — `GangaCounty` renders as `Ganga County`
- [ ] Status pill reads `Active` / `Steady`, never `Inactive`
- [ ] Active means a lead arrived today; the dot pulses, hidden under reduced
      motion
- [ ] Last activity reads `Active today` / `1 day ago` / `N days ago` /
      `No activity`
- [ ] Location line omitted entirely when both fields are empty
- [ ] Metrics panel has two columns and a 1px divider
- [ ] New Today shows `+N`, turns emerald and gains a trend icon when positive
- [ ] Momentum bar floors at 4 percent above zero, is 0 at zero, and the label
      prints the true value with one decimal below 10 percent
- [ ] Momentum carries progressbar ARIA
- [ ] Up to 4 avatars then a `+N` chip; `N member` / `N members` pluralised
- [ ] Open button has asymmetric padding and an arrow in its own circle
- [ ] 26px grid gutter
- [ ] On mobile the whole card is tappable and the sweep is dropped

Table view

- [ ] Table and pagination share one rounded card
- [ ] Seven columns in order; Project Name, Created At and Modified At sortable
- [ ] Sort arrow lights up on the column actually clicked
- [ ] Client nomen under the project name is **admin only**
- [ ] Assignee pill uses the eight-colour palette and first-plus-last initials
- [ ] **Distribution column present**, with the mode pill, the active count
      and the separate paused chip
- [ ] `Not set up` when there are no members
- [ ] Own records get Edit and Delete; others get a single blue Eye
- [ ] Delete checks the ACL scope `CProjects`, not `Project`
- [ ] Mobile card has the maroon rail, thickening when selected
- [ ] Mobile short-name line is hidden when it repeats the title
- [ ] **Distribution added to the mobile card** (section 7.5)
- [ ] `No projects available` in table view, `No projects found` in cards view

Pagination

- [ ] Renders nothing at one page or fewer
- [ ] Per-page control rendered twice, labelled on mobile only
- [ ] Previous and Next labels hidden below `sm`
- [ ] Page window is current plus or minus 2 with first, last and ellipses
- [ ] Inside the card in table view, free-standing in cards view

Drawer

- [ ] Three tabs; **Lead Distribution first and default**
- [ ] Default tab restored on every open, keyed on project id
- [ ] Tinted strip with a pill for the active tab
- [ ] Sheet opens populated from the row, with no blocking spinner

Distribution model

- [ ] Membership is `collaboratorsIds`; counts are `configuration`; mode is
      `enableConfiguration`
- [ ] Switching to Equal **disables** the number inputs, it does not clear them
- [ ] A paused member keeps their configuration row
- [ ] Absence of a row means Auto; clearing the input deletes the row
- [ ] Rows split on first and last colon, so colons in names survive
- [ ] Ids deduped on display and on add
- [ ] Name resolution: server map, then configuration, then raw id
- [ ] Row order follows `configuration`; **pausing never moves a row**

Distribution panel

- [ ] Five blocks in order, with `pb-20` clearance for the save bar
- [ ] Every change is a draft; one request on Save carrying three fields
- [ ] Dirty and touched tracked separately, so members do not all read
      `Paused` on first open
- [ ] A new project id resets the touched verdict
- [ ] Member colours keyed on **id**, not name
- [ ] Section subtitles are full-width siblings, not nested under the title
- [ ] Stat tiles put the value above the label, and use `On leave` and
      `Getting leads now`
- [ ] Mode cards stack on a phone and keep their body copy in full
- [ ] Expected-per-day tile is neutral grey, defaults to 10, is never saved,
      and never makes the panel dirty
- [ ] Column headings hidden below `sm`
- [ ] Member row is two lines on a phone, one from `sm`
- [ ] Sub-line states the paused reason before any number
- [ ] Number input commits on blur; blank, non-numeric or under 1 all mean Auto
- [ ] **A focused number input is committed before Save fires** (10.13)
- [ ] Toggle moves right to pause; `aria-checked` tracks paused
- [ ] The word `Paused` / `Active` sits beside the switch
- [ ] Remove is visually separated from the toggle, and both clear 44px
- [ ] Picker has two distinct empty states
- [ ] Picker search matches display name **or** username
- [ ] Picker rows hover or press to a tinted maroon surface, not white
- [ ] Picker clears its query each time it opens
- [ ] Save bar is conditional, sticky, and labels `Saving…` in flight
- [ ] Split subtitle pluralises and keeps the plan-not-a-record disclaimer
- [ ] Bar draws only non-zero shares; the legend lists every active member
- [ ] Each legend row is marked `auto` or `fixed`
- [ ] Paused footnote names them and says their share is redistributed
- [ ] Next-up chip implies nothing more than list order

Motion and copy

- [ ] `ease-premium` is the shared cubic-bezier
- [ ] Pulse ring and diagonal sweep are hidden, not slowed, under reduced
      motion
- [ ] Hover-only affordances dropped on touch rather than remapped to tap
- [ ] The view-toggle pill does not slide
- [ ] Every toast string reproduced verbatim, grammar warts included
- [ ] Ellipsis characters preserved in `Loading campaigns…`, `Saving…`,
      `Updating projects...` and `Deleting Project...` — note the last two use
      three literal dots, not an ellipsis

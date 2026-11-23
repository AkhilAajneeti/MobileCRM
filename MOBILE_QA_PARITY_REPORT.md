# MobileCRM vs Web CRM — Parity QA

Audited: 2026-11-18. Web source: `c:\Users\aclde\Downloads\B2B` (package `crmpro`).
Mobile source: `c:\Users\aclde\Downloads\MobileCRM` (package `aajneeticrm`, Capacitor 8).

Every item below was verified by reading both trees, not inferred from a spec.
Each one names the web file and the mobile file so it can be checked.

## How to read the severity

- **P1 — a user cannot do on mobile something they can do on web.** Data is
  unreachable, or a save writes the wrong thing.
- **P2 — the behaviour differs in a way that will eventually produce a wrong
  number or a confusing screen.**
- **P3 — cosmetic or convenience divergence.**
- **OK by design** — differs because the platform is Capacitor, and should
  stay that way.

---

## 0. Scoreboard

| Surface | Web | Mobile | Verdict |
|---|---|---|---|
| Routes | 27 | 21 | 6 web routes absent |
| Sidebar entries | 17 | 11 | 6 entries absent |
| Lead statuses (drawer) | 23 | 19 | 4 absent — P1 |
| Lead filter panel | 883 lines | 452 lines | several filter modes absent — P1 |
| Lead export | ExportDialog, 271 lines | none | absent — P1 |
| Campaign lead counting | `leadScope.js`, 3-field match | single `equals cProject` | wrong counts — P1 |
| Distribution model | `distribution.js` | `distributionModel.js` | faithful, 3 deltas — P1/P2 |
| Site visits | 4 files | 7 files | faithful, more mobile layout |
| Pipeline funnel | `LeadFunnel.jsx` | none | absent — P2 |
| Design tokens | `:root` hex | same hex plus `-rgb` channels | matches, mobile is better |

---

## 1. Missing routes and navigation

### 1.1 Routes present on web, absent on mobile — P1

Verified in `B2B/src/Routes.jsx` against `MobileCRM/src/Routes.jsx`.

| Web route | What it is | Web size |
|---|---|---|
| `/import` | CSV lead import wizard | 8 files, 2334 lines |
| `/inactive-leads` | leads with no recent activity | 519 lines |
| `/team-performance` | per-rep performance board | 4 files, 1457 lines |
| `/project` | single-project screen | 291 lines |
| `/leads/:leadId` | deep link that opens one lead | — |
| `/tasks/:taskId` | deep link that opens one task | — |

The two deep-link routes matter more than their size suggests. On web a
notification or a shared link opens straight onto the record. On mobile the
same link lands on the list. Since this app already fires local notifications
through `@capacitor/local-notifications` and has `FollowupReminderManager`
mounted above the routes, a tapped reminder currently cannot open the lead it
is about. Add both routes before anything else on this list.

### 1.2 Sidebar entries absent on mobile — P2

`B2B/src/components/ui/Sidebar.jsx` lists 17 entries,
`MobileCRM/src/components/ui/Sidebar.jsx` lists 11. Absent:

- Sales Team — **the page and the route both exist on mobile**
  (`/sales-team`, `pages/sales-team`, 2347 lines, near-identical to web).
  It is simply unreachable from the navigation. One line of config.
- Inactive Leads, Training, Team Performance, Import, Integrations — these
  follow from 1.1, except Integrations, whose page exists on mobile
  (1876 lines) and is also only missing its nav entry.

So two of the six are pure navigation omissions for pages that are already
built and working. Fix those two first; they cost nothing.

### 1.3 Nav label disagreement — P3

Web says `My Projects / Lead Distribution`, mobile says `My Campaigns`. Both
point at `/campaigns`. The web page heading is `My Projects`. Pick one per
surface deliberately rather than by accident; the screen genuinely has three
names and the spec asked for all three to be reproduced.

---

## 2. Leads — the largest gap

Web `pages/deals` is 9038 lines across 15 files. Mobile `pages/deals` is 6143
lines across 15 files. Roughly a third of the behaviour is not there. Some of
that is the desktop table being replaced by `LeadCard.jsx`, which is correct.
The rest is below.

### 2.1 Four lead statuses cannot be set on mobile — P1

`statusOptions` in `B2B/src/pages/deals/components/DealDrawer.jsx` has 23
entries. The same array in `MobileCRM/src/pages/deals/components/DealDrawer.jsx`
(line 512) has 19. Absent:

- **Future Prospect**
- **Invitation Sent**
- **Event Attend**
- **Duplicate**

`Future Prospect` is the newest status on web (commit a789008, "update status
Future Prospect"). A rep in the field cannot record it at all, and a lead
already carrying it will render through the fallback style.

Two further notes on the same vocabulary:

- The mobile filter panel is missing the same four, plus **QDTD /
  Qualify Due To Delay**, which web exposes as a filter value even though
  neither drawer offers it as a settable status.
- `MobileCRM/src/utils/statusTokens.js` DOES already know all of them —
  `EventAttend`, `InvitationSent`, `QDTD`, `Duplicate` all have tokens, and
  the mobile dashboard `StatusChart.jsx` already plots `Future Prospect`. So
  the colour work is done and only the two option arrays are stale. This is a
  small fix with a large effect.

Make `statusTokens.js` the single source for the option list rather than
re-typing the array in the drawer and the filter panel. Two hand-maintained
copies are exactly how these four went missing.

### 2.2 Lead export is absent — P1

Web has `components/ExportDialog.jsx` (271 lines) and
`services/leads.service.js` exports `EXPORT_RANGE_OPTIONS`,
`EXPORT_SELECTION_LIMIT`, `fetchLeadsForExport` and `fetchLeadsByIds`. None of
the four exist in the mobile service, and there is no dialog.

Mobile does have a CSV path — `papaparse` is installed and the page has an
export toast at line 243 — but it exports the rows currently on screen, not a
chosen range, and there is no selection-limit guard.

This one is genuinely platform-shaped, so plan it rather than porting it
directly: a browser download does not exist inside a Capacitor WebView. The
export has to go through `@capacitor/filesystem` to write the file, then
`@capacitor/share` to hand it to the user. Neither plugin is in
`package.json` yet. Until they are, the honest options are to keep the
on-screen export and label it as such, or to add the plugins.

### 2.3 Date-filter modes absent — P1

Web `DealsFilters.jsx` offers these and mobile does not:

- `Specific Day`, `Date Range`, `Before a Date`, `After a Date`
- `Previously in status` / `Previously`
- the `Next Contact`, `Created` and `Assigned` date fields as filter targets

Mobile keeps `Before`, `After`, `Between`, `Last X Days`, `After X Days` and
the named ranges. So relative dates work and absolute dates mostly do not.
`Previously in status` is the one with no mobile equivalent at all, and it is
the filter a manager uses to find leads that have gone backwards.

### 2.4 Bulk actions — partial — P2

Web has, in `pages/deals/index.jsx`:

- `handleBulkAction` with export, delete and mass-update branches
- `handleBulkUpdateLeads` — the mass-update PUT
- `bulkBlockReason(allowedIds, actionLabel, permissionVerb)` — one helper that
  produces the "you can only act on leads you own" message for every bulk
  action, so the wording never drifts between them
- `clearSelectionForNewResultSet` — drops selected ids that are no longer in
  the result set after a filter change

Mobile has `handleBulkAction` with the same three entry points and the same
permission guards, but:

- there is no `clearSelectionForNewResultSet`. Change the filter with rows
  selected and the selection keeps ids that are no longer visible. The next
  bulk delete then acts on leads the user can no longer see. **Treat this as
  P1, not P2, if bulk delete is enabled for any role on mobile.**
- **a single lead delete has no confirmation step at all — P1.** Web renders
  `ConfirmDeleteModal` twice, once titled `Delete Selected Leads` and once
  titled `Delete Lead`, and routes the single delete through
  `handleRequestDeleteLead` into the second. Mobile imports the modal once and
  renders it once, for the bulk path only; `handleDeleteLead` (line 374) goes
  straight to the toast and the DELETE. On a phone, with a 44px row target and
  no undo, an unconfirmed destructive action is worse than it is on desktop,
  not better. Mobile also uses the 51-line campaigns-page modal rather than
  web 197-line leads modal, which is why the second mount was never added.

### 2.5 Project filter on leads uses the wrong matcher — P1

Web has `handleProjectChange` and backs it with
`projectExactLeadCondition` from `pages/campaigns/utils/leadScope.js`. That
function exists because the project label is spread inconsistently across
three lead fields — `cProject`, `cProjectName`, `cProjectNomen` — so it ORs
every token against every field with `equals`.

Mobile has neither the handler nor the file. Any project filter on the mobile
leads page will under-return.

Note the comment in the web file before changing it: an earlier version used
`notContains` and `isEmpty`, and the whole EspoCRM query failed. Verify any
operator against the gateway before shipping, because a rejected `whereGroup`
returns exactly what an empty result set returns.

---

## 3. Campaigns / Projects

Mobile `pages/projects` (3352 lines) against web `pages/campaigns` (4447).
The port is good. The distribution model in particular was reimplemented
faithfully, including the two subtle rules the spec called out: stable row
order so pausing never relocates a control, and `touched` tracked separately
from `dirty` so the first open does not read every member as paused.

It also fixed the bug the spec flagged as the most likely port failure:
`handleSave` in `components/LeadDistributionPanel.jsx` commits the focused
number input before saving. Web does not do this. **Web should take the mobile
fix, not the other way around.**

### 3.1 Campaign lead counts are matched on one field — P1

`MobileCRM/src/pages/projects/hooks/useProjectLeadCounts.js` counts a project
leads with:

```js
[{ type: "equals", attribute: "cProject", value: project.name }]
```

Web uses `projectLeadCondition` in `pages/campaigns/utils/leadScope.js`:

- if `projectNomen` exists and is not `Default`:
  `cProjectNomen equals projectNomen` **OR** `cProject contains projectNomen`
- else if `clientNomen` exists: `cClientNomen equals clientNomen`
- else: `cProject contains name`

The field is populated inconsistently per lead, which is the entire reason
that function exists. The comment in it records the symptom: cards showing
103 leads under a 7743 Total Leads KPI. Matching `equals` on `project.name`
alone will return zero for most projects, because `cProject` holds the messy
value and the clean label lives in `cProjectNomen`.

**Port `leadScope.js` across unchanged and call it from both the card counts
and the KPI row.** It is 125 lines and it is the file that keeps the two from
disagreeing.

### 3.2 KPI row does not follow the campaign filter — P2

`useProjectKpis` counts company-wide and ignores the active filter. The hook
documents this itself. Web scopes the three lead-based KPIs through
`projectsLeadScope`, and handles the two cases that look the same but are not:

- `null` returned means no scope — count everything
- an empty project list means match nothing — show 0, not everything

Web encodes the second as
`NO_MATCH = [{ type: "equals", attribute: "id", value: "__no_projects__" }]`
in `components/ProjectKpis.jsx`. Without it, filtering to zero campaigns
shows the whole-company total, which reads as a filter that did nothing.

### 3.3 Pausing an Auto member deletes them — P1

In `utils/distributionModel.js`:

```js
export const serializeConfiguration = (members) =>
  members.filter((m) => m.count != null) ...
```

Web writes `count: m.count ?? 1` on every pause, add and remove, so the row
always survives.

Walk the mobile path for a member on Auto (count `null`) who gets paused:

1. `togglePause` sets `paused: true`
2. `toProjectFields` drops their id from `collaboratorsIds` — correct
3. `serializeConfiguration` skips them because `count == null`
4. the record now has their id in neither field
5. on reload `buildMembers` cannot see them — **the member is gone from the
   campaign, silently**

Resuming them is impossible because there is nothing left to resume. Fix by
serialising a row for every member regardless of count, writing the count as
an empty tail so Auto survives a round trip, or by matching web and writing
`m.count ?? 1`. Matching web is safer: both apps read the same record.

### 3.4 Config parsing diverges on edge rows — P2

| Row | Web | Mobile |
|---|---|---|
| `id:name:0` | count `0` (a fixed zero) | count `null` (Auto) |
| `id:5` (one colon) | rejected | id `id`, count `5`, no name |
| `id::3` (empty name) | rejected | accepted, name `""` |

Neither reading is obviously right, but the two apps must agree, because they
both read and write the same `configuration` string on the same record.
Mobile is the more forgiving and keeps more data; web silently discards those
rows. Recommend taking the mobile parser into web.

### 3.5 Add-member picker shows inactive users — P2

Web filters the pool with `u?.id && u?.isActive !== false`. Mobile filters
only on not-already-a-member. Deactivated users therefore appear in the mobile
picker and can be added to a rotation, where they will never receive a lead.

Mobile also resolves the new member name as `user.name` alone; web uses
`user.name || user.userName || user.id`, so a user with no display name
renders blank on mobile.

Mobile is also missing web `addablePoolSize`, which exists so an empty picker
can say "no match for that search" rather than "everyone is already on this
project". Two different problems with two different fixes. P3.

### 3.6 Campaign drawer: WhatsApp settings absent — P1

Web `pages/campaigns/components/DealDrawer.jsx` (1381 lines) carries, on the
Overview tab, `whatsappTemplate` and `sendWhatsappNotification` with their own
`handleSaveWhatsapp` that PUTs only those two fields. Mobile drawer (650
lines) has no mention of whatsapp anywhere in `pages/projects`.

The three tab ids and labels match exactly, so the shell is right and the tab
contents are thin. This was out of scope in the spec, which covered the drawer
only as far as its tab strip — so it is a known gap rather than a mistake, but
it is a real feature a user cannot reach.

### 3.7 Discard — present, no action

Web has `handleDiscard` wired to a visible Discard control beside Save.
Mobile defines `discard()` at line 282 and renders it at line 578. **No action needed** — this one is fine.

---

## 4. Other pages, page by page

### 4.1 Site visits — the best port in the app

Web 4 files / 1269 lines, mobile 7 files / 1793 lines. Mobile is LARGER
because it added the layout web does not have: `VisitsList.jsx` and
`WeekendHero.jsx` replace the `min-w-[900px]` side-scrolling table, which was
the one documented deviation and is exactly right on a phone.

Verified present and matching: the two-status backend vocabulary
(`Site Visit Scheduled` / `Site Visit Done`), the five display statuses, the
`mapStatus` fold, `Mark visited`, reschedule, the WhatsApp row action, the
schedule dialog with the `Scheduling…` label, the lead combobox, the
date-time picker. **No action needed.**

One thing to check: web `isOutcome` treats `No-show` as a terminal outcome.
Confirm the mobile list can reach `No-show` at all, since the backend stores
only two statuses and nothing observed in the mobile tree writes it.

### 4.2 Pipeline — sales funnel absent — P2

Web `pages/pipeline/components/LeadFunnel.jsx` (196 lines) is rendered from
`index.jsx` line 171. Nothing in `MobileCRM/src/pages/pipeline` mentions a
funnel. This is recent web work (commit 614559b, "update sales funnel") and is
the only structural difference between the two pipeline pages; everything else
matches file for file.

### 4.3 Reports — KPI drill-down absent — P2

Web `handleMetricClick(status)` sets the status filter from a KPI card click
and toggles it off on a second click (`index.jsx` line 107, wired at 385).
Mobile reports has no equivalent; its only click handler toggles the analytics
panel. So on web a KPI is a filter control, and on mobile it is a number.

Also: web `components/QualifiedBreakdownPanel.jsx` lives on Reports. Mobile
has `components/QualifiedBreakdown.jsx` on the **dashboard** instead, and
`components/ReportTags.jsx` on reports with no web counterpart. Decide whether
that relocation is intended; if it is, it is fine, but right now the two apps
answer the "why is this lead qualified" question on two different screens.

### 4.4 Activities — single delete absent — P2

Web has both `handleSingleDelete` and a bulk delete. Mobile has the bulk path
only. Same shape as 2.4: the per-row destructive action is the one that got
dropped.

### 4.5 Pages that match — no action needed

Verified file-for-file with no missing component and no missing handler:

- **tasks** (6 files both; 2804 vs 2420 lines — the delta is desktop table markup)
- **settings** (7 files both)
- **meeting** (6 files both)
- **call** (7 files both; 2467 vs 2448 — effectively identical)
- **sales-team** (6 files both; 2350 vs 2347 — effectively identical)
- **emails** (6 files both; 1131 vs 1132)
- **integrations** (7 files both; 1874 vs 1876)
- **profile** (3 files both; 637 vs 641)
- **help** (web 26 files, mobile 22 — check which 4 articles are absent; the
  routing is identical, all three `/help` patterns present)

The near-identical line counts on call, sales-team, emails, integrations and
profile mean those were ported wholesale rather than rebuilt, so they will
carry desktop assumptions. Worth a hover-state and touch-target pass, but
nothing is functionally missing.

### 4.6 Mobile-only: accounts — P3

`/accounts` and `pages/accounts` exist on mobile with no web counterpart, and
the page is not in the mobile sidebar either. Either it predates the web app
or it is abandoned. Decide and remove it, or add it to both.

---

## 5. Design tokens — pass

`tailwind.config.js` and `src/styles/tailwind.css` were diffed variable by
variable. **Every colour value matches.** Primary is `#AC2334` on both,
background `#FAF8F6` on both, and so on down the list.

Mobile differs in three deliberate, correct ways:

1. Colours resolve through `*-rgb` channel variables wrapped in
   `rgb(var(--x) / <alpha-value>)`, so opacity modifiers such as
   `bg-primary/10` actually compile. On web they point at an opaque
   `var(--color-x)`, which makes Tailwind emit **nothing** for every
   `/opacity` variant, silently and with no build error. **Mobile is right and
   web has a latent bug here.** Worth porting back.
2. `fontWeight.bold: 600` — no 700+ weight on mobile. Deliberate.
3. Mobile adds `shadow-sheet`, `shadow-cta-glow`, `shadow-nav-active`,
   `animate-sheet-up`, `animate-screen-in`, `ease-spring` and `rounded-xl` /
   `rounded-2xl` scale steps. All native-shell affordances with nothing to
   match on web. Keep.

One genuine divergence: web `src/styles/index.css` forces
`--tw-ring-color: #5bcd5f4d !important` globally. Mobile does not, so every
focus ring is the default. P3, but it will be visible side by side.

Keyframe values for `bellSwing` and `bellVibrate` differ in their step
percentages and easing (web uses the named cubic-beziers, mobile uses
`ease-out`). The motion reads slightly differently. P3.

---

## 6. Capacitor-specific — correct as they are, do not "fix"

- Routing is `HashRouter` on mobile. Required inside a WebView.
- `FollowupReminderManager` and `NativeNotificationManager` mounted above the
  routes, with `@capacitor/local-notifications`. No web equivalent. Correct.
- Desktop tables replaced by cards: `LeadCard.jsx`, `VisitsList.jsx`,
  `QuickUpdateSheet.jsx`. Correct, and web should not get these.
- `services/nativeNotifications.js` is mobile-only. Correct.
- `services/session.js` is web-only. Check that mobile has an equivalent
  session guard inside `routes/ProtectedRoute` rather than no guard.

## 7. Suggested order of work

1. **2.1** — add the four statuses to both arrays, sourced from
   `statusTokens.js`. Smallest fix, largest user-visible effect.
2. **2.4 delete confirmation** and **3.3 vanishing paused member** — the two
   silent data-loss paths.
3. **3.1** — port `leadScope.js`; the campaign numbers are currently wrong.
4. **1.2** — two nav lines for Sales Team and Integrations, pages already built.
5. **1.1 deep links** — `/leads/:leadId` and `/tasks/:taskId`, so notifications
   can land on a record.
6. **2.3**, **2.5**, **4.2**, **4.3** — filter modes, project matcher, funnel,
   KPI drill-down.
7. **2.2** — export, once the Capacitor filesystem and share plugins are added.
8. **3.6** — the campaign drawer Overview tab, including WhatsApp.

## 8. Fixes that should travel the other way, web <- mobile

Three places where the mobile build is correct and the web build is not:

1. The `*-rgb` channel colours (section 5, item 1). Web `/opacity` utilities
   on token colours currently compile to nothing.
2. `handleSave` committing the focused number input before saving
   (`LeadDistributionPanel.jsx`). Web drops a typed number if Save is clicked
   from a focused field.
3. The more forgiving `parseConfiguration` (section 3.4). Web discards
   configuration rows it could keep.

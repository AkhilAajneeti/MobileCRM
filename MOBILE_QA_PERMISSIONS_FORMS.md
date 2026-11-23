# MobileCRM QA, pass 2 — Permissions and Form Workflow

Audited 2026-11-18, after the first report. Same method: both trees read
directly, every finding names both files.

This pass covers the two areas the first report did not: **who may do what**,
and **what happens when a form is filled in and saved**.

Read `MOBILE_QA_PARITY_REPORT.md` first for the structural comparison.
Section 0 below re-verifies it against the tree as it stands now, because the
mobile tree changed while that report was being written.

---

## 0. Status of pass 1 — re-verified against the current tree

The mobile working tree has moved since the first report. Six of its findings
are already closed. **Nothing in pass 1 needs rechecking except the items
listed as still open.**

### Fixed, verified

| Pass 1 item | Status |
|---|---|
| 2.1 Four missing lead statuses | **Fixed, and fixed well.** `statusOptions` now reads `LEAD_STATUS_OPTIONS` from `utils/statusTokens.js`, which is the single source the report asked for. `LEAD_FILTER_STATUS_OPTIONS` covers the filter panel. |
| 2.4 Single delete had no confirmation | **Fixed.** `ConfirmDeleteModal` is mounted twice in `pages/deals/index.jsx`. |
| 3.1 Campaign counts matched one field | **Fixed.** `pages/projects/utils/leadScope.js` ported and called from `useProjectLeadCounts.js`. |
| 3.2 KPI row ignored the filter | **Fixed.** `projectsLeadScope` plus the `NO_MATCH` sentinel are both in place. |
| 3.3 Pausing an Auto member deleted them | **Fixed**, with a comment recording why. |
| 1.2 Sidebar omissions | **Partly fixed.** Team Performance and Integrations added, and a `/team-performance` route and page now exist. **Sales Team is still missing from the sidebar** although its route and its 2347-line page both work. |

### Still open from pass 1

2.2 lead export · 2.3 absolute-date and "Previously in status" filters ·
2.5 project filter matcher on Leads · 3.4 config parse edge rows ·
3.5 inactive users in the add-member picker · 3.6 campaign drawer WhatsApp ·
4.2 pipeline sales funnel · 4.3 Reports KPI drill-down ·
4.4 Activities single delete · 1.1 the `/leads/:leadId` and `/tasks/:taskId`
deep links.

---

## 1. Permissions

### 1.1 Contact masking exists on one screen out of twelve — P1, highest

This is the largest single divergence in the app.

Web has two files mobile does not have at all:

- `utils/privacy.js` — `maskPhoneNumber`, `maskEmail`, `displayPhone`,
  `displayEmail`, `BLUR_CLASS`
- `utils/phone.js` — `toDialNumber`, `toWhatsappNumber`

and `isMaskedUser()` in `utils/permission.js`, which mobile also lacks.

Web calls them from 15 places: the leads list, the lead drawer (8 call sites),
the leads filter panel, inactive leads, tasks, the call attendee renderer, the
dashboard alert, the sidebar, `ProtectedRoute`, and `leads.service.js`.

**Mobile masks in exactly one place: the site visits page.** Verified by
grepping the whole mobile tree — the only hits are under `pages/sitevisits/`
plus a local 8-line `maskPhone` in
`pages/sitevisits/utils/siteVisitHelpers.js`. Every other screen renders raw
phone numbers and raw email addresses to every role.

So a restricted account signing into the mobile app can read every customer
phone number and email on the Leads list, in the lead drawer, in Pipeline,
Tasks, Meeting, Call, Reports and the Dashboard. On web the same account sees
`+91 98******10` and `*****@*********`.

Three separate problems inside this one finding:

1. **No email masking anywhere on mobile.** There is no `maskEmail`
   equivalent, not even on site visits.
2. **Who counts as masked is decided differently.** Mobile site visits uses
   `const masked = !canReadField("Lead", "phoneNumber")` — an ACL check. Web
   uses `isMaskedUser()`, which is role-based (`restricted view`,
   `restricted`, `restricted user`, `masked`) plus a username list
   (`aajneeti`), and which deliberately returns false for elevated users so a
   mis-assigned role cannot blind an Owner. These two select different sets of
   people, so even the one masked screen on mobile masks for the wrong users.
3. **The mask looks different.** Web gives `+91 98******10` — country code
   kept, first two and last two digits of the national part, asterisks
   between, one per hidden digit. Mobile gives bullets and the last two digits
   only, with the country code destroyed. Both the design and the amount
   revealed differ.

**Fix:** port `utils/privacy.js` and `utils/phone.js` across unchanged, port
`isMaskedUser` / `getUserRoles` / `isElevated` / `isOwner` / `isSupAdmin` into
`utils/permission.js`, then replace the local `maskPhone` in
`siteVisitHelpers.js` with `displayPhone` so there is one implementation. Then
work the 15 web call sites as a checklist.

Read the warning web keeps on `MASKED_ROLE_NAMES` before relying on any of
it: this is a display mask, not access control. The unmasked values still
arrive in the API response and sit in the React Query cache. The only thing
that actually withholds the data is field-level read permission on the Lead
entity in EspoCRM.

### 1.2 The request-level protection for masked users is absent — P1

Web `services/leads.service.js` does the one thing that is not merely
cosmetic:

```js
params.append("attributeSelect", masked
  ? "name,cProject,cProjectName,assignedUserId,assignedUserName,status"
  : "name,phoneNumber,emailAddress,cProject,...,status");
```

For a masked user the contact fields are **not requested**, so they never
reach the device. That is real protection and it is worth more than every
display mask in 1.1.

Mobile `services/leads.service.js` has no `attributeSelect` at all and no
`searchLeads`. `pages/sitevisits/components/LeadCombobox.jsx` calls
`fetchNewLeads`, which returns whole lead records including contact fields,
and then masks them for display.

On a phone this matters more than on web, not less: the response is cached by
React Query and, depending on configuration, by the WebView, and the device
leaves the office.

### 1.3 Delete is ungated on Tasks and Meetings — P1

`canDeleteRecord` is called from six pages on web and from **one** on mobile.

| Page | Web gate | Mobile gate |
|---|---|---|
| Leads | yes, 5 call sites | yes, 5 call sites |
| Tasks | `canDeleteRecord("Task", record)` plus its own refusal message | **none** |
| Meetings | `canDeleteRecord("Meeting", record)` plus its own message | **none** |
| Calls | page-level gate at `index.jsx:117` **and** the row-level `canDeleteRecord` prop | row-level prop only — the page handler is ungated |
| Campaigns | `canDeleteRecord` | `isAdminManager` in the filter menu only |
| Inactive leads | 4 call sites | page does not exist |

All three of Tasks, Meetings and Calls expose
`{ value: "delete", label: "Delete Selected", icon: "Trash2" }` in their
filter menus on mobile. So the action is reachable and the permission check
that web performs before it is simply not there.

Campaigns is a near-miss rather than a hole: hiding the menu entry behind
`isAdminManager` stops the button appearing, but the handler itself does not
re-check. Web also notes the ACL scope for that delete is `CProjects`, not
`Project` — worth confirming against the gateway rather than assuming.

### 1.4 Elevated users are MORE restricted on mobile than on web — P1

Web `canEntityRecord` contains a branch mobile does not:

```js
// Owners / admins / managers can EDIT (and read/create) any record across the
// org -- regardless of who it is assigned to, its team scoping, or a missing
// ACL. DELETE is deliberately EXCLUDED.
if (isElevated() && action !== "delete") return true;
```

Mobile has no `isElevated` and no equivalent branch. So an Owner or Manager on
mobile is refused edits that web grants them — on a lead assigned to someone
else, on a lead in a team they are not in, or when the ACL payload failed to
load. Web wrote this branch precisely because all three of those happen.

The exclusion of `delete` is deliberate on web and should be preserved: an
elevated user can edit anything and still cannot wipe anything outside normal
scoping.

### 1.5 Role detection cannot see EspoCRM role names — P1, and it explains 1.4

Mobile `hasRole(name)` reads `user.roles` (array) and `user.role` (string).

EspoCRM returns roles in a **plural-keyed object**:
`rolesNames: { id123: "Owner" }`. The web `getUserRoles()` reads all four
shapes — `role`, `roles`, `rolesNames`, `roleNames` — and trims as well as
lowercases, with a comment recording that a trailing space on `Owner`
silently broke `isOwner()` with no error.

Mobile reads two of the four and does not trim. `rolesNames` is the shape the
login response actually uses, so on mobile:

- `hasRole("Owner")` returns false for a real Owner
- therefore `isAdminOrOwner()` falls through to `type === "admin"` only
- therefore the `/team-performance` route and its nav entry, both gated on
  `isAdminOrOwner`, are **invisible to Owners** — exactly the bug the web
  comment says it was written to fix, that an Owner ended up unable to see an
  admin-gated nav item
- and `My Campaigns`, marked `adminOnly` in the mobile sidebar, is hidden from
  Owners too

The same defect is in `components/RoleGuard.jsx`, which reads
`user?.roles || []` and nothing else. It also calls `JSON.parse` on
`login_object` with no try/catch, so corrupt storage throws inside render
rather than failing closed.

**Fix 1.5 before 1.4.** Porting `getUserRoles` fixes the role model,
`isElevated` then works, and 1.4 follows from it.

### 1.6 Session validity is token truthiness only — P2

Web `routes/ProtectedRoute.jsx` requires a token **and** a parseable
`login_object` carrying an `id`, with a comment explaining why: a tampered
`auth_token = "x"` lets the route render, then every service call 401s and a
chain of unguarded `JSON.parse()` consumers crashes.

Mobile checks `localStorage.getItem("auth_token")` only.

This is worse on mobile, not better. In a Capacitor WebView localStorage
persists across app launches and across upgrades, so a half-written or
partially cleared session is a normal state rather than an edge case, and the
user cannot clear it the way a browser user can.

Mobile also has no `blockMasked` prop, so a restricted account cannot be kept
off a route entirely. Web uses it on `/settings`. On mobile `/settings` is
reachable by every role.

### 1.7 RestrictedAccessGuard — correctly absent

Web blocks F12, Ctrl/Cmd+Shift+I/J/C, Ctrl+U and the context menu for masked
accounts. There is no keyboard and no context menu in a Capacitor WebView, so
there is nothing to block and nothing to port. **No action.**

The mobile equivalent exposure is different in kind: `chrome://inspect`
against a debuggable build reads everything. If the release build is not
`android:debuggable="false"`, that is the hole this guard would have been
pretending to cover. Check the release flavour rather than porting the guard.

### 1.8 formatUserDisplayName absent — P3

Web prettifies `chandra_vikas` into `Chandra Vikas`, with a fallback of
`AAJneeti Team`, and uses it in the lead drawer. Mobile has no equivalent, so
raw usernames with underscores render wherever web renders a name.

### 1.9 Permission helper inventory

For reference. `utils/permission.js` is 300 lines on web, 180 on mobile.

| Export | Web | Mobile |
|---|---|---|
| `getStoredUser`, `getStoredAcl`, `hasAcl` | yes | yes |
| `canRead/Create/Edit/Delete` | yes | yes |
| `canEntity`, `canEntityRecord`, `canGlobal` | yes | yes, minus the elevated branch (1.4) |
| `canEditRecord`, `canDeleteRecord`, `isOwnRecord` | yes | yes |
| `canReadField`, `canEditField` | yes | yes |
| `isAdminOrManager` | yes | yes |
| `getUserRoles` | yes | **no** |
| `isElevated` | yes | **no** |
| `isOwner` | yes | **no** |
| `isSupAdmin` | yes | **no** |
| `isMaskedUser` | yes | **no** |
| `canSeeStatusHistory` | yes | **no** |
| `canSeeTeamPerformance` | yes | **no** |
| `formatUserDisplayName` | yes | **no** |
| `hasRole` | no | yes, defective (1.5) |
| `isAdminOrOwner` | no | yes, depends on `hasRole` |

`canSeeStatusHistory` and `canSeeTeamPerformance` are two named predicates on
web even though the rule is identical today, deliberately, so that changing
who may read a lead history does not silently change who may read the team
ranking. Mobile collapses both into `isAdminOrOwner`, which means the next
change to either will move both. Worth splitting them when porting.

---

## 2. Form workflow

### 2.1 A lead saved on mobile does not attach to its campaign — P1

This is a workflow bug, not a cosmetic one, and it interacts with the
`leadScope.js` work just completed.

The web lead form holds four project-related fields:

```js
cProject: "", cClientNomen: "", cProjectNomen: "", cSubSource: ""
```

The mobile lead form holds one, and it is a **different field**:

```js
cProjectName: ""
```

`pages/deals/components/DealDrawer.jsx` on mobile binds the project input to
`formData.cProjectName` at lines 827 and 835, and separately displays
`deal?.cProject` read-only at line 1193. So the user types into one field and
the drawer shows another.

Now follow it through to the campaign screen. `leadScope.js`, which mobile has
just adopted, matches a campaign leads with:

- `cProjectNomen` equals `projectNomen`, **OR**
- `cProject` contains `projectNomen`, **OR**
- `cClientNomen` equals `clientNomen` for a Default projectNomen

`cProjectName` is in none of those clauses. A lead created or re-assigned on
mobile therefore **will not be counted against its campaign on either app**,
and the project filter on the Leads page will not find it either.

Web also reconciles the lead back to a project option when the drawer opens
(`DealDrawer.jsx` lines 430 to 480), comparing
`lead.cClientNomen === project.clientNomen` and
`lead.cProjectNomen === project.projectNomen` so the select shows the right
campaign. Mobile has no equivalent, so the project select cannot preselect
correctly even when the data is right.

**Fix:** write the same three fields the web form writes. Confirm against the
gateway which of `cProject` / `cProjectName` / `cProjectNomen` the backend
actually populates on inbound leads before choosing which to treat as
canonical — the web `leadScope.js` comments record that all three are
populated inconsistently, which is the whole reason that file exists.

### 2.2 Sub-source cannot be set independently — P2

Web has `cSubSource` as its own editable field in the lead form.

Mobile has no input for it and instead derives it on submit:

```js
cSubSource: formData.source,        // line 380
payload.cSubSource = formData.source;  // line 417
```

So on mobile sub-source is always a copy of source, and a lead that arrives
with a real sub-source loses it the first time anyone saves the lead from a
phone. Silent data loss on an ordinary edit.

### 2.3 Form validation and save guards — pass

Checked line by line and they match. Both apps:

- reject an empty name with `Name is required`
- reject a mass update with no fields selected: `Select at least one field`
- reject an empty comment: `Comment cannot be empty`
- guard the save with `canEditRecord("Lead", getPermissionRecord(deal))` and
  refuse with `You do not have permission to edit this lead`
- invalidate `lead-stream` and `leadDetails` after a successful write
- surface a failed activity save as `Failed to save activity`

Same messages, same order, same guards. **No action.** Note that mobile uses
the React Query v4 positional form `invalidateQueries(["lead-stream", id])`
where web uses the v5 object form `invalidateQueries({ queryKey: [...] })`.
Both apps are on `@tanstack/react-query` 5.x, where that form no longer means
what it used to. See 2.6.

### 2.4 Field-level edit permissions — pass

`canEditField` is called 5 times on web and 5 times on mobile, and
`canReadField` 7 and 8. The field-level layer is intact. **No action.**

### 2.5 The mass-update form differs by one field — P3

Web offers `day` as a mass-update target; mobile offers `source`. Otherwise
both offer `status`, `assignedUserId`, `teamId`, `cNextContactAt` and
`month`. Decide which is right rather than leaving them divergent — a mass
update is the operation where a missing field costs the most time.

### 2.6 React Query v4 call signatures on a v5 dependency — P2

Not strictly a form issue, but it surfaces in the form save path, which is
why it is here.

`MobileCRM/package.json` pins `@tanstack/react-query` at `^5.91.2`, and
`node_modules/@tanstack/query-core` is on exactly 5.91.2. In v5 the signature
is `invalidateQueries(filters, options)`, where `filters` is an object
carrying `queryKey` — the v4 form of passing the key array directly is gone.

Mobile passes the bare array in at least four places in
`pages/deals/components/DealDrawer.jsx`:

```js
queryClient.invalidateQueries(["lead-stream", deal.id]);   // lines 439, 461, 477
```

Traced through `queryClient.js` in the installed package, the effect is **not**
a no-op and **not** a stale cache. `findAll(filters)` reads `filters.queryKey`,
which on an array is `undefined`, so the filter matches nothing in particular
and therefore matches **everything**: every query in the cache is invalidated
and every active one refetched.

So the symptom is the opposite of what a broken invalidation usually looks
like. The save works and the drawer updates; what it costs is a full refetch
of every active query on the screen each time a lead is saved or a comment is
posted. On a phone on mobile data that is the difference between a save that
settles immediately and one that stalls the whole screen for a second or two.

Grep the mobile tree for `invalidateQueries(` followed by `[` and convert each
to `{ queryKey: [...] }`. Two correct v5 calls already exist in the same file
at lines 1859 and 1885, so the pattern to copy is there.

---

## 3. Suggested order for this pass

1. **1.5** role detection — `getUserRoles` with all four shapes plus trim.
   Everything else in the permission model depends on it, and today Owners are
   locked out of their own screens.
2. **1.4** the elevated-edit branch in `canEntityRecord`, once 1.5 works.
3. **1.3** the delete gates on Tasks, Meetings and the Calls page handler.
4. **2.1** the project fields on the lead form, and **2.2** sub-source. Both
   are live data loss.
5. **1.1 and 1.2** masking. Largest job on this list; do it as one piece of
   work, utilities first, then the 15 call sites, then the request-level
   `attributeSelect`.
6. **1.6** session validity and `blockMasked`.
7. **2.6** the v5 `invalidateQueries` signatures — mechanical, and it is
   costing a full cache refetch on every save.
8. **1.8**, **2.5**, and splitting `canSeeStatusHistory` from
   `canSeeTeamPerformance` per 1.9.

## 4. What is correct and should not be changed

- `canReadField` / `canEditField` coverage (2.4)
- every validation message and save guard in the lead form (2.3)
- the absence of `RestrictedAccessGuard` (1.7)
- `team-performance/utils/qualification.js` and
  `components/TeamPerformanceTable.jsx`, which are identical to web, including
  the honest-failure banner for when no record carries `cStatusObj`
- neither app writes `cStatusObj` — the backend maintains it, so there is no
  mobile write path missing

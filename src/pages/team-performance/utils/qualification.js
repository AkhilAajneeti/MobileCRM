/**
 * Qualification rules for the Team Performance report.
 *
 * THE CORE RULE (from the Reports Module spec): a lead counts as qualified if
 * it EVER held a qualifying status, even if its status today is Not Interested.
 * Counting only today's status punishes both the lead source and the rep who
 * did the qualifying — a buyer who asked for a brochure was a genuine prospect,
 * and going cold afterwards is a sales outcome, not a bad lead.
 *
 * WHERE THE HISTORY COMES FROM. The spec assumes none of this works without a
 * new status-change log. That is only half true here: EspoCRM already keeps
 * `cStatusObj` on every Lead — the list of statuses the lead has passed
 * through. It is what the "Previously in status" filter reads (see the
 * arrayAnyOf clause in services/leads.service.js). So Ever-Qualified is
 * computable from data we already have.
 *
 * What `cStatusObj` does NOT carry is timestamps or attribution: when each
 * change happened and who made it. That gap is exactly why this report ships
 * without the speed columns (median first response, reached-within-5-min,
 * overdue follow-ups) — those need a real status-change log on the backend.
 */

/** Lower-cased, trimmed. Status labels are typed by hand in EspoCRM. */
export const norm = (s) => (s || "").trim().toLowerCase();

/**
 * Statuses that mean a real conversation happened and the buyer showed intent.
 * Mirrors the spec's qualifying list, mapped onto this CRM's labels — the spec
 * says "Visit Scheduled" / "Visit Done", EspoCRM calls them "Site Visit
 * Scheduled" / "Site Visit Done".
 */
export const QUALIFYING = new Set([
  "follow up",
  "interested",
  "site visit scheduled",
  "invitation sent",
  "site visit done",
  "purchased",
  // Stored as the code "QDTD"; the label is "Qualify Due To Delay". Easy to
  // miss precisely because the stored value looks like neither, and leaving it
  // out silently counted every delayed-qualification lead as never qualified.
  "qdtd",
]);

/**
 * Statuses that are NOT evidence of a conversation. Everything else implies the
 * lead was reached at least once.
 *
 * The spec defines Connected as "any status other than New or Call Not Picked,
 * OR a call log with talk time". We have no call logs, so this is the status
 * half only — which makes Contact % a FLOOR, not an exact figure. A rep who
 * spoke to someone but never moved the status off Call Not Picked reads as not
 * connected here. Labelled as such in the UI rather than quietly presented as
 * exact.
 */
export const NOT_CONNECTED = new Set([
  "new",
  "call not picked",
  "call not connecting",
]);

/**
 * Terminal / written-off statuses. The spec says "Not Interested"; this CRM
 * splits that outcome across several labels, and the existing funnel hook
 * already treats them as one bucket, so we match it rather than inventing a
 * second, conflicting definition.
 */
export const CLOSED = new Set([
  "dead",
  "fake lead",
  "invalid number",
  "irrelevant lead",
  "low budget",
  "low interest",
  "not interested",
  "other location",
  "switch off",
  "call not picked",
  "call not connecting",
]);

/**
 * Every status a lead has ever held: its history plus where it stands now.
 *
 * The union matters. `cStatusObj` is not guaranteed to include the CURRENT
 * status on every record, and relying on it alone would under-count a lead
 * sitting in "Interested" right now. Adding the live status is cheap insurance
 * against that, and a Set makes the duplicate harmless.
 */
export const statusesEverHeld = (lead) => {
  const held = new Set();
  const history = lead?.cStatusObj;
  if (Array.isArray(history)) {
    history.forEach((s) => {
      const n = norm(s);
      if (n) held.add(n);
    });
  }
  const current = norm(lead?.status);
  if (current) held.add(current);
  return held;
};

const anyIn = (set, pool) => {
  for (const value of set) {
    if (pool.has(value)) return true;
  }
  return false;
};

/** Held a qualifying status at any point — the spec's Ever-Qualified. */
export const isEverQualified = (lead) =>
  anyIn(statusesEverHeld(lead), QUALIFYING);

/** Reached at least once: held any status outside the not-connected set. */
export const isConnected = (lead) => {
  for (const status of statusesEverHeld(lead)) {
    if (!NOT_CONNECTED.has(status)) return true;
  }
  return false;
};

/** Written off as it stands today. */
export const isClosed = (lead) => CLOSED.has(norm(lead?.status));

/**
 * Qualified, then dropped — the coaching list. These leads STILL COUNT as
 * qualified; this is the subset that went cold afterwards.
 */
export const isQualifiedThenDropped = (lead) =>
  isClosed(lead) && isEverQualified(lead);

/**
 * Closed without reaching — written off having never had a conversation.
 * A discipline flag, not a lead-quality signal: nobody ever got through.
 */
export const isClosedWithoutReaching = (lead) =>
  isClosed(lead) && !isConnected(lead);

/** Reached the site-visit-done stage at any point. */
export const hasSiteVisitDone = (lead) =>
  statusesEverHeld(lead).has("site visit done");

/** Reached the site-visit-scheduled stage at any point. */
export const hasSiteVisitScheduled = (lead) =>
  anyIn(statusesEverHeld(lead), new Set(["site visit scheduled", "site visit done"]));

/**
 * Minimum leads before a rep is ranked. The spec calls for this to live in
 * Settings; until that exists it is one constant here rather than a number
 * buried in the aggregation, so moving it is a single edit.
 *
 * Why it matters: without it, a rep with 3 leads and 2 qualified outranks
 * everyone at 67%, which is noise, not performance.
 */
export const MIN_SAMPLE = 30;

/**
 * True when NO record carries status history. In that case every "ever" metric
 * silently collapses to "currently", which is the exact flaw this report exists
 * to fix — so the UI warns instead of showing a confident wrong number.
 */
export const hasStatusHistory = (records = []) =>
  records.some((lead) => Array.isArray(lead?.cStatusObj) && lead.cStatusObj.length > 0);

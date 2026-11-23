/**
 * The lead-distribution data model (spec section 2).
 *
 * Every visual on this screen derives from three fields on the project:
 *
 *   collaboratorsIds     WHO receives leads. Presence in this list is the
 *                        entire on/off switch — out of it means out of the
 *                        rotation.
 *   configuration        HOW MANY each one gets. Newline-separated
 *                        `id:name:count` rows.
 *   enableConfiguration  false -> Equal (round robin), counts ignored.
 *                        true  -> Custom, counts honoured.
 *
 * Reproducing the UI without this model produces controls that look right
 * and mean nothing, which is why it lives in one place.
 */

export const MODE_EQUAL = "equal";
export const MODE_CUSTOM = "custom";

/* ------------------------------------------------------------------ *
 * 2.1  Row parsing
 * ------------------------------------------------------------------ */

/**
 * A row splits on its FIRST and LAST colon only: id is the head, count the
 * tail, name whatever is between — so a name containing a colon ("Dr: Foo")
 * survives.
 */
export const parseConfiguration = (configuration) => {
  if (!configuration || typeof configuration !== "string") return [];

  return configuration
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const first = line.indexOf(":");
      const last = line.lastIndexOf(":");
      if (first === -1) return null;

      // Only one colon: treat the tail as the count, leaving no name.
      if (first === last) {
        return {
          id: line.slice(0, first).trim(),
          name: "",
          count: toCount(line.slice(first + 1)),
        };
      }

      return {
        id: line.slice(0, first).trim(),
        name: line.slice(first + 1, last).trim(),
        count: toCount(line.slice(last + 1)),
      };
    })
    .filter((row) => row && row.id);
};

const toCount = (raw) => {
  const parsed = Number(String(raw).trim());
  return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : null;
};

/**
 * Serialise back. Writes a row for EVERY member, never only those carrying
 * a fixed count.
 *
 * Filtering on `count != null` lost members silently: a member on Auto
 * (count `null`) who got paused left `collaboratorsIds` -- correct -- and
 * also lost their `configuration` row, so the record held their id in
 * neither field and `buildMembers` could not see them on reload. They were
 * gone from the campaign, with nothing left to resume.
 *
 * `count ?? 1` is what web writes. Both apps read and write the same
 * `configuration` string on the same record, so agreeing with web matters
 * more than the slight lie of recording an Auto member as 1 -- the number
 * is only consulted while the project is in Custom mode.
 */
export const serializeConfiguration = (members) =>
  members
    .map((m) => `${m.id}:${m.name || ""}:${m.count ?? 1}`)
    .join("\n");

/* ------------------------------------------------------------------ *
 * 2.2  Member list — order is stable, and that is the point
 * ------------------------------------------------------------------ */

/**
 * Rows follow the order recorded in `configuration`; anyone present only in
 * `collaboratorsIds` is appended.
 *
 * Do NOT sort active members above paused ones. Pausing the top row would
 * move it to the bottom, so the click reads as "I clicked the top toggle and
 * the bottom one changed". Pausing must flip a switch IN PLACE.
 */
export const buildMembers = (project) => {
  const activeIds = normaliseIds(project?.collaboratorsIds);
  const namesById = project?.collaboratorsNames || {};
  const rows = parseConfiguration(project?.configuration);

  const seen = new Set();
  const members = [];

  const push = (id, configName, count) => {
    // Ids are deduped: a duplicated id would render two rows sharing an id,
    // and every per-member action keys off that id.
    if (!id || seen.has(id)) return;
    seen.add(id);

    members.push({
      id,
      // Name resolution order: server map, then the configuration name, then
      // the raw id. The configuration name matters because a paused member
      // is absent from the server map by definition.
      name: namesById[id] || configName || id,
      count,
      paused: !activeIds.includes(id),
    });
  };

  rows.forEach((row) => push(row.id, row.name, row.count));
  activeIds.forEach((id) => push(id, "", null));

  return members;
};

const normaliseIds = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/** Local member list -> the three fields the server stores. */
export const toProjectFields = (members, mode) => ({
  // A paused member keeps their configuration row even though their id has
  // left collaboratorsIds — the backend ignores an orphan line, so they
  // receive nothing, but their number survives the pause.
  collaboratorsIds: members.filter((m) => !m.paused).map((m) => m.id),
  configuration: serializeConfiguration(members),
  enableConfiguration: mode === MODE_CUSTOM,
});

/* ------------------------------------------------------------------ *
 * 2.3  Planning the split
 * ------------------------------------------------------------------ */

/**
 * Given a daily volume, work out who gets what.
 *
 * Equal mode: everyone active is Auto by definition. Base share is the floor
 * of volume over member count; the remainder goes one each to the first few.
 *
 * Custom mode: fixed numbers are honoured first, each capped at whatever
 * volume remains — so a campaign whose numbers exceed its intake never
 * reports a split larger than the leads that exist. Whatever is left is
 * shared equally among the Auto members.
 *
 * The result is reordered back into member-list order, so the preview
 * matches the list above it row for row.
 */
export const planSplit = (members, mode, volume) => {
  const active = members.filter((m) => !m.paused);
  if (!active.length) return [];

  const total = Math.max(0, Number(volume) || 0);
  const shares = new Map();

  let remaining = total;
  let autoMembers = active;

  if (mode === MODE_CUSTOM) {
    const fixed = active.filter((m) => m.count != null);
    autoMembers = active.filter((m) => m.count == null);

    fixed.forEach((member) => {
      const share = Math.min(member.count, remaining);
      shares.set(member.id, share);
      remaining -= share;
    });
  }

  if (autoMembers.length) {
    const base = Math.floor(remaining / autoMembers.length);
    let leftover = remaining - base * autoMembers.length;

    autoMembers.forEach((member) => {
      const extra = leftover > 0 ? 1 : 0;
      if (extra) leftover -= 1;
      shares.set(member.id, base + extra);
    });
  }

  // Back into member-list order.
  return active.map((member) => ({
    ...member,
    share: shares.get(member.id) || 0,
    fixed: mode === MODE_CUSTOM && member.count != null,
  }));
};

/* ------------------------------------------------------------------ *
 * 10.2  Member avatar colours
 * ------------------------------------------------------------------ */

/**
 * Keyed on ID, not name, so a rename never moves someone's colour and the
 * same person is the same colour in the list, the split bar and the chip.
 */
const MEMBER_PALETTE = [
  "#2563EB", "#C2410C", "#0D9488", "#7C3AED",
  "#BE185D", "#0369A1", "#B45309", "#4338CA",
];

export const memberColor = (id) => {
  const value = String(id || "");
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return MEMBER_PALETTE[hash % MEMBER_PALETTE.length];
};

export const memberInitials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

/* ------------------------------------------------------------------ *
 * 7.3  Distribution summary, for the table cell and the mobile card
 * ------------------------------------------------------------------ */

export const getDistributionSummary = (project) => {
  const members = buildMembers(project);
  const activeCount = members.filter((m) => !m.paused).length;
  const pausedCount = members.length - activeCount;

  return {
    hasMembers: members.length > 0,
    isCustom: Boolean(project?.enableConfiguration),
    activeCount,
    pausedCount,
  };
};

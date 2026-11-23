import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/AppIcon";
import {
  MODE_CUSTOM,
  MODE_EQUAL,
  buildMembers,
  memberColor,
  memberInitials,
  planSplit,
  toProjectFields,
} from "../utils/distributionModel";

/**
 * Lead Distribution panel (spec 10).
 *
 * Every change is a draft until Save: toggling someone off, retyping a count
 * and switching mode all edit local state only, and one request carries the
 * three fields. Batched because setting up a campaign means several changes
 * in a row — firing a request per change hammers the gateway and leaves the
 * campaign half-applied if one call fails.
 */

const Avatar = ({ id, name, size = "h-9 w-9", text = "text-xs" }) => (
  <span
    className={`grid ${size} shrink-0 place-items-center rounded-full ${text} font-bold text-white`}
    style={{ backgroundColor: memberColor(id) }}
  >
    {memberInitials(name)}
  </span>
);

/** 10.3 — the subtitle is a SIBLING of the title, not nested under it, so it
    wraps to its own full-width line instead of being squeezed beside the
    action button. */
const SectionHeading = ({ icon, title, action, subtitle }) => (
  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#AC2334]/10 text-[#AC2334]">
      <Icon name={icon} size={17} />
    </span>
    <h3 className="min-w-0 flex-1 self-center text-base font-semibold text-foreground">
      {title}
    </h3>
    {action}
    {subtitle && (
      <p className="w-full text-xs leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    )}
  </div>
);

const withAlpha = (hex, alpha) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
};

/** 10.4 — value ABOVE label, the opposite of the page KPI cards. */
const StatTile = ({ icon, label, value, accent }) => (
  <div
    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-[0_1px_2px_rgba(16,24,40,.04)] transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--kpi-glow)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    style={{
      "--kpi-glow": withAlpha(accent, 0.35),
      backgroundImage: `linear-gradient(135deg, ${withAlpha(accent, 0.06)} 0%, transparent 60%)`,
    }}
  >
    <span
      className="mb-3 grid h-9 w-9 place-items-center rounded-xl transition-transform duration-300 ease-premium group-hover:scale-105"
      style={{ backgroundColor: withAlpha(accent, 0.12) }}
    >
      <Icon name={icon} size={17} color={accent} />
    </span>
    <p className="text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">
      {value}
    </p>
    <p className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</p>
  </div>
);

const MemberRow = ({ member, mode, onCount, onTogglePause, onRemove, registerInput }) => {
  const isEqual = mode === MODE_EQUAL;
  const disabled = isEqual || member.paused;

  // Sub-line states the paused reason BEFORE the number, so a paused member
  // never shows a count that is not being honoured.
  const subLine = member.paused
    ? "Paused — not receiving leads"
    : member.count != null && !isEqual
      ? `${member.count} a day`
      : "Auto";

  return (
    <div
      className={`flex flex-col gap-3 py-3.5 sm:flex-row sm:flex-wrap sm:items-center ${
        member.paused ? "opacity-60" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:contents">
        <Avatar id={member.id} name={member.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {member.name}
          </p>
          <p className="text-xs text-muted-foreground">{subLine}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:contents">
        {/* Commits on BLUR, not on change — uncontrolled, seeded from the
            stored count. Blank, non-numeric or below 1 all mean Auto, which
            deletes the row. Registered so the panel can force a commit
            before saving (10.13 item 3). */}
        <input
          ref={(el) => registerInput(member.id, el)}
          type="text"
          inputMode="numeric"
          defaultValue={member.count ?? ""}
          disabled={disabled}
          placeholder="Auto"
          aria-label={`Leads per day for ${member.name}`}
          title={
            isEqual
              ? "Switch to Custom numbers to set a fixed share"
              : "Leads per day. Blank = Auto"
          }
          onBlur={(e) => onCount(member.id, e.target.value)}
          className="h-11 w-20 shrink-0 rounded-lg border border-border bg-background px-2 text-center text-sm tabular-nums text-foreground focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 sm:h-9"
        />

        {/* The word beside the switch is not decoration: the switch alone was
            almost invisible when off. Note it moves RIGHT to pause, and
            aria-checked tracks paused rather than active — visual and
            semantics agree, so keep both or flip both. */}
        <div className="flex flex-1 items-center gap-2 sm:w-[104px] sm:flex-none sm:shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={member.paused}
            aria-label={member.paused ? `Resume ${member.name}` : `Pause ${member.name}`}
            title={
              member.paused
                ? "Resume — start sending leads again"
                : "Pause — stop sending leads while they are away"
            }
            onClick={() => onTogglePause(member.id)}
            className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
              member.paused
                ? "border-[#C2410C] bg-[#C2410C]"
                : "border-emerald-600 bg-emerald-500"
            }`}
          >
            <span
              className={`absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${
                member.paused ? "translate-x-[22px]" : "translate-x-[2px]"
              }`}
            />
          </button>
          <span
            className={`text-xs font-semibold ${
              member.paused ? "text-[#C2410C]" : "text-emerald-700"
            }`}
          >
            {member.paused ? "Paused" : "Active"}
          </span>
        </div>

        {/* Kept apart from the toggle: remove has no confirmation, and pause
            and remove adjacent at 36px is a real mis-tap risk. */}
        <button
          type="button"
          onClick={() => onRemove(member.id)}
          aria-label={`Remove ${member.name} from this project`}
          title="Remove from this project"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 sm:h-9 sm:w-9"
        >
          <Icon name="Trash2" size={15} />
        </button>
      </div>
    </div>
  );
};

const LeadDistributionPanel = ({ project, users = [], onSave, isSaving }) => {
  const [members, setMembers] = useState(() => buildMembers(project));
  const [mode, setMode] = useState(() =>
    project?.enableConfiguration ? MODE_CUSTOM : MODE_EQUAL,
  );
  // Never persisted: it answers "if N leads arrive today, who gets them",
  // which is a question about the future, not a property of the campaign.
  const [volume, setVolume] = useState(10);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [query, setQuery] = useState("");

  // "Touched" is tracked separately from "dirty". The drawer seeds its draft
  // from the list row, which carries no collaborator ids, so the draft starts
  // empty and the full record arrives a beat later — flipping dirty true
  // through no action of the user. The panel follows the server while
  // untouched; a user edit outranks a background refresh.
  const touched = useRef(false);
  const projectId = project?.id;

  useEffect(() => {
    touched.current = false;
    setMembers(buildMembers(project));
    setMode(project?.enableConfiguration ? MODE_CUSTOM : MODE_EQUAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (touched.current) return;
    setMembers(buildMembers(project));
    setMode(project?.enableConfiguration ? MODE_CUSTOM : MODE_EQUAL);
  }, [project]);

  const serverState = useMemo(() => {
    const base = buildMembers(project);
    return JSON.stringify({
      members: base,
      mode: project?.enableConfiguration ? MODE_CUSTOM : MODE_EQUAL,
    });
  }, [project]);

  const localState = JSON.stringify({ members, mode });
  const isDirty = touched.current && serverState !== localState;

  const edit = (updater) => {
    touched.current = true;
    setMembers(updater);
  };

  /* --- number inputs, so a focused value can be committed before save --- */
  const inputsRef = useRef(new Map());
  const registerInput = (id, el) => {
    if (el) inputsRef.current.set(id, el);
    else inputsRef.current.delete(id);
  };

  const commitCount = (id, raw) => {
    const parsed = Number(String(raw).trim());
    const count = Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : null;
    edit((prev) =>
      prev.map((m) => (m.id === id ? { ...m, count } : m)),
    );
  };

  const togglePause = (id) =>
    edit((prev) => prev.map((m) => (m.id === id ? { ...m, paused: !m.paused } : m)));

  const removeMember = (id) => edit((prev) => prev.filter((m) => m.id !== id));

  const addMember = (user) => {
    // Writes both fields: the id into collaboratorsIds, and a configuration
    // row with a count of 1 so a later switch to Custom has something to edit.
    edit((prev) =>
      prev.some((m) => m.id === user.id)
        ? prev
        : [...prev, { id: user.id, name: user.name, count: 1, paused: false }],
    );
    setIsPickerOpen(false);
    setQuery("");
  };

  const handleSave = () => {
    // 10.13 item 3 — on a phone blur is unreliable: a user can tap Save
    // straight from a focused field. Commit the focused input first or the
    // typed number is silently dropped.
    const active = document.activeElement;
    let pending = members;

    inputsRef.current.forEach((el, id) => {
      if (el === active) {
        const parsed = Number(String(el.value).trim());
        const count =
          Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : null;
        pending = pending.map((m) => (m.id === id ? { ...m, count } : m));
      }
    });

    setMembers(pending);
    onSave(toProjectFields(pending, mode));
  };

  const discard = () => {
    touched.current = false;
    setMembers(buildMembers(project));
    setMode(project?.enableConfiguration ? MODE_CUSTOM : MODE_EQUAL);
  };

  const activeMembers = members.filter((m) => !m.paused);
  const pausedMembers = members.filter((m) => m.paused);
  const split = useMemo(
    () => planSplit(members, mode, volume),
    [members, mode, volume],
  );

  /** The pool is every user not already on the project, sorted by name. */
  const pool = useMemo(
    () =>
      users
        .filter((u) => !members.some((m) => m.id === u.id))
        .sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [users, members],
  );

  // Matches the display name OR the login name: the list shows "Aarti" but
  // people search for "aarti_2", and vice versa.
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pool;
    return pool.filter(
      (u) =>
        String(u.name || "").toLowerCase().includes(term) ||
        String(u.userName || "").toLowerCase().includes(term),
    );
  }, [pool, query]);

  const nextUp = split.find((s) => s.share > 0);

  return (
    <div className="space-y-6 pb-20">
      {/* 10.4 — written for someone scanning: "On leave", not Paused. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon="Users" label="Team members" value={members.length} accent="#6366F1" />
        <StatTile icon="UserCheck" label="Getting leads now" value={activeMembers.length} accent="#10B981" />
        <StatTile icon="PauseCircle" label="On leave" value={pausedMembers.length} accent="#F59E0B" />
        <StatTile icon="TrendingUp" label="Expected leads today" value={volume} accent="#8A1B29" />
      </div>

      {/* 10.5 Mode block */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeading
          icon="Share2"
          title="How should leads be shared?"
          subtitle="Choose a distribution method to decide how leads are assigned to team members."
        />

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {[
            {
              id: MODE_EQUAL,
              title: "Equal (Round robin)",
              body: "Leads go one by one to each active member in turn. Everyone gets the same number.",
            },
            {
              id: MODE_CUSTOM,
              title: "Custom numbers",
              body: "Fix how many leads a day someone gets. Everyone else shares the rest equally.",
            },
          ].map((option) => {
            const isActive = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  touched.current = true;
                  setMode(option.id);
                }}
                className={`flex-1 rounded-xl border p-4 text-left transition-all ${
                  isActive
                    ? "border-[#AC2334] bg-[#AC2334]/[0.04] shadow-sm"
                    : "border-border bg-card hover:border-border/80 hover:bg-muted/30"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border-2 ${
                      isActive ? "border-[#AC2334]" : "border-muted-foreground/40"
                    }`}
                  >
                    {isActive && <span className="h-2 w-2 rounded-full bg-[#AC2334]" />}
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                </span>
                {/* The body text is the documentation — there is no tooltip.
                    Truncating it removes the only explanation of the feature. */}
                <span className="mt-1.5 block text-xs leading-relaxed text-muted-foreground">
                  {option.body}
                </span>
              </button>
            );
          })}
        </div>

        {/* 10.6 — neutral tile, because this is an input and not a heading */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
            <Icon name="BarChart3" size={16} />
          </span>
          <span className="text-sm font-medium text-foreground">
            Expected leads per day
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Fewer leads"
              onClick={() => setVolume((v) => Math.max(0, v - 1))}
              className="grid h-11 w-11 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted sm:h-8 sm:w-8"
            >
              <Icon name="Minus" size={14} />
            </button>
            <input
              inputMode="numeric"
              value={volume}
              onChange={(e) => setVolume(Math.max(0, Number(e.target.value) || 0))}
              aria-label="Expected leads per day"
              className="h-11 w-16 rounded-lg border border-border bg-background text-center text-sm font-semibold tabular-nums text-foreground focus:ring-2 focus:ring-primary/30 sm:h-8"
            />
            <button
              type="button"
              aria-label="More leads"
              onClick={() => setVolume((v) => v + 1)}
              className="grid h-11 w-11 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted sm:h-8 sm:w-8"
            >
              <Icon name="Plus" size={14} />
            </button>
          </div>

          {/* Without this note, a number box beside real saved settings reads
              as a setting. */}
          <p className="text-xs text-muted-foreground">
            Used to plan the split. Not saved — if more leads come in, they keep
            rotating.
          </p>
        </div>
      </div>

      {/* 10.7 Team list */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeading
          icon="Users"
          title={`Team (${members.length})`}
          subtitle={
            mode === MODE_EQUAL
              ? "Everyone active shares the day equally. Switch to Custom numbers to fix someone's share."
              : "Type a number to fix someone's leads per day. Leave it blank for Auto: they share whatever is left, equally."
          }
          action={
            <button
              type="button"
              onClick={() => {
                setIsPickerOpen((open) => !open);
                setQuery(""); // cleared each open, so a previous query cannot
                              // hide the person being looked for now
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#AC2334] px-3 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Icon name="Plus" size={15} />
              Add Member
            </button>
          }
        />

        {/* 10.10 Add-member picker */}
        {isPickerOpen && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add to this project
            </p>

            {/* Two different empty states for two different problems: one
                means remove someone first, the other means retype. */}
            {!pool.length ? (
              <p className="text-sm italic text-muted-foreground">
                Everyone available is already on this project.
              </p>
            ) : (
              <>
                <div className="relative">
                  <Icon
                    name="Search"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name or username…"
                    className="h-11 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 sm:h-10"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Icon name="X" size={13} />
                    </button>
                  )}
                </div>

                <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {!matches.length ? (
                    <p className="px-2 py-3 text-sm italic text-muted-foreground">
                      No one matches “{query}”.
                    </p>
                  ) : (
                    matches.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => addMember(user)}
                        className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-foreground transition-colors hover:border-[#AC2334]/25 hover:bg-[#AC2334]/[0.07] hover:text-[#AC2334] active:border-[#AC2334]/25 active:bg-[#AC2334]/[0.07]"
                      >
                        <Avatar id={user.id} name={user.name} size="h-7 w-7" text="text-[10px]" />
                        <span className="min-w-0 flex-1 truncate text-left">
                          {user.name}
                        </span>
                        {user.userName && user.userName !== user.name && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            @{user.userName}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* 10.8 — hidden below sm, where the row stacks and the headings had
            nothing to sit over. */}
        {members.length > 0 && (
          <div className="mt-4 hidden items-center gap-3 border-b border-border pb-2 sm:flex">
            <span className="w-9" />
            <span className="min-w-0 flex-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Member
            </span>
            <span className="w-20 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Leads/day
            </span>
            <span className="w-[104px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <span className="w-9" />
          </div>
        )}

        {members.length ? (
          <div className="divide-y divide-border">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                mode={mode}
                onCount={commitCount}
                onTogglePause={togglePause}
                onRemove={removeMember}
                registerInput={registerInput}
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm italic text-muted-foreground">
            No collaborators on this project yet. Add them under Teams /
            Collaborators.
          </p>
        )}
      </div>

      {/* 10.11 — present only while there is something to save. A bar that is
          always there gets ignored. */}
      {isDirty && (
        <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-3 rounded-xl border border-[#AC2334]/30 bg-[#AC2334]/[0.04] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <Icon name="AlertCircle" size={16} className="shrink-0 text-[#AC2334]" />
          <p className="min-w-0 flex-1 text-sm text-foreground">
            You have unsaved distribution changes.
          </p>
          <button
            type="button"
            onClick={discard}
            disabled={isSaving}
            className="min-h-[44px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 sm:min-h-0"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="min-h-[44px] rounded-lg bg-[#AC2334] px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:min-h-0"
          >
            {isSaving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}

      {/* 10.12 Today split preview */}
      <div className="rounded-xl border border-border bg-card p-5">
        <SectionHeading
          icon="PieChart"
          title="Today's split"
          subtitle={`Based on ${volume} ${volume === 1 ? "lead" : "leads"} today. A plan, not a record — the CRM does not store who received what on a given day.`}
        />

        {!split.length ? (
          <p className="mt-4 text-sm italic text-muted-foreground">
            Nobody is set to receive leads on this project.
          </p>
        ) : (
          <>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-muted">
              {split
                .filter((s) => s.share > 0)
                .map((s) => (
                  <span
                    key={s.id}
                    title={`${s.name}: ${s.share}`}
                    style={{
                      width: `${volume ? (s.share / volume) * 100 : 0}%`,
                      backgroundColor: memberColor(s.id),
                    }}
                  />
                ))}
            </div>

            {/* Lists EVERY active member, including a share of zero: someone
                allocated nothing still needs to appear, or they look absent
                rather than empty-handed. */}
            <div className="mt-4 space-y-2">
              {split.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: memberColor(s.id) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {s.name}{" "}
                    <span className="text-muted-foreground">
                      {s.fixed ? "fixed" : "auto"}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {s.share}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {pausedMembers.length > 0 && (
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              Paused: {pausedMembers.map((m) => m.name).join(", ")}.
            </span>{" "}
            Their share goes to the rest of the team.
          </p>
        )}

        {/* First in the split with a share above zero — list order, not a
            live rotation pointer. The CRM stores no pointer, so this is a
            reasonable guess presented as a statement. Do not add a countdown
            or queue position that implies the rotation state is known. */}
        {nextUp && (
          <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
            <Avatar id={nextUp.id} name={nextUp.name} size="h-8 w-8" text="text-[11px]" />
            <p className="text-sm text-muted-foreground">
              Next lead goes to{" "}
              <span className="font-semibold text-foreground">{nextUp.name}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDistributionPanel;

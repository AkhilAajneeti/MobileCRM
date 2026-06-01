import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { fetchTodayFollowups } from "services/reminder.service";

/**
 * FollowupReminderManager
 *
 * A single, app-global manager (mounted once inside the router, above the
 * pages) that pops a reminder when a lead's "today" follow-up time arrives,
 * on whatever CRM page the rep is currently on.
 *
 * Design (matches what we agreed on):
 *  - Reuses ONE cached query of today's follow-ups (no per-tick API calls).
 *  - Runs ONE setTimeout to the nearest upcoming follow-up, then chains to the
 *    next nearest after each fire - not N parallel timers.
 *  - Recomputes whenever the data changes (handles mid-day reschedules / new).
 *  - On load, surfaces follow-ups whose time already passed today as "missed".
 *  - De-dupes fired reminders across reloads and tabs via localStorage.
 *
 * Scope (intentional): TODAY only, and only while a CRM tab is open. A closed
 * tab cannot fire - that is a known, accepted limit of the browser platform.
 */

const SETTIMEOUT_MAX = 2 ** 31 - 1; // ~24.8 days; today's max delay is < 24h
const SNOOZE_MS = 10 * 60 * 1000;

/* --- date helpers (kept local so this stays independent of the pipeline) --- */

// EspoCRM datetimes ("YYYY-MM-DD HH:mm:ss") are UTC. Append Z so JS parses
// the instant correctly; downstream `Date` methods (getHours, isToday, etc.)
// then operate on the user's local timezone, which is what we want.
const parseLocal = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  const iso = s.length <= 10 ? `${s}T12:00:00Z` : `${s.replace(" ", "T")}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const isToday = (date) => {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const formatTime = (date) =>
  date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

/* --- fired-set persistence (date-scoped, shared across tabs) --- */

const firedKey = () => `followup_fired_${new Date().toISOString().slice(0, 10)}`;

const loadFired = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(firedKey())) || []);
  } catch {
    return new Set();
  }
};

const persistFired = (set) => {
  try {
    localStorage.setItem(firedKey(), JSON.stringify([...set]));
  } catch {
    /* storage full / disabled - dedup degrades to per-session, acceptable */
  }
};

/* --- sound (Web Audio beep, no asset needed) --- */

let audioCtx = null;

const primeAudio = () => {
  try {
    audioCtx =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {
    /* Web Audio unavailable - reminders still show visually */
  }
};

const playBeep = () => {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = audioCtx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.45);
  } catch {
    /* ignore - visual popup is the source of truth */
  }
};

const FollowupReminderManager = () => {
  const navigate = useNavigate();
  // Subscribing to location makes this globally-mounted manager re-render on
  // navigation, so it re-reads the token right after login (soft navigate, no
  // reload) and starts the query then - instead of waiting for a page reload.
  const location = useLocation();
  const onLoginPage = location.pathname === "/login";
  const token = localStorage.getItem("auth_token");

  const timerRef = useRef(null);
  const snoozeTimersRef = useRef([]);
  const firedRef = useRef(loadFired());

  const { data } = useQuery({
    queryKey: ["today-followups"],
    queryFn: fetchTodayFollowups,
    enabled: !!token && !onLoginPage,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // re-sync reschedules / new follow-ups
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Normalise -> keep only today (local) -> sort by time ascending.
  const reminders = useMemo(() => {
    const list = data?.list || [];
    return list
      .map((lead) => ({
        id: lead.id,
        name: lead.name || lead.firstName || "Lead",
        project: lead.cProject || "",
        owner: lead.assignedUserName || "",
        time: parseLocal(lead.cNextContactAt),
      }))
      .filter((r) => r.time && isToday(r.time))
      .sort((a, b) => a.time - b.time);
  }, [data]);

  // Unlock audio + ask for OS-notification permission on the first interaction.
  useEffect(() => {
    const onFirstGesture = () => {
      primeAudio();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
    window.addEventListener("pointerdown", onFirstGesture);
    window.addEventListener("keydown", onFirstGesture);
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, []);

  // Keep dedup state in sync when another tab fires a reminder.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === firedKey()) firedRef.current = loadFired();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const markFired = (id) => {
    firedRef.current.add(id);
    persistFired(firedRef.current);
  };

  // Accepts a single reminder or an array; multiple due at the same moment are
  // shown as ONE grouped popup to keep the screen uncluttered.
  const showReminderPopup = (group) => {
    const items = Array.isArray(group) ? group : [group];
    if (!items.length) return;

    playBeep();

    const isGroup = items.length > 1;
    const lead = items[0];
    const names = items.map((r) => r.name);
    const namePreview =
      names.length <= 3
        ? names.join(", ")
        : `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
    const groupId = `group-${lead.time.getTime()}`;
    const toastId = isGroup ? `reminder-${groupId}` : `reminder-${lead.id}`;

    // OS-level notification when the tab isn't focused.
    if (
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      try {
        const n = new Notification(
          isGroup ? `${items.length} follow-ups due now` : "Follow-up reminder",
          {
            body: isGroup
              ? namePreview
              : `${lead.name} • ${formatTime(lead.time)}${
                  lead.project ? ` • ${lead.project}` : ""
                }`,
            tag: isGroup ? groupId : lead.id,
            requireInteraction: true, // stay on screen until the rep acts
          },
        );
        n.onclick = () => {
          window.focus();
          navigate("/leads", { state: { leadId: lead.id } });
          n.close();
        };
      } catch {
        /* ignore */
      }
    }

    // In-app popup (persistent until acted on).
    toast.custom(
      (t) => (
        <div
          className={`max-w-sm w-full bg-white shadow-lg rounded-xl border border-orange-200 pointer-events-auto overflow-hidden ${
            t.visible ? "animate-enter reminder-shake" : "animate-leave"
          }`}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 text-lg">
              📞
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {isGroup
                  ? `${items.length} Call Later reminders`
                  : "Call Later reminder"}
              </p>
              <p className="text-sm text-gray-700 truncate">
                {isGroup ? namePreview : lead.name}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatTime(lead.time)}
                {!isGroup && lead.project ? ` • ${lead.project}` : ""}
              </p>
            </div>
          </div>
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => {
                navigate("/leads", { state: { leadId: lead.id } });
                toast.dismiss(t.id);
              }}
              className="flex-1 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              View
            </button>
            <button
              onClick={() => {
                const handle = setTimeout(
                  () => showReminderPopup(items),
                  SNOOZE_MS,
                );
                snoozeTimersRef.current.push(handle);
                toast.dismiss(t.id);
              }}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border-l border-gray-100"
            >
              Snooze 10m
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border-l border-gray-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, id: toastId },
    );
  };

  // Scheduler. Background tabs heavily throttle setTimeout, so we don't rely on
  // a chained timer alone: a 30s poll + a visibility listener guarantee that
  // anything due fires (within ~1 min while backgrounded, instantly on return).
  useEffect(() => {
    // Fire every reminder now due (several at the same time -> one grouped
    // popup), de-duped via firedRef so nothing fires twice.
    const fireDue = () => {
      const now = Date.now();
      const due = reminders.filter(
        (r) => r.time.getTime() <= now && !firedRef.current.has(r.id),
      );
      if (!due.length) return;
      due.forEach((r) => markFired(r.id));
      showReminderPopup(due);
    };

    // Precise timer to the nearest upcoming reminder (exact firing while the
    // tab is in the foreground), re-armed after each fire.
    const scheduleNext = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const ts = Date.now();
      const next = reminders.find(
        (r) => r.time.getTime() > ts && !firedRef.current.has(r.id),
      );
      if (!next) return;
      const delay = Math.min(
        Math.max(next.time.getTime() - ts, 0),
        SETTIMEOUT_MAX,
      );
      timerRef.current = setTimeout(() => {
        fireDue();
        scheduleNext();
      }, delay);
    };

    fireDue(); // anything already due on load / after a data change
    scheduleNext();

    // Safety net: catches reminders the throttled background timer missed, and
    // fires instantly the moment the rep returns to the tab.
    const poll = setInterval(fireDue, 30 * 1000);
    const onVisible = () => {
      if (!document.hidden) {
        fireDue();
        scheduleNext();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  // Clean up any pending snooze timers on unmount.
  useEffect(() => {
    const snoozeTimers = snoozeTimersRef.current;
    return () => snoozeTimers.forEach((h) => clearTimeout(h));
  }, []);

  return null;
};

export default FollowupReminderManager;

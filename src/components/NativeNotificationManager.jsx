import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchNotifications } from "services/notification.service";
import { useUrgentLeads } from "../hooks/useUrgentLeads";
import {
  ensureNotificationPermission,
  showNativeNotification,
  addNotificationTapListener,
} from "services/nativeNotifications";

/**
 * NativeNotificationManager
 *
 * App-global manager (mounted once, inside the router) that turns CRM events
 * into real phone-tray notifications via @capacitor/local-notifications:
 *
 *  1. NEW LEAD / ASSIGNED — polls the existing /Notification feed every minute
 *     while the app is open, and fires a notification for any new entry that is
 *     a Lead "Create" or "Assign" addressed to the logged-in user. New entries
 *     are detected by their monotonically-increasing `number`.
 *
 *  2. OVERDUE — once per day, surfaces a summary ("N leads are overdue") from
 *     the client-computed useUrgentLeads (the backend feed has no overdue
 *     event). Due-today/exact follow-up times are handled by the existing
 *     FollowupReminderManager.
 *
 * Limitation: polling only runs while the app is open or recently
 * backgrounded. App-fully-killed delivery would need server-sent FCM push.
 */

const POLL_MS = 60 * 1000;
const SEEN_KEY = "native_notif_last_number";
const OVERDUE_KEY = () => `native_overdue_alerted_${new Date().toISOString().slice(0, 10)}`;

const currentUserId = () => {
  try {
    return JSON.parse(localStorage.getItem("login_object") || "{}")?.id || null;
  } catch {
    return null;
  }
};

// Decide whether a feed item should raise a "new lead" notification, and build
// its text. Returns null for items we don't want to surface (e.g. someone
// else's status edits), so the feed's noise doesn't become notification spam.
const buildLeadAlert = (n, uid) => {
  const note = n.noteData || {};
  if (note.parentType !== "Lead") return null;

  const data = note.data || {};
  const leadName = note.parentName || "a lead";
  const assignedToMe = data.assignedUserId && data.assignedUserId === uid;

  if (note.type === "Create" && assignedToMe) {
    return { title: "New lead assigned", body: leadName };
  }
  if (note.type === "Assign" && assignedToMe) {
    return { title: "Lead assigned to you", body: leadName };
  }
  return null;
};

const NativeNotificationManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const onLoginPage = location.pathname === "/login";
  const token = localStorage.getItem("auth_token");

  const { overdue } = useUrgentLeads();
  const overdueRef = useRef(overdue);
  overdueRef.current = overdue;

  // Ask permission + wire tap routing once.
  useEffect(() => {
    ensureNotificationPermission();
    const unsub = addNotificationTapListener((extra) => {
      if (extra?.leadId) navigate("/leads", { state: { leadId: extra.leadId } });
      else if (extra?.route) navigate(extra.route);
      else navigate("/dashboard");
    });
    return unsub;
  }, [navigate]);

  // Poll the notification feed for new lead events.
  useEffect(() => {
    if (!token || onLoginPage) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const data = await fetchNotifications({ maxSize: 30 });
        if (cancelled) return;

        const list = data?.list || [];
        if (!list.length) return;

        const uid = currentUserId();
        const maxNumber = Math.max(...list.map((n) => n.number || 0));
        const lastSeen = Number(localStorage.getItem(SEEN_KEY) || 0);

        // First run: remember where we are without replaying the backlog.
        if (!lastSeen) {
          localStorage.setItem(SEEN_KEY, String(maxNumber));
          return;
        }

        // Newest-first feed; take only items newer than last seen, oldest
        // first so notifications arrive in chronological order. Cap at 5 so a
        // long gap doesn't dump a wall of notifications.
        const fresh = list
          .filter((n) => (n.number || 0) > lastSeen)
          .sort((a, b) => (a.number || 0) - (b.number || 0))
          .slice(-5);

        for (const n of fresh) {
          const alert = buildLeadAlert(n, uid);
          if (!alert) continue;
          await showNativeNotification({
            key: n.number,
            title: alert.title,
            body: alert.body,
            extra: { leadId: n.noteData?.parentId || n.relatedParentId },
          });
        }

        localStorage.setItem(SEEN_KEY, String(maxNumber));
      } catch {
        /* network hiccup — try again next tick */
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, onLoginPage]);

  // Once per day, raise an overdue summary when there is overdue work.
  useEffect(() => {
    if (!token || onLoginPage) return;
    const count = overdueRef.current?.length || 0;
    if (count === 0) return;
    if (localStorage.getItem(OVERDUE_KEY())) return;

    showNativeNotification({
      key: OVERDUE_KEY(),
      title: count === 1 ? "1 overdue lead" : `${count} overdue leads`,
      body: "Tap to review leads that need follow-up.",
      extra: { route: "/pipeline" },
    });
    localStorage.setItem(OVERDUE_KEY(), "1");
  }, [token, onLoginPage, overdue]);

  return null;
};

export default NativeNotificationManager;

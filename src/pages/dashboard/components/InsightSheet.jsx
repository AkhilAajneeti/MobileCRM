import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../../../components/AppIcon";

/**
 * Insight sheet (spec 9) — lists the records behind whichever funnel stage
 * was tapped.
 *
 * A bottom sheet on mobile, a centred dialog from `sm`. Replaces the old
 * horizontally-scrolling table, which was unusable on a phone.
 */

const STAGE_CONFIG = {
  meetings: {
    title: "Today's Meetings",
    accent: "#3B82F6",
    icon: "Calendar",
    empty: "No meetings created or scheduled today yet.",
  },
  siteVisitsScheduled: {
    title: "Site Visits Scheduled Today",
    accent: "#0EA5E9",
    icon: "CalendarCheck",
    empty: "No site visits booked today yet.",
  },
  visits: {
    title: "Site Visits",
    accent: "#F59E0B",
    icon: "MapPin",
    empty: "No site visits completed today yet.",
  },
  purchased: {
    title: "Purchased Today",
    accent: "#10B981",
    icon: "BadgeCheck",
    empty: "No purchases logged today yet.",
  },
};

const alpha = (hex, value) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${value})`;
};

const Field = ({ label, children, wide = false }) => (
  <div className={`flex flex-col gap-0.5 ${wide ? "col-span-2" : ""}`}>
    <dt className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {label}
    </dt>
    <dd className="text-sm text-foreground">{children}</dd>
  </div>
);

const InsightSheet = ({
  stageKey,
  records = [],
  onClose,
  formatTime,
  formatDate,
}) => {
  const config = stageKey ? STAGE_CONFIG[stageKey] : null;
  const isOpen = Boolean(stageKey && config);

  // Lock background scroll, and close on Escape / hardware back.
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={config.title}
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            drag="y"
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose?.();
            }}
            className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[rgba(20,20,30,0.08)] bg-card shadow-[0_-8px_40px_-12px_rgba(16,24,40,0.25)] sm:max-w-2xl sm:rounded-2xl"
          >
            {/* Grab handle — mobile only */}
            <div className="flex shrink-0 justify-center pt-2 sm:hidden">
              <span className="h-1 w-9 rounded-full bg-slate-300" />
            </div>

            <header className="flex shrink-0 items-center justify-between gap-3 px-5 py-4">
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                style={{ background: alpha(config.accent, 0.12) }}
              >
                <Icon name={config.icon} size={18} color={config.accent} />
              </span>

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[15px] font-bold tracking-tight text-foreground">
                  {config.title}
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  {records.length} {records.length === 1 ? "record" : "records"}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon name="X" size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-touch px-5 pb-6">
              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl"
                    style={{ background: alpha(config.accent, 0.1) }}
                  >
                    <Icon name={config.icon} size={26} color={config.accent} />
                  </span>
                  <p className="max-w-[16rem] text-sm text-muted-foreground">
                    {config.empty}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {records.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[rgba(20,20,30,0.07)] bg-background/60 p-3.5"
                    >
                      <p className="font-semibold text-foreground">{item.name}</p>

                      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2.5">
                        {stageKey === "meetings" ? (
                          <>
                            <Field label="Start">{formatTime(item.dateStart)}</Field>
                            <Field label="End">{formatTime(item.dateEnd)}</Field>

                            {item.joinUrl && (
                              <Field label="Join URL" wide>
                                <span className="flex items-center gap-2">
                                  <a
                                    href={item.joinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="truncate text-primary hover:underline"
                                  >
                                    {item.joinUrl}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigator.clipboard?.writeText(item.joinUrl)
                                    }
                                    aria-label="Copy join URL"
                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted"
                                  >
                                    <Icon name="Copy" size={14} />
                                  </button>
                                </span>
                              </Field>
                            )}

                            {item.insightType && (
                              <div className="col-span-2">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    item.insightType === "Created Today"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-green-100 text-green-700"
                                  }`}
                                >
                                  {item.insightType}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <Field label="Assigned">
                              {item.assignedUserName || "—"}
                            </Field>
                            <Field label="Created By">
                              {item.createdByName || "—"}
                            </Field>
                            <Field label="Created" wide>
                              {formatDate(item.createdAt) || "—"}
                            </Field>
                          </>
                        )}
                      </dl>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InsightSheet;

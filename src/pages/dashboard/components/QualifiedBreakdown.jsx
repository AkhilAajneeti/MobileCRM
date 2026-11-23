import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../../../components/AppIcon";

/**
 * Qualified breakdown drawer (spec 4.3).
 *
 * Opens under the qualification row when "Qualified Now" is tapped, and
 * splits that number across the statuses that make it up.
 */

/** Stage accents and icons, teal through indigo in pipeline order. */
export const QUALIFIED_STAGES = [
  { status: "Follow up", label: "Follow up", accent: "#14B8A6", icon: "TrendingUp" },
  { status: "Interested", label: "Interested", accent: "#0D9488", icon: "Heart" },
  { status: "Site Visit Scheduled", label: "Visit Scheduled", accent: "#0E7490", icon: "CalendarCheck" },
  { status: "Invitation Sent", label: "Invitation Sent", accent: "#0369A1", icon: "Send" },
  { status: "Site Visit Done", label: "Visit Done", accent: "#1D4ED8", icon: "MapPin" },
  { status: "Purchased", label: "Purchased", accent: "#4338CA", icon: "CheckCircle2" },
];

const QualifiedBreakdown = ({ isOpen, rows = [], isLoading }) => {
  const total = rows.reduce((sum, row) => sum + (row.value || 0), 0);
  const present = rows.filter((row) => row.value > 0);

  // Bars scale to the LARGEST status, not to the total. With hundreds in
  // Follow up and single digits in Purchased, scaling to the total collapses
  // every small status into an invisible sliver. The percentage beside each
  // row still reads against the total, so nothing is lost — the bar is there
  // for ranking at a glance.
  const largest = Math.max(1, ...rows.map((row) => row.value || 0));

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
          <div className="relative mb-8 rounded-2xl border border-[#99F6E4] bg-gradient-to-br from-[#F0FDFA] via-white to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,.04),0_8px_28px_rgba(13,148,136,.10)] sm:p-6">
            {/* Notch pointing back at the card that opened it, so the drawer
                reads as belonging to that card rather than floating. */}
            <span
              aria-hidden
              className="absolute -top-[7px] left-10 h-3 w-3 rotate-45 border-l border-t border-[#99F6E4] bg-[#F0FDFA]"
            />

            <header className="mb-5 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  What makes up the qualified leads
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Each lead counted once, in the status it holds right now.
                </p>
              </div>
              <p className="text-xs text-slate-500">
                <span className="text-lg font-bold tracking-tight text-teal-700 tabular-nums">
                  {total.toLocaleString("en-IN")}
                </span>{" "}
                across {present.length}{" "}
                {present.length === 1 ? "status" : "statuses"}
              </p>
            </header>

            {isLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">
                Loading breakdown…
              </p>
            ) : (
              <div className="space-y-2.5">
                {rows.map((row, index) => {
                  const share = total ? Math.round((row.value / total) * 100) : 0;
                  const width = `${Math.round((row.value / largest) * 100)}%`;

                  return (
                    <motion.div
                      key={row.status}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="group flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-[#CCFBF1] hover:bg-white"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${row.accent}, ${row.accent}cc)`,
                        }}
                      >
                        <Icon name={row.icon} size={16} />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-slate-800">
                            {row.label}
                          </span>
                          <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                            {row.value.toLocaleString("en-IN")}
                            <span className="ml-1.5 text-[11px] font-medium text-slate-400">
                              {share}%
                            </span>
                          </span>
                        </div>

                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width }}
                            transition={{
                              duration: 0.5,
                              delay: index * 0.06,
                              ease: "easeOut",
                            }}
                            className="h-full rounded-full"
                            style={{
                              background: `linear-gradient(90deg, ${row.accent}, ${row.accent}aa)`,
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <p className="mt-4 border-t border-[#CCFBF1] pt-3 text-[11px] leading-relaxed text-slate-500">
              Bars scale to the largest status so small ones stay visible;
              percentages read against the total. Qualified Due To Delay is
              counted on its own card and excluded here.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QualifiedBreakdown;

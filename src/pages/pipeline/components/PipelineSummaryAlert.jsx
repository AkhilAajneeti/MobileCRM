import React, { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../../components/AppIcon";

/**
 * PipelineSummaryAlert - the "what needs you today" banner shown on login.
 *
 * Presentation only: it reads the already-computed stats and renders a
 * dismissible summary. Hidden entirely when there is nothing urgent.
 */
const PipelineSummaryAlert = ({ stats = {} }) => {
  const [dismissed, setDismissed] = useState(false);

  const overdue = stats.overdue || 0;
  const dueToday = stats.dueToday || 0;
  const upcoming = stats.upcoming || 0;
  const hasUrgentWork = overdue + dueToday + upcoming > 0;

  if (dismissed || !hasUrgentWork) return null;

  const items = [
    {
      count: overdue,
      label: overdue === 1 ? "overdue lead" : "overdue leads",
      className: "text-red-600",
      icon: "AlertCircle",
    },
    {
      count: dueToday,
      label: dueToday === 1 ? "follow-up today" : "follow-ups today",
      className: "text-orange-600",
      icon: "CalendarClock",
    },
    {
      count: upcoming,
      label: upcoming === 1 ? "upcoming follow-up" : "upcoming follow-ups",
      className: "text-blue-600",
      icon: "CalendarDays",
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4"
      >
        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="BellRing" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              Here's what needs you today
            </h3>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
              {items.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <Icon
                    name={item.icon}
                    size={14}
                    className={item.className}
                  />
                  <span className={`font-bold ${item.className}`}>
                    {item.count}
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss summary"
        >
          <Icon name="X" size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default memo(PipelineSummaryAlert);

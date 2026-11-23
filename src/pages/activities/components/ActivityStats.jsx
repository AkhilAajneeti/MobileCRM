import React, { useMemo } from "react";
import StatTile from "../../../components/ui/StatTile";

const ActivityStats = ({ activities = [],total }) => {
  /* =========================
     HELPERS
  ========================= */

  const isToday = (date) => {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDate = new Date(date);
    activityDate.setHours(0, 0, 0, 0);

    return activityDate.getTime() === today.getTime();
  };

  /* =========================
     STATS
  ========================= */

  const stats = useMemo(() => {
    return {
      total: activities.length,

      created: activities.filter(
        (a) => a.type === "Create"
      ).length,

      updates: activities.filter(
        (a) => a.type === "Update"
      ).length,

      comments: activities.filter(
        (a) => a.type === "Post"
      ).length,

      today: activities.filter(
        (a) => isToday(a.createdAt)
      ).length,
    };
  }, [activities]);

  /* =========================
     UI
  ========================= */

  // One accent hex per tile drives its tint, glyph and selected ring.
  const statCards = [
    { label: "Total Activities", value: total, icon: "Activity", accent: "#2563EB" },
    { label: "Created", value: stats.created, icon: "PlusCircle", accent: "#059669" },
    { label: "Updates", value: stats.updates, icon: "RefreshCcw", accent: "#CA8A04" },
    { label: "Comments", value: stats.comments, icon: "MessageSquare", accent: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-6 sm:gap-4 lg:grid-cols-4">
      {statCards.map((stat) => (
        <StatTile
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          accent={stat.accent}
        />
      ))}
    </div>
  );
};

export default ActivityStats;
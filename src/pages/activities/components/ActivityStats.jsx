import React, { useMemo } from "react";
import Icon from "../../../components/AppIcon";

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

  const statCards = [
    {
      label: "Total Activities",
      value: total,
      icon: "Activity",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Created",
      value: stats.created,
      icon: "PlusCircle",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Updates",
      value: stats.updates,
      icon: "RefreshCw",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: "MessageSquare",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                {stat.label}
              </p>

              <p className="text-2xl font-bold text-foreground">
                {stat.value}
              </p>
            </div>

            <div
              className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}
            >
              <Icon
                name={stat.icon}
                size={24}
                className={stat.color}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityStats;
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Image from "../../../components/AppImage";
import Button from "../../../components/ui/Button";

const RecentActivities = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case "call":
        return "Phone";
      case "email":
        return "Mail";
      case "meeting":
        return "Calendar";
      case "task":
        return "CheckSquare";
      case "deal":
        return "Target";
      default:
        return "Activity";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-success";
      case "scheduled":
        return "text-warning";
      case "pending":
        return "text-muted-foreground";
      default:
        return "text-muted-foreground";
    }
  };

  // 🔥 TODAY + LATEST 5 LOGIC
  const todayActivities = useMemo(() => {
    const today = new Date().toDateString();

    return activities
      .filter((activity) => {
        if (!activity?.createdAt) return false;
        return new Date(activity.createdAt).toDateString() === today;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [activities]);

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Recent Activities
          </h3>
          <p className="text-sm text-muted-foreground">
            Latest updates from your sales team
          </p>
        </div>
      </div>
      <div className="space-y-4">
        {todayActivities?.map((activity, index) => (
          <motion.div
            key={activity?.id}
            className="flex items-start space-x-4 p-4 rounded-lg hover:bg-muted/50 transition-smooth cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  {/* LEFT */}
                  <div className="flex-1 min-w-0">
                    {/* TITLE */}
                    <h3 className="text-sm font-semibold text-foreground">
                      {activity.parentType}
                    </h3>

                    {/* ACTION SUMMARY (🔥 KEY PART) */}
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">
                        {activity.createdByName}
                      </span>{" "}
                      {activity.type === "Update" && "updated"}
                      {activity.type === "CreateRelated" && "added"}{" "}
                      {activity.relatedType || activity.parentType}
                      {activity.relatedName && (
                        <>
                          {" "}
                          <span className="font-medium text-foreground">
                            {activity.relatedName}
                          </span>
                        </>
                      )}
                    </p>

                    {/* CHANGE DETAILS */}
                    {activity?.data?.attributes?.was &&
                      activity?.data?.attributes?.became && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="line-through mr-2">
                            {activity.data.attributes.was.dateStart}
                          </span>
                          →
                          <span className="ml-2 font-medium text-foreground">
                            {activity.data.attributes.became.dateStart}
                          </span>
                        </div>
                      )}

                    {/* META */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        {activity.createdAt}
                      </div>

                      {activity.parentName && (
                        <div className="flex items-center gap-1">
                          <Icon name="Link" size={14} />
                          {activity.parentName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="flex flex-col items-end gap-2 text-xs">
                    {/* TYPE BADGE */}
                    <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {activity.type}
                    </span>

                    {/* COMPLETE ICON */}
                    <Icon name="Check" size={16} className="text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="ghost" className="w-full">
          <Icon name="ArrowRight" size={16} className="mr-2" />
          View All Activities
        </Button>
      </div>
    </motion.div>
  );
};

export default RecentActivities;

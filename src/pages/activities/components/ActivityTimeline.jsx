import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const ActivityTimeline = ({ activities, onEdit, onComplete, onReschedule }) => {
  /* =======================
     PAGINATION (ADDED)
  ======================= */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5; // same feel like AccountsTable

  const totalPages = Math.ceil((activities?.length || 0) / pageSize);

  const paginatedActivities = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activities?.slice(start, start + pageSize);
  }, [activities, currentPage]);

  /* =======================
     EXISTING HELPERS (UNCHANGED)
  ======================= */
  const getActivityIcon = (type) => {
    const iconMap = {
      task: "CheckSquare",
      call: "Phone",
      meeting: "Calendar",
      email: "Mail",
      note: "FileText",
    };
    return iconMap?.[type] || "Circle";
  };

  const getActivityColor = (type) => {
    const colorMap = {
      task: "text-blue-600",
      call: "text-green-600",
      meeting: "text-purple-600",
      email: "text-orange-600",
      note: "text-gray-600",
    };
    return colorMap?.[type] || "text-gray-600";
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  const getStatusValue = (activity) => {
    // Create activity
    if (activity.type === "Create") {
      return activity.data?.statusValue;
    }

    // Update activity
    if (activity.type === "Update") {
      return activity.data?.value || null;
    }

    return null;
  };

  const isOverdue = (dueDate, completed) => {
    if (completed) return false;
    return new Date(dueDate) < new Date();
  };
  const getActivityTitle = (activity) => {
    return `${activity.type} for ${activity.parentType} by ${activity.createdByName}`;
  };
  const canShowComplete = (activity) => {
    const completableTypes = ["Meeting", "Task"];

    return (
      completableTypes.includes(activity.parentType) &&
      activity.type === "Create" &&
      !activity.completed
    );
  };

  return (
    <div className="space-y-6">
      {/* =======================
          ACTIVITIES (ONLY THIS MAP REPLACED)
      ======================= */}
      {paginatedActivities?.map((activity, index) => (
        <div key={activity?.id} className="relative">
          {/* Timeline line */}
          {index < paginatedActivities?.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-16 bg-border" />
          )}

          <div className="flex items-start space-x-4">
            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  {/* LEFT CONTENT */}
                  <div className="flex-1 min-w-0">
                    {/* TOP LINE */}
                    <h3 className="text-sm font-semibold text-foreground mb-1 truncate">
                      {getActivityTitle(activity)}
                    </h3>

                    {/* SUB CONTEXT */}
                    {activity.parentName && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {activity.parentType} • {activity.parentName}
                      </p>
                    )}

                    {/* META INFO */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        Created {formatDate(activity.createdAt)}
                      </div>

                      {activity.modifiedAt && (
                        <div className="flex items-center gap-1">
                          <Icon name="Clock" size={14} />
                          Updated {formatDate(activity.modifiedAt)}
                        </div>
                      )}

                      {activity?.data?.assignedUserName && (
                        <div className="flex items-center gap-1">
                          <Icon name="User" size={14} />
                          Assigned to{" "}
                          <span className="font-medium text-foreground">
                            {activity.data.assignedUserName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* RIGHT STATUS + ACTIONS */}
                  <div className="flex flex-col items-end gap-2 text-xs">
                    {/* STATUS VALUE */}
                    {getStatusValue(activity) && (
                      <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                        {getStatusValue(activity)}
                      </span>
                    )}

                    {/* END DATE */}
                    {activity.data?.attributes?.became?.dateEnd && (
                      <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                        Ends{" "}
                        {formatDate(activity.data.attributes.became.dateEnd)}
                      </span>
                    )}

                    {/* COMPLETE ACTION */}
                    {canShowComplete(activity) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onComplete({
                          parentId: activity.parentId,
                          parentType: activity.parentType,
                        })}
                        className="h-8 w-8 text-green-600 hover:bg-green-50"
                        title="Mark as completed"
                      >
                        <Icon name="Check" size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* =======================
          PAGINATION (ONLY ONCE)
      ======================= */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </Button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;

import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import { Checkbox } from "../../components/ui/Checkbox";
import Icon from "../../components/AppIcon";
import ActivityTimeline from "./components/ActivityTimeline";
import ActivityFilters from "./components/ActivityFilters";
import QuickAddActivity from "./components/QuickAddActivity";
import BulkActions from "./components/BulkActions";
import ActivityStats from "./components/ActivityStats";
import TablePagination from "./components/TablePagination";
import { createActivity } from "services/activity.service";
import { deleteActivity } from "services/activity.service";
import { useActivities } from "hooks/useActivities";
import { updateTasks } from "services/tasks.service";
import { updateMeeting } from "services/meeting.service";
import toast from "react-hot-toast";
const Activities = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    dateType: "",
    closeDateFrom: "",
    closeDateTo: "",
    xDays: ""
  });
  const { data, isLoading: loading, refetch } = useActivities({ limit, page, filters });
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // operations
  useEffect(() => {
    setActivities(data?.list || []);
  }, [data]);



  const filteredActivities = activities;

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      type: "all",
      dateType: "",
      closeDateFrom: "",
      closeDateTo: "",
      xDays: ""
    });
    setPage(1);
  };

  const handleAddActivity = async (payload) => {
    try {
      const createdActivity = await createActivity(payload);

      // add new activity at top (timeline style)
      setActivities((prev) => [createdActivity, ...prev]);

      return createdActivity; // 👈 important for QuickAddActivity
    } catch (error) {
      console.error("Failed to create activity:", error);
      throw error;
    }
  };
  const handleEditActivity = (activity) => {
    // In a real app, this would open an edit modal
    console.log("Edit activity:", activity);
  };

  const handleCompleteActivity = async ({
    parentId,
    parentType,
  }) => {
    try {
      if (parentType === "Task") {
        await updateTasks(parentId, {
          status: "Completed",
        });
      }

      if (parentType === "Meeting") {
        await updateMeeting(parentId, {
          status: "Held",
        });
      }

      // refresh activities after update
      await refetch();
      toast.success("Activity marked as completed");
    } catch (error) {
      console.error("Failed to complete activity:", error);
    }
  };

  const handleRescheduleActivity = (activity) => {
    // In a real app, this would open a reschedule modal
    console.log("Reschedule activity:", activity);
  };

  const handleSelectActivity = (activityId, checked) => {
    if (checked) {
      setSelectedActivities((prev) => [...prev, activityId]);
    } else {
      setSelectedActivities((prev) => prev?.filter((id) => id !== activityId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedActivities(filteredActivities?.map((a) => a?.id));
    } else {
      setSelectedActivities([]);
    }
  };

  const handleBulkComplete = async () => {
    try {
      const selectedItems = activities.filter((activity) =>
        selectedActivities.includes(activity.id)
      );

      const taskUpdates = selectedItems
        .filter((a) => a.parentType === "Task")
        .map((a) =>
          updateTasks(a.parentId, {
            status: "Completed",
          })
        );

      const meetingUpdates = selectedItems
        .filter((a) => a.parentType === "Meeting")
        .map((a) =>
          updateMeeting(a.parentId, {
            status: "Held",
          })
        );

      await Promise.all([
        ...taskUpdates,
        ...meetingUpdates,
      ]);

      await refetch();
      toast.success("Activity marked as completed");
      setSelectedActivities([]);
    } catch (error) {
      console.error("Bulk complete failed:", error);
    }
  };

  const handleBulkReassign = (newOwner) => {
    setActivities((prev) =>
      prev?.map((activity) =>
        selectedActivities?.includes(activity?.id)
          ? { ...activity, owner: newOwner }
          : activity,
      ),
    );
    setSelectedActivities([]);
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedActivities.length} activities?`,
      )
    ) {
      return;
    }

    try {
      // 🔥 Call delete API for all selected activities
      await Promise.all(selectedActivities.map((id) => deleteActivity(id)));

      // ✅ Update UI only after success
      setActivities((prev) =>
        prev.filter((activity) => !selectedActivities.includes(activity.id)),
      );

      setSelectedActivities([]);
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete some activities. Please try again.");
    }
  };

  const handleClearSelection = () => {
    setSelectedActivities([]);
  };
  const ActivitySkeleton = () => (
    <div className="flex items-start space-x-4 animate-pulse">
      {/* Checkbox */}
      <div className="h-4 w-4 bg-gray-300/60 rounded mt-6"></div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        {/* Title */}
        <div className="h-4 w-48 bg-gray-300/70 rounded"></div>

        {/* Subtitle */}
        <div className="h-3 w-32 bg-gray-300/50 rounded"></div>

        {/* Description */}
        <div className="h-3 w-full bg-gray-300/40 rounded"></div>

        {/* Meta (date/user) */}
        <div className="h-3 w-24 bg-gray-300/40 rounded"></div>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {total} Activities
              </h1>
              <p className="text-muted-foreground">
                Track and manage your sales activities, tasks, and follow-ups
              </p>
            </div>

            <Button
              variant="default" className="linearbg-1 text-white hover:text-white"
              onClick={() => setIsQuickAddOpen(true)}
              iconName="Plus"
              iconPosition="left"
            >
              Quick Add Activity
            </Button>
          </div>

          {/* Activity Stats */}
          {/* <ActivityStats activities={activities} total={total} /> */}

          {/* Activity Filters */}
          <ActivityFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            totalCount={total}
            filteredCount={filteredActivities?.length}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedActivities?.length}
            onMarkComplete={handleBulkComplete}
            onReassign={handleBulkReassign}
            onDelete={handleBulkDelete}
            onClearSelection={handleClearSelection}
          />

          {/* Activities List */}
          <div className="bg-card border border-border rounded-lg">
            {/* List Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={
                    selectedActivities?.length === filteredActivities?.length &&
                    filteredActivities?.length > 0
                  }
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="mr-2"
                />
                <h3 className="text-lg font-semibold text-foreground">
                  Activity Timeline ({filteredActivities?.length})
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="RefreshCw"
                  onClick={() => refetch()}
                >
                  Refresh
                </Button>
              </div>
            </div>

            {/* Activities Timeline */}
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : filteredActivities?.length === 0 ? (
                <div className="text-center py-12">
                  <Icon
                    name="Calendar"
                    size={48}
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No activities found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activities?.length === 0
                      ? "Get started by creating your first activity"
                      : "Try adjusting your filters to see more activities"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setIsQuickAddOpen(true)}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Add Activity
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection checkboxes for timeline items */}
                  {filteredActivities?.map((activity) => (
                    <div
                      key={activity?.id}
                      className="flex items-start space-x-4"
                    >
                      <Checkbox
                        checked={selectedActivities?.includes(activity?.id)}
                        onChange={(e) =>
                          handleSelectActivity(activity?.id, e?.target?.checked)
                        }
                        className="mt-6"
                      />
                      <div className="flex-1">
                        <ActivityTimeline
                          activities={[activity]}
                          onEdit={handleEditActivity}
                          onComplete={handleCompleteActivity}
                          onReschedule={handleRescheduleActivity}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(val) => {
                setLimit(val);
                setPage(1);
              }}
            />
          </div>
        </div>
      </main>
      {/* Quick Add Activity Modal */}
      <QuickAddActivity
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleAddActivity}
      />
    </div>
  );
};

export default Activities;

import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { fetchUser } from "services/user.service";
// import { fetchStatus } from "services/others.service";

const DealsFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  dealCount,
  onBulkAction,
  selectedCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [assignUser, setAssignUser] = useState([]);
  // const [status, setStatus] = useState([]);


  // 
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const [statusRes] = await Promise.all([
  //         fetchStatus(),
  //       ]);

  //       setStatus(statusRes.options || []);
  //     } catch (err) {
  //       console.error("Failed to load data", err);
  //     }
  //   };

  //   loadData();
  // }, []);
  // const statusOptions = status
  //   .filter((item) => item !== "")
  //   .map((item) => ({
  //     value: item,
  //     label: item,
  //   }));
  const statusOptions = [
    { value: "Not Started", label: "Not Started" },
    { value: "Started", label: "Started" },
    { value: "Completed", label: "Completed" },
    { value: "Canceled", label: "Canceled" },
    { value: "Deferred", label: "Deferred" },
  ];
  const priorityOptions = [
    { value: "", label: "All Status" },
    { value: "Low", label: "Low" },
    { value: "Normal", label: "Normal" },
    { value: "High", label: "High" },
    { value: "Urgent", label: "Urgent" },
  ];
  const bulkActions = [
    { value: "massupdate", label: "Mass Update", icon: "Update" },
    { value: "export", label: "Export Selected", icon: "Download" },
    { value: "delete", label: "Delete Selected", icon: "Trash2" },
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const handleBulkActionSelect = (action) => {
    onBulkAction(action);
    setShowBulkActions(false);
  };
  useEffect(() => {
    fetchUser()
      .then((res) => setAssignUser(res.list || []))
      .catch((err) => console.error("User fetch failed", err));
  }, []);

  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7Days" },

    { label: "Before", value: "before" },
    { label: "After", value: "after" },

    { label: "Between", value: "between" },
    { label: "This Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];
  const showDateInputs = ["between", "after", "before"].includes(filters?.dateType);
  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  )?.length;
  const assignUserOptions = assignUser.map((acc) => ({
    value: acc.id, // 👈 important (ID use karo)
    label: acc.name,
  }));
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            Deals ({dealCount})
          </h2>
          {activeFiltersCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? "s" : ""}{" "}
                active
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {selectedCount > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount} selected
              </span>
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  <Icon name="MoreHorizontal" size={16} className="mr-1" />
                  Actions
                </Button>

                {showBulkActions && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowBulkActions(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-elevation-2 z-50">
                      <div className="py-1">
                        {bulkActions?.map((action) => (
                          <button
                            key={action?.value}
                            onClick={() =>
                              handleBulkActionSelect(action?.value)
                            }
                            className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-smooth"
                          >
                            <Icon
                              name={action?.icon}
                              size={16}
                              className="mr-2"
                            />
                            {action?.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden"
          >
            <Icon name="Filter" size={16} className="mr-1" />
            Filters
            <Icon
              name="ChevronDown"
              size={16}
              className={`ml-1 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>
      {/* Filters */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${isExpanded ? "block" : "hidden lg:grid"}`}
      >
        <Input
          type="search"
          placeholder="Search Task..."
          value={filters?.search || ""}
          onChange={(e) => handleFilterChange("search", e?.target?.value)}
          className="lg:col-span-2"
        />

        <Select
          placeholder="Status"
          options={statusOptions}
          value={filters?.status || ""}
          onChange={(value) => handleFilterChange("status", value)}
        />
        <Select
          placeholder="Priority"
          options={priorityOptions}
          value={filters?.priority || ""}
          onChange={(value) => handleFilterChange("priority", value)}
        />

        <Select
          placeholder="Assign User"
          options={assignUserOptions}
          value={filters?.assignUser || ""}
          onChange={(value) => handleFilterChange("assignUser", value)}
          searchable
        />
        <Select
          options={ACTIVITY_DATE_FILTERS}
          value={filters?.dateType || ""}
          onChange={(value) =>
            handleFilterChange("dateType", value)}
          placeholder="Filter by date"
          className="min-w-0"
        />
        {/* Date Range Inputs */}
        {showDateInputs && (
          <div className="flex gap-2">
            <Input
              type="date"
              value={filters?.startDate || ""}
              onChange={(e) =>
                handleFilterChange("startDate", e.target.value)
              }
            />

            {filters?.dateType === "between" && (
              <Input
                type="date"
                value={filters?.endDate || ""}
                onChange={(e) =>
                  handleFilterChange("endDate", e.target.value)
                }
              />
            )}
          </div>
        )}
      </div>
      {/* Advanced Filters Toggle */}
      {/* <div className="hidden lg:flex items-center justify-between mt-4 pt-4 border-t border-border">

        <Button variant="outline" size="sm">
          <Icon name="Download" size={16} className="mr-1" />
          Export All
        </Button>
      </div> */}
    </div>
  );
};

export default DealsFilters;

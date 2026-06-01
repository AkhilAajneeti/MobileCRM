import React from "react";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const ActivityFilters = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalCount,
  filteredCount,
}) => {
  const activityTypeOptions = [
    { value: "all", label: "All Types" },
    { value: "Account", label: "Account" },
    { value: "Task", label: "Task" },
    // { value: "Call", label: "Training" },
    { value: "Meeting", label: "Meeting" },
    { value: "Lead", label: "Lead" },
    { value: "Contact", label: "Contact" },
  ];
  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Last 7 Days", value: "lastSevenDays" },
    { label: "Current Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
    // special
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
  ];
  const showDateInputs = ["on", "before", "after", "between"].includes(filters?.dateType);
  const showXDaysInput = ["lastXDays", "afterXDays"].includes(filters?.dateType);
  const hasActiveFilters = () => {
    return (
      filters?.type !== "all" ||
      filters?.search ||
      filters?.dateType ||
      filters?.closeDateFrom ||
      filters?.closeDateTo ||
      filters?.xDays
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Filter Activities
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-4">
        {/* Search */}
        <div className="lg:col-span-1">
          <Input
            type="search"
            placeholder="Search activities..."
            value={filters?.search}
            onChange={(e) => onFilterChange("search", e?.target?.value)}
            className="w-full"
          />
        </div>
        {/* Activity Type */}
        <Select
          options={activityTypeOptions}
          value={filters?.type}
          onChange={(value) => onFilterChange("type", value)}
          placeholder="Activity Type"
        />
        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


          {/* Date Type Select */}
          <Select
            className="min-w-0"
            placeholder="Filter by date"
            options={ACTIVITY_DATE_FILTERS}
            value={filters?.dateType || ""}
            onChange={(value) => onFilterChange("dateType", value)}
          />

          {/* X Days Input */}
          {showXDaysInput && (
            <Input
              type="number"
              placeholder="Enter days"
              value={filters?.xDays || ""}
              onChange={(e) =>
                onFilterChange("xDays", e.target.value)
              }
            />
          )}

          {/* Date Range Inputs */}
          {showDateInputs && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters?.closeDateFrom || ""}
                onChange={(e) =>
                  onFilterChange("closeDateFrom", e.target.value)
                }
              />

              {filters?.dateType === "between" && (
                <Input
                  type="date"
                  value={filters?.closeDateTo || ""}
                  onChange={(e) =>
                    onFilterChange("closeDateTo", e.target.value)
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-4 mt-3">
        <span className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} activities
        </span>

        {hasActiveFilters() && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            iconName="X"
            iconPosition="left"
          >
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default ActivityFilters;

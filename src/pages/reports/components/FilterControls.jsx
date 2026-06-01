import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { fetchUser } from "services/user.service";
import RoleGuard from "components/RoleGuard";

const FilterControls = ({
  filters,
  onFiltersChange,
  onClearFilters,
  dealCount,
  onBulkAction,
  selectedCount,
  toggleAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [assignUser, setAssignUser] = useState([]);

  const daysOptions = [
    { label: "Today", value: "today" },
    // 🔥 we keep yesterday in UI but handle it smartly
    { label: "Last 7 Days", value: "lastSevenDays" },
    { label: "Current Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  useEffect(() => {
    fetchUser()
      .then((res) => setAssignUser(res.list || []))
      .catch((err) => console.error("User fetch failed", err));
  }, []);

  const handleBulkActionSelect = (action) => {
    onBulkAction(action);
    setShowBulkActions(false);
  };
  const showDateInputs = [
    "between",
    "after",
    "before",
    "on"
  ].includes(filters?.dateType);

  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  )?.length;
  const assignUserOptions = assignUser.map((acc) => ({
    value: acc.id, // 👈 important (ID use karo)
    label: acc.name,
  }));
  const sourceOptions = [
    { value: "Call", label: "Call" },
    { value: "Email", label: "Email" },
    { value: "Existing Customer", label: "Existing Customer" },
    { value: "Partner", label: "Partner" },
    { value: "Public Relations", label: "Public Relations" },
    { value: "Web Site", label: "Web Site" },
    { value: "Campaign", label: "Campaign" },
    { value: "Other", label: "Other" },
    { value: "ACL", label: "Aajneeti" },
  ];
  const statusOptions = [
    { value: "Broker", label: "Broker" },
    { value: "Call Later", label: "Call Later" },
    { value: "Call Not Connecting", label: "Call Not Connecting" },
    { value: "Call Not Picked", label: "Call Not Picked" },
    { value: "Dead", label: "Dead" },
    { value: "Fake Lead", label: "Fake Lead" },
    { value: "Follow up", label: "Follow up" },
    { value: "Interested", label: "Interested" },
    { value: "Invalid Number", label: "Invalid Number" },
    { value: "Irrelevant Lead", label: "Irrelevant Lead" },
    { value: "Low Budget", label: "Low Budget" },
    { value: "Low Interest", label: "Low Interest" },
    { value: "New", label: "New" },
    { value: "Not Interested", label: "Not Interested" },
    { value: "Other Location", label: "Other Location" },
    { value: "Purchased", label: "Purchased" },
    { value: "Site Visit Done", label: "Site Visit Done" },
    { value: "Site Visit Scheduled", label: "Site Visit Scheduled" },
    { value: "Switch Off", label: "Switch Off" },
  ];
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            leads ({dealCount?.toLocaleString()})
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
            className="lg:hidden w-full"
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
          placeholder="Search leads..."
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
          placeholder="Filter By Days"
          options={daysOptions}
          value={filters?.dateType || ""}
          onChange={(value) => handleFilterChange("dateType", value)}
        />

        <Select
          placeholder="Source"
          options={sourceOptions}
          value={filters?.source || ""}
          onChange={(value) => handleFilterChange("source", value)}
        />
        <Select
          placeholder="Assign User"
          options={assignUserOptions}
          value={filters?.assignUser || ""}
          onChange={(value) => handleFilterChange("assignUser", value)}
          searchable
        />
      </div>
      {/* Advanced Filters Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {showDateInputs && (
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters?.closeDateFrom || ""}
                onChange={(e) =>
                  handleFilterChange("closeDateFrom", e.target.value)
                }
              />
              {filters?.dateType === "between" && (
                <Input
                  type="date"
                  value={filters?.closeDateTo || ""}
                  onChange={(e) =>
                    handleFilterChange("closeDateTo", e.target.value)
                  }
                />
              )}
            </div>
          )}
        </div>
        <RoleGuard allowedRoles={["admin", "regular"]}>
          <Button onClick={toggleAnalytics} className="linearbg-1 text-white hover:text-white">Report Analytics</Button>
        </RoleGuard>
      </div>
    </div>
  );
};

export default FilterControls;

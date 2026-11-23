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
  selectedCount,
  toggleAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const showDateInputs = [
    "between",
    "after",
    "before",
    "on"
  ].includes(filters?.dateType);

  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  )?.length;

  /** Human labels for the active-filter pills. */
  const FILTER_LABELS = {
    search: "Search",
    status: "Status",
    source: "Source",
    assignUser: "User",
    dateType: "Date",
    closeDateFrom: "From",
    closeDateTo: "To",
  };

  const activeFilterEntries = Object.entries(filters || {}).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );

  const today = new Date().toISOString().split("T")[0];
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
    // Note the 2xl radius and softer list-card shadow — slightly different
    // from the Leads page panel, which uses rounded-xl and shadow-sm.
    <div className="mb-6 rounded-2xl border border-[rgba(20,20,30,0.08)] bg-card shadow-[0_1px_2px_rgba(16,24,40,.04),0_4px_16px_rgba(16,24,40,.06)]">
      {/* Header strip */}
      <div className="rounded-t-2xl border-b border-border bg-gradient-to-r from-slate-50/80 via-slate-50/30 to-transparent px-5 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* BarChart3 here, not the Leads panel's Target */}
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/10">
                <Icon name="BarChart3" size={14} className="text-primary" />
              </span>
              <h2 className="text-base font-semibold text-foreground">
                Leads
                <span className="ml-1.5 text-sm font-medium text-muted-foreground tabular-nums">
                  {dealCount?.toLocaleString()}
                </span>
              </h2>

              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={onClearFilters}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear all
                </Button>
              )}

              {/* Feedback only — Reports has no bulk update or mass delete,
                  so there are deliberately no action buttons beside it. */}
              {selectedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-100/80 px-2.5 py-1 text-xs font-medium text-violet-700">
                  <Icon name="CheckCircle2" size={12} />
                  {selectedCount} selected
                </span>
              )}
            </div>

            {/* Active-filter pills — neutral here, not primary-tinted */}
            {activeFilterEntries.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {activeFilterEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(20,20,30,0.1)] bg-muted/60 py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
                  >
                    <span className="text-muted-foreground">
                      {FILTER_LABELS[key] || key}
                    </span>
                    <span className="max-w-[120px] truncate font-semibold">
                      {String(value)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFilterChange(key, "")}
                      aria-label={`Remove ${FILTER_LABELS[key] || key} filter`}
                      className="ml-0.5 grid place-items-center rounded-full p-0.5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                    >
                      <Icon name="X" size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full lg:hidden"
          >
            <Icon name="SlidersHorizontal" size={14} className="mr-1.5" />
            Filters
            <Icon
              name="ChevronDown"
              size={14}
              className={`ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Filter grid */}
      <div
        className={`grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-5 ${isExpanded ? "block" : "hidden lg:grid"}`}
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
      {/* Footer row */}
      <div className="flex flex-col justify-between gap-3 border-t border-border px-4 pb-4 pt-4 sm:flex-row sm:items-end">
        <div className="w-full">
          {showDateInputs && (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Input
                type="date"
                // Never let someone pick a future start date.
                max={today}
                value={filters?.closeDateFrom || ""}
                onChange={(e) =>
                  handleFilterChange("closeDateFrom", e.target.value)
                }
              />
              {filters?.dateType === "between" && (
                <Input
                  type="date"
                  // The end of a range cannot precede its start.
                  min={filters?.closeDateFrom || undefined}
                  max={today}
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
          <Button
            onClick={toggleAnalytics}
            fullWidth
            className="linearbg-1 text-white hover:text-white sm:w-auto"
          >
            Report Analytics
          </Button>
        </RoleGuard>
      </div>
    </div>
  );
};

export default FilterControls;

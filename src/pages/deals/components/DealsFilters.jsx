import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { fetchUser } from "services/user.service";
import RoleGuard from "components/RoleGuard";
import { useTeams } from "hooks/useTeams";
import { LEAD_FILTER_STATUS_OPTIONS } from "utils/statusTokens";

const DealsFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  total,
  onBulkAction,
  selectedCount,
  toggleAnalytics,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [assignUser, setAssignUser] = useState([]);

  const bulkActions = [
    { value: "mass-update", label: "Mass Update", icon: "GitBranch" },
    // { value: "export", label: "Export Selected", icon: "Download" },
    // { value: "delete", label: "Delete Selected", icon: "Trash2" },
  ];


  const sourceOptions = [
    { value: "Call", label: "Call" },
    { value: "Email", label: "Email" },
    { value: "Existing Customer", label: "Existing Customer" },
    { value: "Partner", label: "Partner" },
    { value: "Public Relations", label: "Public Relations" },
    // value must match the actual cSubSource string stored on leads (matched
    // case-insensitively as a `like %value%` on the backend). "Web Site" keeps
    // its space; "Aajneeti" replaces the old "ACL" code so it matches the
    // stored "aajneeti".
    { value: "Web Site", label: "Web Site" },
    { value: "Campaign", label: "Campaign" },
    { value: "Aajneeti", label: "Aajneeti" },
    { value: "Meta", label: "Meta" },
    { value: "Other", label: "Other" },
  ];
  // Sourced from statusTokens.js, same list as the drawer plus QDTD (QA 2.1).
  const statusOptions = LEAD_FILTER_STATUS_OPTIONS;
  /**
   * Quick date pills (spec 8.1) -- these stay visible even when the filter
   * grid is collapsed, because they are what a rep reaches for most.
   * Every variant is a full literal class string for the Tailwind JIT.
   */
  const QUICK_DATE_PILLS = [
    {
      label: "Today",
      value: "today",
      dot: "bg-emerald-500",
      idle: "border-emerald-200 bg-emerald-50 text-emerald-700",
      active: "border-emerald-400 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300",
    },
    {
      label: "Yesterday",
      value: "yesterday",
      dot: "bg-amber-500",
      idle: "border-amber-200 bg-amber-50 text-amber-700",
      active: "border-amber-400 bg-amber-100 text-amber-800 ring-1 ring-amber-300",
    },
    {
      label: "Last 7 Days",
      value: "lastSevenDays",
      dot: "bg-sky-500",
      idle: "border-sky-200 bg-sky-50 text-sky-700",
      active: "border-sky-400 bg-sky-100 text-sky-800 ring-1 ring-sky-300",
    },
    {
      label: "Current Month",
      value: "currentMonth",
      dot: "bg-violet-500",
      idle: "border-violet-200 bg-violet-50 text-violet-700",
      active: "border-violet-400 bg-violet-100 text-violet-800 ring-1 ring-violet-300",
    },
    {
      label: "Last Month",
      value: "lastMonth",
      dot: "bg-rose-500",
      idle: "border-rose-200 bg-rose-50 text-rose-700",
      active: "border-rose-400 bg-rose-100 text-rose-800 ring-1 ring-rose-300",
    },
  ];

  /** Human labels for the active-filter pills. */
  const FILTER_LABELS = {
    search: "Search",
    status: "Status",
    sector: "Sector",
    cProject: "Project",
    source: "Source",
    assignUser: "User",
    team: "Team",
    dateType: "Date",
    closeDateFrom: "From",
    closeDateTo: "To",
    xDays: "Days",
  };

  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "lastSevenDays" },
    { label: "Current Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
    // { label: "Next Month", value: "nextMonth" },
    { label: "Current Quarter", value: "currentQuarter" },
    { label: "Last Quarter", value: "lastQuarter" },
    { label: "Current Year", value: "currentYear" },
    { label: "Last Year", value: "lastYear" },
    { label: "Past", value: "past" },
    { label: "Future", value: "future" },
    { label: "Ever", value: "ever" },
    { label: "Is Empty", value: "isEmpty" },

    // special
    { label: "On", value: "on" },
    { label: "Before", value: "before" },
    { label: "After", value: "after" },
    { label: "Between", value: "between" },
    { label: "Last X Days", value: "lastXDays" },
    // { label: "After X Days", value: "afterXDays" },
  ];
  const showDateInputs = ["on", "before", "after", "between"].includes(filters?.dateType);
  const showXDaysInput = ["lastXDays", "afterXDays"].includes(filters?.dateType);
  const handleFilterChange = (key, value) => {
    let updated = {
      ...filters,
      [key]: value,
    };

    // 🔥 reset dependent fields when dateType changes
    if (key === "dateType") {
      updated.closeDateFrom = "";
      updated.closeDateTo = "";
      updated.xDays = "";
    }

    onFiltersChange(updated);
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

  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== null && value !== undefined,
  )?.length;
  const assignUserOptions = assignUser.map((acc) => ({
    value: acc.id, // 👈 important (ID use karo)
    label: acc.name,
  }));

  // Teams list — cached via React Query, only fetched once until staleTime expires.
  const { data: teamsData } = useTeams();
  const teamOptions = (teamsData?.list || []).map((t) => ({
    value: t.id,
    label: t.name,
  }));
  /** The active filters, as removable pills. */
  const activeFilterEntries = Object.entries(filters || {}).filter(
    ([, value]) => value !== "" && value !== null && value !== undefined,
  );

  const removeFilter = (key) => handleFilterChange(key, "");

  return (
    <div className="bg-card border border-border rounded-xl mb-6 shadow-sm">
      {/* Header strip */}
      <div className="px-5 py-3 bg-gradient-to-r from-slate-50/80 via-slate-50/30 to-transparent border-b border-border rounded-t-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid w-7 h-7 shrink-0 place-items-center rounded-lg bg-primary/10">
            <Icon name="Target" size={14} className="text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Leads</h2>
          <span className="text-sm font-medium text-muted-foreground tabular-nums">
            {total?.toLocaleString?.() ?? total}
          </span>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="ml-auto text-xs"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Active-filter pills */}
        {activeFilterEntries.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {activeFilterEntries.map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20"
              >
                <span className="text-primary/60">{FILTER_LABELS[key] || key}</span>
                <span className="font-semibold max-w-[120px] truncate">
                  {String(value)}
                </span>
                <button
                  type="button"
                  onClick={() => removeFilter(key)}
                  aria-label={`Remove ${FILTER_LABELS[key] || key} filter`}
                  className="rounded-full p-0.5 transition-colors active:bg-primary/20"
                >
                  <Icon name="X" size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Quick date pills -- visible even when the grid is collapsed */}
      <div className="flex flex-wrap gap-2 px-4 pt-3">
        {QUICK_DATE_PILLS.map((pill) => {
          const isActive = filters?.dateType === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              // Tapping the active pill clears it.
              onClick={() => handleFilterChange("dateType", isActive ? "" : pill.value)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150 active:scale-95 ${
                isActive ? pill.active : pill.idle
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${pill.dot}`} />
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Selection + bulk actions */}
      {selectedCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 px-5 py-3 bg-gradient-to-r from-violet-100/80 via-fuchsia-100/70 to-pink-100/80 border-y border-violet-200/60">
          <div className="grid w-9 h-9 shrink-0 place-items-center rounded-full bg-white/80 ring-1 ring-violet-200 text-violet-600">
            <Icon name="CircleDot" size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-violet-900">
              {selectedCount} lead{selectedCount !== 1 ? "s" : ""} selected
            </div>
            <div className="text-[11px] text-violet-700/70">
              Choose an action to apply to all of them
            </div>
          </div>

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
                        onClick={() => handleBulkActionSelect(action?.value)}
                        className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground transition-smooth active:bg-muted"
                      >
                        <Icon name={action?.icon} size={16} className="mr-2" />
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

      {/* Mobile toggle -- the grid is collapsed by default on mobile */}
      <div className="px-4 pt-3 lg:hidden">
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          fullWidth
        >
          <Icon name="SlidersHorizontal" size={14} className="mr-2" />
          {isExpanded ? "Hide filters" : "Filters"}
          <Icon
            name="ChevronDown"
            size={16}
            className={`ml-auto transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      {/* Filter grid */}
      <div
        className={`grid grid-cols-1 gap-3 p-4 md:grid-cols-2 lg:grid-cols-5 lg:gap-4 ${
          isExpanded
            ? "animate-in fade-in slide-in-from-top-4 duration-300"
            : "hidden lg:grid"
        }`}
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

        <Input
          placeholder="Project Name"
          value={filters?.cProject || ""}
          onChange={(e) => handleFilterChange("cProject", e.target.value)}
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
        <Select
          placeholder="Team"
          options={teamOptions}
          value={filters?.team || ""}
          onChange={(value) => handleFilterChange("team", value)}
          searchable
          clearable
          // Allow long team names to wrap in the dropdown list, give the
          // panel a touch more breathing room, and surface the full name on
          // hover (the trigger stays clean via the existing truncate).
          wrapOptions
          dropdownClassName="min-w-[260px]"
        />
        {/* Date Type Select */}
        <Select
          className="min-w-0"
          placeholder="Filter by date"
          options={ACTIVITY_DATE_FILTERS}
          value={filters?.dateType || ""}
          onChange={(value) => handleFilterChange("dateType", value)}
        />

        {/* X Days Input */}
        {showXDaysInput && (
          <Input
            type="number"
            placeholder="Enter days"
            value={filters?.xDays || ""}
            onChange={(e) =>
              handleFilterChange("xDays", e.target.value)
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

        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-end ${showDateInputs?"lg:col-span-2":"lg:col-span-3"}`}>
          <Button onClick={toggleAnalytics} className="linearbg-1 text-white hover:text-white">
            <Icon name="Plus" size={16} className="mr-2" />
            Lead Analytics
          </Button>
        </div>

      </div>

    </div>
  );
};

export default DealsFilters;

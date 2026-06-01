import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";
const AccountsFilters = ({ onFiltersChange, activeFilters, resultCount, total, limit, page }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activityDateFilter, setActivityDateFilter] = useState("last_7_days");
  const industryOptions = [
    { value: "", label: "All Industries" },
    { value: "advertising", label: "Advertising" },
    { value: "construction", label: "Construction" },
    { value: "consulting", label: "Consulting" },
    { value: "education", label: "Education" },
    { value: "finance", label: "Finance" },
    { value: "manufacturing", label: "Manufacturing" },
    { value: "real-estate", label: "Real Estate" },
    { value: "healthcare", label: "Healthcare" },
    { value: "software", label: "Software" },
    { value: "automotive", label: "Automotive" },
    { value: "venture Capital", label: "Venture Capital" },
    { value: "insurance", label: "Insurance" },
  ];

  const typeOptions = [
    { value: "", label: "All Revenue Ranges" },
    { value: "customer", label: "Customer" },
    { value: "partner", label: "Partner" },
    { value: "reseller", label: "Reseller" },
    { value: "investor", label: "Investor" },
  ];

  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "lastSevenDays" },

    { label: "Before", value: "before" },
    { label: "After", value: "after" },

    { label: "Between", value: "between" },
    { label: "This Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];
  const showDateInputs = ["between", "after", "before"].includes(activeFilters?.dateType);
  const handleDateFilterChange = (value) => {
    setActivityDateFilter(value);

    onFiltersChange({
      ...activeFilters,
      dateType: value,
    });
  };
  const handleFilterChange = (filterType, value) => {
    onFiltersChange({
      ...activeFilters,
      [filterType]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      industry: "",
      search: "",
      type: "",
      dateType: "",
      startDate: "",
      endDate: "",
    });
  };

  const hasActiveFilters = Object.values(activeFilters)?.some(
    (value) => value !== "",
  );
  const activeFilterCount = Object.values(activeFilters)?.filter(
    (value) => value !== "",
  )?.length;


  // add ranges 
  const start = total === 0 ? 0 : (page - 1) * (limit + 1)
  const end = Math.min(page * limit, total)

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="hidden sm:grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
            <Input
              type="search"
              placeholder="Search by account name..."
              value={activeFilters?.search || ""}
              onChange={(e) =>
                handleFilterChange("search", e.target.value)
              }
              className="border px-3 py-2 rounded-md w-full"
            />
            <Select
              options={industryOptions}
              value={activeFilters?.industry || ""}
              onChange={(value) => handleFilterChange("industry", value)}
              placeholder="Filter by industry"
              className="min-w-0"
            />

            <Select
              options={typeOptions}
              value={activeFilters?.type || ""}
              onChange={(value) => handleFilterChange("type", value)}
              placeholder="Filter by type"
              className="min-w-0"
            />

            <Select
              options={ACTIVITY_DATE_FILTERS}
              value={activeFilters?.dateType || ""}
              onChange={handleDateFilterChange}
              placeholder="Filter by date"
              className="min-w-0"
            />
            {/* Date Range Inputs */}
            {showDateInputs && (
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={activeFilters?.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                />

                {activeFilters?.dateType === "between" && (
                  <Input
                    type="date"
                    value={activeFilters?.endDate || ""}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                  />
                )}
              </div>
            )}
          </div>

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="sm:hidden"
          >
            <Icon name="Filter" size={16} className="mr-2" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            <Icon
              name={isExpanded ? "ChevronUp" : "ChevronDown"}
              size={16}
              className="ml-2"
            />
          </Button>
        </div>

        {/* Results and Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-sm text-muted-foreground">
            {start}-{end}/{total} {resultCount === 1 ? "account" : "accounts"} found
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="X" size={16} className="mr-2" />
                Clear filters
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {activeFilters?.industry && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>
                Industry:{" "}
                {
                  industryOptions?.find(
                    (opt) => opt?.value === activeFilters?.industry,
                  )?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("industry", "")}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}

          {activeFilters?.revenue && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>
                Revenue:{" "}
                {
                  typeOptions?.find((opt) => opt?.value === activeFilters?.type)
                    ?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("type", "")}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}

          {activeFilters?.region && (
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
              <span>
                Region:{" "}
                {
                  regionOptions?.find(
                    (opt) => opt?.value === activeFilters?.region,
                  )?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("region", "")}
                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          )}
        </div>
      )}
      {/* Mobile Expanded Filters */}
      {isExpanded && (
        <div className="sm:hidden mt-4 pt-4 border-t border-border">
          <div className="space-y-3">
            <Select
              options={industryOptions}
              value={activeFilters?.industry || ""}
              onChange={(value) => handleFilterChange("industry", value)}
              placeholder="Filter by industry"
            />

            <Select
              options={typeOptions}
              value={activeFilters?.type || ""}
              onChange={(value) => handleFilterChange("type", value)}
              placeholder="Filter by revenue"
            />

            <Select
              options={ACTIVITY_DATE_FILTERS}
              value={activeFilters?.dateType || ""}
              onChange={handleDateFilterChange}
              placeholder="Filter by date"
              className="min-w-0"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsFilters;

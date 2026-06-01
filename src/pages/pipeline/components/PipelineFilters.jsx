import React, { useState, useMemo, memo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { useUsers } from "hooks/useUsers";
import { getDistinctOptions } from "../utils/pipelineHelpers";
import {
  PIPELINE_COLUMNS,
  PRIORITY_OPTIONS,
} from "../utils/pipelineConstants";

/**
 * PipelineFilters - presentation only.
 *
 * Filter state lives in the pipeline store (via usePipelineFilters); this
 * component just renders the controls. Status / source option lists are
 * derived from the deals currently in the pipeline.
 */
const PipelineFilters = ({
  filters,
  deals = [],
  onFilterChange,
  onReset,
  activeFilterCount = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: users } = useUsers();

  const ownerOptions = useMemo(
    () => [
      { value: "all", label: "All Owners" },
      ...(users?.list || []).map((user) => ({
        value: user.id,
        label: user.name,
      })),
    ],
    [users],
  );

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "All Statuses" },
      ...getDistinctOptions(deals, "status"),
    ],
    [deals],
  );

  const sourceOptions = useMemo(
    () => [
      { value: "all", label: "All Sources" },
      ...getDistinctOptions(deals, "source"),
    ],
    [deals],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "all", label: "All Columns" },
      ...PIPELINE_COLUMNS.map((column) => ({
        value: column.id,
        label: column.name,
      })),
    ],
    [],
  );

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon name="Filter" size={20} className="text-muted-foreground" />
          <h3 className="font-medium text-card-foreground">Pipeline Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              iconName="X"
              iconPosition="left"
              iconSize={14}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="lg:hidden"
            aria-label={isExpanded ? "Collapse filters" : "Expand filters"}
          >
            <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className={`space-y-4 ${isExpanded ? "block" : "hidden lg:block"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Icon
              name="Search"
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Search lead, company, owner..."
              value={filters?.search || ""}
              onChange={(e) => onFilterChange("search", e?.target?.value)}
              className="pl-9"
            />
          </div>

          {/* Column / category */}
          <Select
            placeholder="Column"
            options={categoryOptions}
            value={filters?.category || "all"}
            onChange={(value) => onFilterChange("category", value)}
          />

          {/* Owner */}
          <Select
            placeholder="Owner"
            searchable
            options={ownerOptions}
            value={filters?.owner || "all"}
            onChange={(value) => onFilterChange("owner", value)}
          />

          {/* Status */}
          <Select
            placeholder="Status"
            options={statusOptions}
            value={filters?.status || "all"}
            onChange={(value) => onFilterChange("status", value)}
          />

          {/* Source */}
          <Select
            placeholder="Source"
            options={sourceOptions}
            value={filters?.source || "all"}
            onChange={(value) => onFilterChange("source", value)}
          />

          {/* Priority */}
          <Select
            placeholder="Priority"
            options={PRIORITY_OPTIONS}
            value={filters?.priority || "all"}
            onChange={(value) => onFilterChange("priority", value)}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(PipelineFilters);

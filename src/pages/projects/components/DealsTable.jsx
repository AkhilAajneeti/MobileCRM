import React, { useState, useMemo } from "react";
import { isOwnRecord, getStoredUser } from "../../../utils/permission.js";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const DealsTable = ({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onDealClick,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  onDelete,
  isLoading,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const formatDate = (date) => {
    if (!date) return "—"; // null / undefined / empty

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "—"; // invalid date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })?.format(new Date(date));
  };

  const getStageColor = (stage) => {
    const colors = {
      Started: "bg-blue-100 text-blue-800",
      Completed: "bg-green-100 text-green-800",
      Deffered: "bg-orange-100 text-danger-800",
      Canceled: "bg-purple-100 text-purple-800",
      "Not Started": "bg-gray-100 text-gray-700",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };
  const getPrioriyColor = (stage) => {
    const colors = {
      Low: "bg-blue-100 text-blue-800",
      Normal: "bg-green-100 text-green-800",
      High: "bg-orange-100 text-danger-800",
      Urgent: "bg-purple-100 text-purple-800",
    };

    return colors?.[stage] || "bg-gray-100 text-gray-800";
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 80) return "text-green-600";
    if (probability >= 60) return "text-yellow-600";
    if (probability >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return (
        <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />
      );
    }
    return sortConfig?.direction === "asc" ? (
      <Icon name="ArrowUp" size={16} className="text-primary" />
    ) : (
      <Icon name="ArrowDown" size={16} className="text-primary" />
    );
  };

  const handleQuickAction = (e, action, deal) => {
    e?.stopPropagation();
    onDealClick(deal);
    console.log(`${action} action for deal:`, deal?.id);
  };
  const handleDelete = async (e, deal) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete Task ${deal?.name}?`);
    if (!ok) return;

    await onDelete(deal.id); // 👈 parent ko bol rahe ho
  };

  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return deals?.slice(startIndex, startIndex + itemsPerPage);
  }, [deals, currentPage, itemsPerPage]);

  const isAllSelected =
    selectedDeals?.length === paginatedDeals?.length &&
    paginatedDeals?.length > 0;
  const isIndeterminate =
    selectedDeals?.length > 0 && selectedDeals?.length < paginatedDeals?.length;

  const SkeletonRow = () => (
    <tr className="animate-pulse border-t border-border">
      {/* Checkbox */}
      <td className="p-4">
        <div className="h-4 w-4 bg-gray-300/60 rounded"></div>
      </td>

      {/* Company */}
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300/60 rounded-lg"></div>
          <div>
            <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
            <div className="h-3 w-32 bg-gray-300/50 rounded"></div>
          </div>
        </div>
      </td>

      {/* Industry */}
      <td className="p-4">
        <div className="h-4 w-20 bg-gray-300/60 rounded"></div>
      </td>

      {/* Type */}
      <td className="p-4">
        <div className="h-4 w-16 bg-gray-300/60 rounded"></div>
      </td>

      {/* status */}
      <td className="p-4">
        <div className="h-4 w-24 bg-gray-300/60 rounded"></div>
      </td>


      {/* Actions */}
      <td className="p-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
          <div className="h-8 w-8 bg-gray-300/60 rounded"></div>
        </div>
      </td>
    </tr>
  );
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("name")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Name</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Assigned User
                </span>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Create By</span>
                  {getSortIcon("closeDate")}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-smooth"
                >
                  <span>Modified At</span>
                  {getSortIcon("closeDate")}
                </button>
              </th>
              <th className="w-24 px-4 py-3">
                <span className="text-sm font-medium text-foreground">
                  Actions
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="6">
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No projects available
                  </div>
                </td>
              </tr>
            ) : (paginatedDeals?.map((deal) => (
              <tr
                key={deal?.id}
                onMouseEnter={() => setHoveredRow(deal?.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className="hover:bg-muted/30 cursor-pointer transition-smooth"
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedDeals?.includes(deal?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      onSelectDeal(deal?.id, e?.target?.checked);
                    }}
                  />
                </td>
                <td className="px-4 py-4" onClick={() => onDealClick(deal)}>
                  <div className="font-medium text-foreground">
                    {deal?.name}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div
                    className={`text-sm font-medium ${getProbabilityColor(
                      deal?.assignedUserName,
                    )}`}
                  >
                    {deal?.assignedUserName}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div className="text-sm text-foreground">
                    {formatDate(deal?.createdAt)}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm text-foreground">
                    {formatDate(deal?.modifiedAt)}
                  </div>
                </td>

                <td className="px-4 py-4">
                  <div
                    className={`flex items-center space-x-1 transition-opacity`} >
                    {isOwnRecord(deal, getStoredUser()) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleQuickAction(e, "edit", deal)}
                        className="h-8 w-8"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                    )}

                    {isOwnRecord(deal, getStoredUser()) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(e, deal)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      {/* Mobile Task / Deal Cards */}
      <div className="md:hidden">
        {paginatedDeals?.map((deal) => (
          <div
            key={deal?.id}
            onClick={() => onDealClick(deal)}
            className="p-4 border-b border-border bg-background hover:bg-muted/30 transition"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox */}
              <Checkbox
                checked={selectedDeals?.includes(deal?.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelectDeal(deal?.id, e.target.checked);
                }}
                className="mt-1"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground truncate">
                    {deal?.name}
                  </h3>


                </div>

                {/* Project Name */}
                {deal?.name && (
                  <div className="text-sm text-muted-foreground mt-1 truncate">
                    {deal?.address}
                  </div>
                )}

                {/* Assigned User */}
                {deal?.assignedUserName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Icon name="User" size={12} />
                    Assigned to{" "}
                    <span className="truncate">{deal?.assignedUserName}</span>
                  </div>
                )}

                {/* Created At */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Icon name="Calendar" size={12} />
                  Created: {formatDate(deal?.createdAt)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsTable;

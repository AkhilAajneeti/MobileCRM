import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import InitialsAvatar from "../../../components/ui/InitialsAvatar";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import LeadCard from "./LeadCard";
import {
  formatDate,
  getSourceBadgeColor,
  getSourceLabel,
} from "../../../utils/statusTokens";

/**
 * The leads list.
 *
 * Mobile (< md) renders the LeadCard stack from spec 5 -- the only list
 * layout on a phone, never a horizontally scrolling table. The table is
 * kept for md and up.
 */
const DealsTable = ({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onDealClick,
  onQuickEdit,
  sortConfig,
  onSort,
  canEdit = () => true,
  canDelete = () => true,
  canWhatsapp = () => true,
  onDelete,
  isLoading,
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const getSortIcon = (column) => {
    if (sortConfig?.key !== column) {
      return <Icon name="ArrowUpDown" size={16} className="text-muted-foreground" />;
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
  };

  const handleDelete = async (e, deal) => {
    e.stopPropagation();
    const ok = window.confirm(`Delete lead ${deal?.name}?`);
    if (!ok) return;

    // Flash + slide the row out before the data refetch removes it.
    setDeletingId(deal.id);
    try {
      await onDelete(deal.id);
    } finally {
      setDeletingId(null);
    }
  };

  const paginatedDeals = deals;
  const isAllSelected =
    selectedDeals?.length === paginatedDeals?.length && paginatedDeals?.length > 0;
  const isIndeterminate =
    selectedDeals?.length > 0 && selectedDeals?.length < paginatedDeals?.length;

  const SkeletonRow = () => (
    <tr className="animate-pulse border-t border-border">
      <td className="p-4">
        <div className="h-4 w-4 rounded bg-gray-300/60" />
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-gray-300/60" />
          <div>
            <div className="mb-1 h-4 w-24 rounded bg-gray-300/70" />
            <div className="h-3 w-32 rounded bg-gray-300/50" />
          </div>
        </div>
      </td>
      {Array.from({ length: 6 }).map((_, i) => (
        <td className="p-4" key={i}>
          <div className="h-4 w-20 rounded bg-gray-300/60" />
        </td>
      ))}
      <td className="p-4">
        <div className="flex space-x-2">
          <div className="h-8 w-8 rounded bg-gray-300/60" />
          <div className="h-8 w-8 rounded bg-gray-300/60" />
        </div>
      </td>
    </tr>
  );

  /** Mobile loading: pulse skeletons, never a spinner over an empty list. */
  const SkeletonCard = () => (
    <div className="animate-pulse p-4">
      <div className="mb-2 h-4 w-32 rounded bg-gray-300/60" />
      <div className="h-3 w-24 rounded bg-gray-300/50" />
    </div>
  );

  const EmptyState = () => (
    <div className="flex h-[200px] items-center justify-center text-sm text-gray-400">
      No leads available
    </div>
  );

  return (
    <div>
      {/* ---------------- Desktop table ---------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => onSelectAll(e?.target?.checked)}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("name")}
                  className="flex max-w-[150px] items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span className="truncate">Name</span>
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("cProjectName")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span>Project Name</span>
                  {getSortIcon("cProjectName")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("source")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span>Source</span>
                  {getSortIcon("source")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("status")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span>Status</span>
                  {getSortIcon("status")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("cNextContactAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span>Next Contact</span>
                  {getSortIcon("cNextContactAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => onSort("createdAt")}
                  className="flex items-center space-x-2 text-sm font-medium text-foreground transition-smooth hover:text-primary"
                >
                  <span>Created At</span>
                  {getSortIcon("createdAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-sm font-medium text-foreground">Assigned User</span>
              </th>
              <th className="w-24 px-4 py-3">
                <span className="text-sm font-medium text-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="9">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              paginatedDeals?.map((deal) => (
                <tr
                  key={deal?.id}
                  onMouseEnter={() => setHoveredRow(deal?.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`cursor-pointer transition-smooth hover:bg-muted/30 ${
                    deletingId === deal?.id
                      ? "-translate-x-16 bg-red-100 opacity-0 ease-in [transition-duration:280ms]"
                      : ""
                  }`}
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
                    <div className="font-medium capitalize text-foreground">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-foreground">
                      {deal?.cProject || deal?.cProjectName || "None"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getSourceBadgeColor(
                        deal
                      )}`}
                    >
                      {getSourceLabel(deal)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={deal?.status} size="pill" />
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-foreground tabular-nums">
                      {formatDate(deal?.cNextContactAt)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground tabular-nums">
                      {formatDate(deal?.createdAt)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {deal?.assignedUserName && (
                        <InitialsAvatar name={deal.assignedUserName} size={24} />
                      )}
                      <span className="text-sm font-medium capitalize text-foreground">
                        {deal?.assignedUserName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`flex items-center space-x-1 transition-opacity ${
                        hoveredRow === deal?.id ? "opacity-100" : "opacity-50"
                      }`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleQuickAction(e, "edit", deal)}
                        className="h-8 w-8"
                        aria-label={`Open ${deal?.name}`}
                      >
                        <Icon name="Edit" size={14} />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          const message = `Hello *${deal?.name || "Customer"}*, Thank you for contacting us for your lead generation requirements. I'm *${deal?.assignedUserName}*. Let me know when you're available so that we can discuss this in more detail.`;
                          window.open(
                            `https://api.whatsapp.com/send/?phone=${deal?.phoneNumber}&text=${encodeURIComponent(message)}`,
                            "_blank"
                          );
                        }}
                        className="h-8 w-8 rounded-full transition-all duration-200 hover:bg-green-100"
                        aria-label={`WhatsApp ${deal?.name}`}
                      >
                        <img
                          src="/assets/whatsapp-logo.png"
                          alt="WhatsApp"
                          className="h-5 w-5 object-contain"
                        />
                      </Button>

                      {canDelete(deal) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, deal)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${deal?.name}`}
                        >
                          <Icon name="Trash2" size={14} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ---------------- Mobile cards ---------------- */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !paginatedDeals?.length ? (
          <EmptyState />
        ) : (
          <AnimatePresence initial={false}>
            {paginatedDeals.map((deal) => (
              <LeadCard
                key={deal?.id}
                deal={deal}
                isSelected={selectedDeals?.includes(deal?.id)}
                onSelect={onSelectDeal}
                onOpen={onDealClick}
                onQuickEdit={onQuickEdit}
                canEdit={canEdit(deal)}
                canWhatsapp={canWhatsapp(deal)}
                isDeleting={deletingId === deal?.id}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default React.memo(DealsTable);

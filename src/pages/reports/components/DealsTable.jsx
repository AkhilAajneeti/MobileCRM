import React, { useMemo } from "react";
import Icon from "../../../components/AppIcon";
import { StatusTag, SourceTag, Assignee } from "./ReportTags";

const DealsTable = ({
  deals,
  sortConfig,
  onSort,
  currentPage,
  itemsPerPage,
  isLoading,
}) => {

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


  // `deals` is already a single page of results from the backend
  // (parent fetches via `useNewLeads({ limit, page, filters })`). Slicing it
  // again with currentPage/itemsPerPage was double-paginating — page 2 was
  // trying to slice indices [10..20] of a 10-item page array, giving []
  // back and rendering an empty table. Use `deals` as-is.
  const paginatedDeals = useMemo(() => deals || [], [deals]);

  // No select-all / indeterminate state here: this table is read-only and
  // has no checkboxes (spec 9).

  const SortButton = ({ column, label, align = "left" }) => (
    <button
      onClick={() => onSort(column)}
      className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground ${
        align === "right" ? "flex-row-reverse" : ""
      }`}
    >
      <span>{label}</span>
      {getSortIcon(column)}
    </button>
  );

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-4">
        <div className="h-4 w-24 bg-gray-300/70 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-32 bg-gray-300/60 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-4 w-20 bg-gray-300/60 rounded"></div>
      </td>
      <td className="px-4 py-4">
        <div className="h-5 w-16 bg-gray-300/60 rounded-full"></div>
      </td>
    </tr>
  );
  /** Names the filters as the reason, unlike the Leads page's generic copy. */
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-muted">
        <Icon name="SearchX" size={26} className="text-muted-foreground/60" />
      </span>
      <p className="text-sm text-muted-foreground">
        No leads match these filters
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(20,20,30,0.08)] bg-card shadow-[0_1px_2px_rgba(16,24,40,.04),0_4px_16px_rgba(16,24,40,.06)]">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          {/* Each sortable header passes the SAME key to onSort and to
              getSortIcon. They were mismatched ("account" vs "Project Name",
              "Source" vs "value"), so the active sort arrow never appeared. */}
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-6 py-4 text-left">
                <SortButton column="name" label="Name" />
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-bold uppercase tracking-[0.05em] text-muted-foreground">
                  Project
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <SortButton column="source" label="Source" />
              </th>
              <th className="px-6 py-4 text-left">
                <SortButton column="status" label="Status" />
              </th>
              <th className="px-6 py-4 text-left">
                <SortButton column="assignedUserName" label="Assigned" />
              </th>
              <th className="px-6 py-4 text-right">
                <SortButton column="createdAt" label="Created" align="right" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !paginatedDeals?.length ? (
              <tr>
                <td colSpan="6">
                  <EmptyState />
                </td>
              </tr>
            ) : (
              paginatedDeals?.map((deal) => (
                // Read-only: no row click. Acting on a lead lives on the
                // Leads page; this surface is for scanning and comparing.
                // Zebra striping at 18% muted makes a wide grid easier to
                // track across.
                <tr
                  key={deal?.id}
                  className="border-b border-border/60 transition-colors even:bg-muted/[0.18] last:border-b-0 hover:bg-sky-50"
                >
                  <td className="px-4 py-4">
                    <div className="text-[17px] font-semibold capitalize text-foreground">
                      {deal?.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[14px] text-muted-foreground">
                      {deal?.cProject || deal?.cProjectName || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <SourceTag source={deal?.source} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusTag status={deal?.status} />
                  </td>
                  <td className="px-6 py-4">
                    <Assignee name={deal?.assignedUserName} />
                  </td>
                  <td className="px-6 py-4 text-right text-[14px] tabular-nums text-muted-foreground">
                    {formatDate(deal?.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}

      {/* Mobile rows (spec 9.4). Flat rows separated by dividers: no card
          surface, no border, no rounding, no status-tinted background —
          deliberately plainer than the Leads card, because this list is for
          reading rather than acting. Read-only: no row click, no checkbox,
          no action buttons. */}
      <div className="divide-y divide-border/60 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse p-5">
              <div className="mb-2 h-4 w-36 rounded bg-muted" />
              <div className="h-3.5 w-28 rounded bg-muted" />
            </div>
          ))
        ) : !paginatedDeals?.length ? (
          <EmptyState />
        ) : (
          paginatedDeals.map((deal) => (
            <div key={deal?.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 flex-1 truncate text-[17px] font-semibold capitalize text-foreground">
                  {deal?.name}
                </h3>
                <StatusTag status={deal?.status} />
              </div>

              {(deal?.cProject || deal?.cProjectName) && (
                <p className="mt-1 truncate text-[13px] text-muted-foreground">
                  {deal?.cProject || deal?.cProjectName}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <SourceTag source={deal?.source} />
                <Assignee name={deal?.assignedUserName} />
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Icon name="Calendar" size={13} />
                Created {formatDate(deal?.createdAt)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DealsTable;

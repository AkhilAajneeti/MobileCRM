import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import { canEditRecord } from "utils/permission";
const AccountsTable = ({
  accounts,
  onRowClick,
  onBulkAction,
  onSelectionChange,
  isLoading,
  page,
  setPage,
  total,
  limit,
  setLimit,
  canEdit = true,
  canDelete = true,
}) => {
  // do some changes

  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  // const [page, setpage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const [visibleColumns, setVisibleColumns] = useState({
    company: true,
    industry: true,
    revenue: true,
    contacts: true,
    dealValue: true,
    lastActivity: true,
    actions: true,
  });

  const columns = [
    { key: "company", label: "Account Name", sortable: true },
    { key: "industry", label: "Industry", sortable: true },
    // { key: "revenue", label: "Annual Revenue", sortable: true },
    { key: "contacts", label: "Type", sortable: true },
    // { key: "dealValue", label: "Deal Value", sortable: true },
    { key: "lastActivity", label: "Last Activity", sortable: true },
    { key: "actions", label: "Actions", sortable: false },
  ];

  const pageSizeOptions = [
    { value: 10, label: "10 per page" },
    { value: 25, label: "25 per page" },
    { value: 50, label: "50 per page" },
    { value: 100, label: "100 per page" },
  ];

  // Filter and sort data


  // Pagination
  const totalPages = Math.ceil(total / limit);
  // const accounts = filteredAndSortedData?.slice(
  //   (page - 1) * pageSize,
  //   page * pageSize,
  // );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev?.key === key && prev?.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(new Set(accounts.map((account) => account.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected?.add(id);
    } else {
      newSelected?.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  useEffect(() => {
    onSelectionChange(Array.from(selectedRows));
  }, [selectedRows]);
  const currentUserId = JSON.parse(localStorage.getItem("login_object"))?.id;

  const canEditDeal = (deal) =>
    canEditRecord("Account", deal) &&
    deal?.assignedUserId === currentUserId;
  const isAllSelected =
    accounts?.length > 0 && selectedRows?.size === accounts?.length;
  const isIndeterminate =
    selectedRows?.size > 0 && selectedRows?.size < accounts?.length;
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

      {/* Last Activity */}
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
      {/* Table Header with Search and Filters */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

          <div className="flex items-center gap-2">
            {selectedRows?.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedRows?.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onBulkAction("delete", Array.from(selectedRows))
                  }
                >
                  <Icon name="Trash2" size={16} className="mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onBulkAction("export", Array.from(selectedRows))
                  }
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export
                </Button>
                <Button
                  variant="Action"
                  size="sm"
                  onClick={() =>
                    onBulkAction("mass-update", Array.from(selectedRows))
                  }
                >
                  <Icon name="Edit" size={16} className="mr-2" />
                  Mass Update
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="w-12 p-4">
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                />
              </th>
              {columns?.map(
                (column) =>
                  visibleColumns?.[column?.key] && (
                    <th
                      key={column?.key}
                      className="text-left p-4 font-medium text-muted-foreground"
                    >
                      {column?.sortable ? (
                        <button
                          onClick={() => handleSort(column?.key)}
                          className="flex items-center space-x-1 hover:text-foreground transition-colors"
                        >
                          <span>{column?.label}</span>
                          {sortConfig?.key === column?.key && (
                            <Icon
                              name={
                                sortConfig?.direction === "asc"
                                  ? "ChevronUp"
                                  : "ChevronDown"
                              }
                              size={16}
                            />
                          )}
                        </button>
                      ) : (
                        column?.label
                      )}
                    </th>
                  ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : !accounts?.length ? (
              <tr>
                <td colSpan="6">
                  <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
                    No account available
                  </div>
                </td>
              </tr>
            ) : (
              accounts?.map((account) => (
                <tr
                  key={account?.id}
                  className="border-t border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onRowClick(account)}
                >
                  <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                    <Checkbox
                      checked={selectedRows?.has(account?.id)}
                      onChange={(e) =>
                        handleSelectRow(account?.id, e?.target?.checked)
                      }
                    />
                  </td>
                  {visibleColumns?.company && (
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Icon
                            name="Building2"
                            size={16}
                            className="text-primary"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {account?.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {account?.website}
                          </div>
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns?.industry && (
                    <td className="p-4 text-foreground">{account?.industry}</td>
                  )}

                  {visibleColumns?.contacts && (
                    <td className="p-4 text-foreground">{account?.type}</td>
                  )}

                  {visibleColumns?.lastActivity && (
                    <td className="p-4 text-muted-foreground">
                      {formatDate(account?.modifiedAt)}
                    </td>
                  )}
                  {visibleColumns?.actions && (
                    <td className="p-4" onClick={(e) => e?.stopPropagation()}>
                      <div className="flex items-center space-x-1">
                        {canEdit && canEditDeal(account) ? (<Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRowClick(account, "edit")}
                        >
                          <Icon name="Edit" size={16} />
                        </Button>) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRowClick(account, "view")}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                        )}
                        {canDelete && (<Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-red-50"
                          onClick={() =>
                            onBulkAction("delete", [account.id])
                          }
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout */}
      {/* Mobile Card Layout – CLEAN CRM STYLE */}
      <div className="md:hidden">
        {accounts?.map((account) => (
          <div
            key={account?.id}
            className="p-4 border-b border-border last:border-b-0 bg-background hover:bg-muted/30 transition rounded-none"
          >
            {/* Top Row */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-5">
                <Checkbox
                  checked={selectedRows?.has(account?.id)}
                  onChange={(e) =>
                    handleSelectRow(account?.id, e?.target?.checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />

                <div onClick={() => onRowClick(account)}>
                  {/* Account Name */}
                  <h4 className="font-semibold text-foreground leading-tight">
                    {account?.name}
                  </h4>

                  {/* Website / Email */}
                  {account?.website && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {account?.website}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRowClick(account, "edit")}
              >
                <Icon name="Edit" size={16} />
              </Button>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 ms-4 mt-3">
              {account?.industry && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-primary/10 text-primary">
                  {account?.industry}
                </span>
              )}

              {account?.type && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-foreground">
                  {account?.type}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Select
              options={pageSizeOptions}
              value={limit}
              onChange={(val) => {
                setLimit(val);
                setPage(1)
              }}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              Showing{" "}
              {Math.min(
                (page - 1) * limit + 1,
                total,
              )}{" "}
              to{" "}
              {Math.min(page * limit, total)}{" "}
              of {total} results
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              <Icon name="ChevronsLeft" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              <Icon name="ChevronsRight" size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsTable;

import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import AccountsTable from "./components/AccountsTable";
import AccountsFilters from "./components/AccountsFilters";
import AccountDrawer from "./components/AccountDrawer";
import {
  createAccount,
  deleteAccount,
  fetchAccounts,
  updateAccount,
} from "services/account.service";
import toast from "react-hot-toast";
import ImportModel from "./components/ImportModel";
import { useAccounts } from "hooks/useAccounts";
import { useMetaData } from "hooks/useMetaData";
import { useQueryClient } from "@tanstack/react-query";
import { canCreate, canDelete, canEdit } from "utils/permission";

const AccountsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [drawerMode, setDrawerMode] = useState("view");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const canEditAccount = canEdit("Account");
  const canDeleteAccount = canDelete("Account");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);

  const [filters, setFilters] = useState({
    industry: "",
    search: "",
    type: "",
    dateType: "",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading } = useAccounts({ limit, page, filters });
  const { data: meta } = useMetaData();
  const queryClient = useQueryClient();
  const mockAccounts = data?.list || [];
  const industry = meta?.industries || [];
  const accType = meta?.type || [];
  const total = data?.total || 0;
  const handleAccountSuccess = async () => {
    try {
      const data = await fetchAccounts({ limit, page });
      queryClient.invalidateQueries(["accounts", limit, page]);
    } catch (error) {
      console.error("Failed to refresh accounts", error);
    }
  };
  const getDateRangeByFilter = (filter) => {
    const now = new Date();
    let start = null;
    let end = new Date();

    switch (filter) {
      case "today":
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;

      case "yesterday":
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setHours(23, 59, 59, 999);
        break;

      case "last_7_days":
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;

      case "current_month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;

      case "last_month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        break;

      default:
        return null;
    }

    return { startDate: start, endDate: end };
  };
  const canCreateAccount = canCreate("Account");


  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleRowClick = (account, mode = "view") => {
    setSelectedAccount(account);
    setIsDrawerOpen(true);
    setDrawerMode(mode);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedAccount(null);
    setDrawerMode("view");
  };

  const handleBulkAction = async (action, ids) => {
    if (action === "delete") {
      if (!ids?.length) {
        toast.error("Select at least one account");
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete ${ids.length} account(s)?`
      );

      if (!confirmed) return;

      try {
        toast.loading("Deleting account(s)...", {
          id: "delete-accounts",
        });

        // bulk delete safely
        await Promise.all(ids.map((id) => deleteAccount(id)));

        toast.success(`${ids.length} account(s) deleted`, {
          id: "delete-accounts",
        });

        // refresh table
        queryClient.invalidateQueries(["accounts"]);

        // clear selected
        setSelectedAccountIds([]);
      } catch (error) {
        console.error("Delete failed:", error);

        toast.error(
          error?.message || "Failed to delete account(s)",
          {
            id: "delete-accounts",
          }
        );
      }

      return;
    }

    if (action === "mass-update") {
      if (!ids.length) {
        alert("Select at least one account");
        return;
      }

      setSelectedAccount(null);
      setDrawerMode("mass-update");
      setIsDrawerOpen(true);
      setSelectedAccountIds(ids);
      return;
    }

    if (action === "export") {
      const accountsToExport =
        ids && ids.length > 0
          ? filteredAccounts.filter((acc) => ids.includes(acc.id))
          : filteredAccounts;

      if (!accountsToExport.length) {
        toast.error("No accounts to export");
        return;
      }

      handleExportAccount(accountsToExport);
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleAccountButton = () => {
    setSelectedAccount(null);
    setDrawerMode("create");

    setIsDrawerOpen(true);
  };
  // handle exports (bulk and indivisual)
  const handleExportAccount = (account) => {
    try {
      const exportData = account.map((account) => ({
        Name: account?.name || "",
        Industry: account?.industry || "",
        Website: account?.website || "",
        Phone: account?.phoneNumber || "",

        "Billing Street": account?.billingAddressStreet || "",
        "Billing City": account?.billingAddressCity || "",
        "Billing State": account?.billingAddressState || "",
        "Billing Country": account?.billingAddressCountry || "",
        "Billing Postal Code": account?.billingAddressPostalCode || "",

        Type: account?.type || "",
        Description: account?.description || "",
        "Created By": account?.createdByName || "",
        "Created At": account?.createdAt || "",
      }));

      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `accounts_export_${new Date().toISOString().split("T")[0]
        }.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(`Successfully exported ${exportData.length} accounts`);
    } catch (error) {
      console.error("Error exporting accounts:", error);
      alert("Failed to export accounts. Please try again.");
    }
  };
  const handleImportAccounts = async (rows) => {
    try {
      toast.loading("Importing accounts...", { id: "import" });

      let success = 0;
      let failed = 0;
      const failedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          const payload = {
            name: row.Name?.trim(),
            industry: row.Industry || "",
            website: row.Website || "",
            phoneNumber: row.Phone?.toString() || "",
            type: row.Type?.toLowerCase() || "",
            description: row.Description || "",

            // 🔥 usually required
            status: "active",
            source: "import",
          };

          // 🔒 frontend validation
          if (!payload.name) {
            failed++;
            failedRows.push({
              row: i + 1,
              reason: "Name is missing",
            });
            continue;
          }

          await createAccount(payload);
          queryClient.invalidateQueries(["accounts"]);
          success++;
        } catch (err) {
          console.error("❌ Import API error (full):", err);

          console.error("❌ response:", err?.response);
          console.error("❌ response data:", err?.response?.data);
          console.error("❌ status:", err?.response?.status);

          failedRows.push({
            row: i + 1,
            name: row.Name,
            error:
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              `HTTP ${err?.response?.status || "Unknown"}`,
          });
        }
      }
      if (failedRows.length) {
        console.group("❌ Account Import Failed Rows");
        console.table(failedRows);
        console.groupEnd();
      }

      toast.success(`Imported ${success} accounts (${failed} failed)`, {
        id: "import",
      });

      handleAccountSuccess();
    } catch (err) {
      toast.error("Import failed", { id: "import" });
    }
  };

  const handleBulkUpdateAccounts = async (ids, payload) => {
    try {
      toast.loading("Updating accounts...", { id: "bulk-update" });

      await Promise.all(ids.map((id) => updateAccount(id, payload)));

      toast.success(`${ids.length} accounts updated`, {
        id: "bulk-update",
      });

      handleAccountSuccess();
      setSelectedAccountIds([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };
  const handleAddActivity = (newActivity) => {
    setActivities((prev) => [newActivity, ...prev]);
  };
  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Accounts
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your customer companies and relationships
              </p>
            </div>

            <div className="flex items-center flex-wrap space-x-3 mt-4 sm:mt-0">
              <Button
                className="hidden"
                variant="outline"
                onClick={handleExportAccount}
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Import
              </Button>
              <Button onClick={handleAccountButton} className="linearbg-1">
                <Icon name="Plus" size={16} className="mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Filters */}
          <AccountsFilters
            onFiltersChange={handleFiltersChange}
            activeFilters={filters}
            resultCount={mockAccounts?.length}
            total={total}
            limit={limit}
            page={page}
          />

          {/* Accounts Table */}
          <AccountsTable
            accounts={mockAccounts}
            onRowClick={handleRowClick}
            onBulkAction={handleBulkAction}
            onSelectionChange={setSelectedAccountIds}
            isLoading={isLoading}
            page={page}
            setPage={setPage}
            total={total}
            limit={limit}
            setLimit={setLimit}
            canEdit={canEditAccount}
            canDelete={canDeleteAccount}
          />
        </div>
      </main>
      {/* Account Details Drawer */}
      <AccountDrawer
        accType={accType}
        industry={industry}
        account={selectedAccount}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onSuccess={handleAccountSuccess}
        mode={drawerMode}
        onBulkUpdate={handleBulkUpdateAccounts}
        selectedIds={selectedAccountIds}
      />

      {/* Quick Add Activity Modal */}
      <ImportModel
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onImport={handleImportAccounts}
      />
    </div>
  );
};

export default AccountsPage;

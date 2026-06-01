import React, { useState, useMemo, useEffect } from "react";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DealsTable from "./components/DealsTable";
import DealsFilters from "./components/DealsFilters";
import DealDrawer from "./components/DealDrawer";
import Papa from "papaparse";
import { useLocation } from "react-router-dom";
import TablePagination from "./components/TablePagination";
import {
  createTasks,
  deleteTasks,
  updateTasks,
  bulkDeleteTasks,
  deleteActivity,
} from "services/tasks.service";
import { useQueryClient } from "@tanstack/react-query";
import { useTasks, useTasksAll } from "hooks/useTasks";
import { useTask } from "hooks/useTask";
import { canCreate, canDelete, canEdit } from "utils/permission";
const TaskPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [mode, setMode] = useState("view");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const canCreateTask = canCreate("Task");
  const canEditTask = canEdit("Task");
  const canDeleteTask = canDelete("Task");
  const location = useLocation();

  const taskIdFromState = location.state?.taskId;
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignUser: "",
    startDate: "",
    endDate: "",
    dateType: "",
  });

  const queryClient = useQueryClient();
  const { data, isLoading } = useTasksAll({ limit, page, filters });;

  const leads = data?.list || [];
  const total = data?.total || 0;
  const loading = isLoading;

  // Mock deals data
  const handleDealClick = async (deal) => {
    setSelectedDeal(deal);
    setMode("view");
    setIsDrawerOpen(true);
  };
  const { data: selectedDealData } = useTask(
    selectedDeal?.id,
    isDrawerOpen && !!selectedDeal?.id
  );


  const totalPages = Math.ceil(total / limit);

  const exportLeadsToCSV = (rows, fileName = "leads_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((lead) => ({
      Name: lead?.name || "",
      Email: lead?.emailAddress || "",
      Status: lead?.status || "",
      "Parent Name": lead?.parentName || "",
      "Assigned User": lead?.assignedUserName || "",
      "Created At": lead?.createdAt || "",
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().split("T")[0]}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddLeads = () => {
    setSelectedDeal(null);
    setMode("add");
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
    setMode("view");
  };

  const handleCreateLead = async (payload) => {
    try {
      await createTasks(payload); // API
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task created successfully");
    } catch (err) {
      console.error("Task creationd failed", err);
    }
  };

  const handleUpdateTasks = async (id, payload) => {
    await updateTasks(id, payload);
    queryClient.invalidateQueries(["tasks"]);
  };
  const handleBulkUpdateTasks = async (ids, payload) => {
    try {
      toast.loading("Updating tasks...", { id: "bulk-update" });

      await Promise.all(ids.map((id) => updateTasks(id, payload)));
      queryClient.invalidateQueries(["tasks"]);
      toast.success(`${ids.length} tasks updated`, { id: "bulk-update" });
      setSelectedDeals([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  //deletion delete
  const handleDeleteLead = async (id) => {
    try {
      toast.loading("Deleting task...", { id: "delete-task" });
      await deleteTasks(id); // API call
      queryClient.invalidateQueries(["tasks"]);
      toast.success("Task deleted successfully", {
        id: "delete-task",
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const handleBulkDelete = async () => {
    if (!selectedDeals.length) {
      toast.error("Please select at least one task");
      return;
    }

    const ok = window.confirm(`Delete ${selectedDeals.length} selected tasks?`);
    if (!ok) return;

    try {
      toast.loading("Deleting tasks...", { id: "bulk-delete" });

      await bulkDeleteTasks(selectedDeals);
      // ✅ Remove from UI
      queryClient.invalidateQueries(["tasks"]);

      // ✅ Clear selection
      setSelectedDeals([]);

      toast.success("Tasks deleted successfully", {
        id: "bulk-delete",
      });
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Failed to delete tasks", {
        id: "bulk-delete",
      });
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id); // API call
      toast.success("Activity deleted successfully");
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter((id) => id !== dealId));
    }
  };

  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const currentPageDeals = leads
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = leads
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
      setSelectedDeals(
        selectedDeals?.filter((id) => !currentPageDeals?.includes(id)),
      );
    }
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig?.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      priority: "",
      assignUser: "",
      startDate: "",
      endDate: "",
      dateType: "",
    });
    setCurrentPage(1);
  };

  const handleBulkAction = (action) => {
    if (!selectedDeals.length) {
      toast.error("Please select at least one task");
      return;
    }
    if (action === "export") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      const selectedRows = leads.filter((deal) =>
        selectedDeals.includes(deal.id),
      );

      exportLeadsToCSV(selectedRows, "selected_leads");
      return;
    }

    if (action === "delete") {
      handleBulkDelete();
    }

    if (action === "massupdate") {
      setMode("mass-update");
      setIsDrawerOpen(true);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setPage(1);
  }, [filters]);
  useEffect(() => {
    if (!taskIdFromState || !leads?.length) return;

    const foundTask = leads.find(
      (item) => item.id === taskIdFromState
    );

    if (foundTask) {
      setSelectedDeal(foundTask);
      setMode("view");
      setIsDrawerOpen(true);
    }
  }, [taskIdFromState, leads]);
  return (
    <>
      <Helmet>
        <title>Leads - Aajneeti Connect ltd</title>
        <meta
          name="description"
          content="Manage and track your sales deals with comprehensive filtering and pipeline management tools."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Tasks
                </h1>
                <p className="text-muted-foreground mt-1">
                  Easily create, assign, and track tasks to ensure every
                  activity is completed on time and nothing is missed in your
                  workflow
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                className="hidden"
                  variant="outline"
                  onClick={() =>
                    exportLeadsToCSV(leads, "all_leads")
                  }
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export All
                </Button>
                {canCreateTask && (
                  <Button
                    onClick={handleAddLeads}
                    className="linearbg-1 text-white hover:text-white"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Tasks
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <DealsFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={total}
              onBulkAction={handleBulkAction}
              selectedCount={selectedDeals?.length}
            />

            {/* Deals Table */}
            <DealsTable
              deals={leads}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onDelete={handleDeleteLead}
              isLoading={loading}
              canEdit={canEditTask}
              canDelete={canDeleteTask}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={itemsPerPage}
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        </main>

        {/* Deal Drawer */}
        <DealDrawer
          deal={selectedDealData}
          mode={mode}
          isOpen={isDrawerOpen}
          onCreate={handleCreateLead}
          onUpdate={handleUpdateTasks}
          onClose={handleDrawerClose}
          onDelete={handleDeleteActivity}
          selectedIds={selectedDeals}
          onBulkUpdate={handleBulkUpdateTasks} // 👈 NEW
        />
      </div>
    </>
  );
};

export default TaskPage;

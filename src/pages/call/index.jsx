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
import TablePagination from "./components/TablePagination";


import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import {
  bulkDeleteCall,
  createCall,
  deleteCall,
  fetchCallById,
  updateCall,
} from "../../services/call.services";
import { useAllCalls } from "../../hooks/useCalls";
import { useQueryClient } from "@tanstack/react-query";
import { canCreate, canEntityRecord } from "../../utils/permission";

const CallPage = () => {
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState("view");
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    assignUser: "",
    closeDateFrom: "",
    closeDateTo: "",
    dateType: "",
  });

  const { data, isLoading: loading } = useAllCalls({ limit, page, filters });
  const calls = data?.list || [];
  const total = data?.total || 0;

  const visibleCalls = calls.filter(call => canEntityRecord("Call", "read", call));

  const canCreateCall = canCreate("Call");


  // Mock deals data
  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setMode("view");
    setIsDrawerOpen(true);
  };
  const totalPages = Math.ceil(total / limit);

  // const handleSelectAll = (isSelected) => {
  //   if (isSelected) {
  //     const currentPageCalls = visibleCalls
  //       ?.slice((page - 1) * limit, page * limit)
  //       ?.map((call) => call?.id);
  //     setSelectedDeals([...new Set([...selectedDeals, ...currentPageCalls])]);
  //   } else {
  //     const currentPageCalls = visibleCalls
  //       ?.slice((page - 1) * limit, page * limit)
  //       ?.map((call) => call?.id);
  //     setSelectedDeals(
  //       selectedDeals?.filter((id) => !currentPageCalls?.includes(id)),
  //     );
  //   }
  // };

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddMeeting = () => {
    setSelectedDeal(null);
    setMode("add");
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
    // setIsEditing(false);
  };

  const handleCreateCall = async (payload) => {
    try {
      await createCall(payload);
      queryClient.invalidateQueries({ queryKey: ["calls"], exact: false });
      toast.success("Call created successfully");
    } catch (err) {
      console.error("Call creation failed", err);
    }
  };

  const handleUpdateCall = async (id, payload) => {
    await updateCall(id, payload);
    queryClient.invalidateQueries(["calls"]);
  };

  const handleDeleteMeeting = async (id) => {
    try {
      toast.loading("Deleting Call...", { id: "delete-lead" });
      await deleteCall(id);

      setLeads((prev) => prev.filter((m) => m.id !== id));

      toast.success("Call deleted successfully", {
        id: "delete-lead",
      });
    } catch (err) {
      toast.error("Delete failed", { id: "delete-lead" });
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await deleteCall(id); // API call
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
      const currentPageDeals = filteredAndSortedDeals
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = filteredAndSortedDeals
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
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      assignUser: "",
      closeDateFrom: "",
      closeDateTo: "",
      dateType: "",
    });
    setPage(1);
  };

  const handleBulkAction = (action) => {
    if (action === "mass-update") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }
      setSelectedDeal(null);

      setMode("mass-update");
      setIsDrawerOpen(true);

      return;
    }

    if (action === "delete") {
      if (!selectedDeals.length) {
        toast.error("Select at least one Call");
        return;
      }

      setShowDeleteConfirm(true);
      return;
    }
  };
  const handleConfirmBulkDelete = async () => {
    try {
      toast.loading("Deleting meetings...", { id: "bulk-delete" });

      // ✅ ONE CALL, FULL ARRAY
      await bulkDeleteCall(selectedDeals);

      // ✅ UI se remove
      setLeads((prev) =>
        prev.filter((meeting) => !selectedDeals.includes(meeting.id)),
      );

      setSelectedDeals([]);
      setShowDeleteConfirm(false);

      toast.success("Selected meetings deleted", {
        id: "bulk-delete",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete meetings", {
        id: "bulk-delete",
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  const handleBulkUpdateMeet = async (payload) => {
    try {
      toast.loading("Updating meeting...", { id: "bulk-update" });

      await Promise.all(selectedDeals.map((id) => updateCall(id, payload)));

      toast.success(`${selectedDeals.length} leads updated`, {
        id: "bulk-update",
      });

      const data = await fetchCall();
      setLeads(data.list);

      setSelectedDeals([]);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  return (
    <>
      <Helmet>
        <title>Training - Aajneeti Connect ltd</title>
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
                  Training
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your Training
                </p>
              </div>
              <div className="flex items-center space-x-3">
               
                  <Button onClick={handleAddMeeting} className="linearbg-1 text-white hover:text-white">
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Training
                  </Button>
                
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
              deals={visibleCalls}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              currentPage={page}
              itemsPerPage={limit}
              onDelete={handleDeleteMeeting}
              isLoading={loading}
              canEditRecord={(call) => canEntityRecord("Call", "edit", call)}
              canDeleteRecord={(call) => canEntityRecord("Call", "delete", call)}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={setLimit}
            />
          </div>
        </main>

        {/* Deal Drawer */}
        <DealDrawer
          deal={selectedDeal}
          selectedIds={selectedDeals}
          mode={mode}
          isOpen={isDrawerOpen}
          onCreate={handleCreateCall}
          onUpdate={handleUpdateCall}
          onClose={handleDrawerClose}
          onDelete={handleDeleteActivity}
          onBulkUpdate={handleBulkUpdateMeet}
          canCreate={canCreateCall}
        />
        <ConfirmDeleteModal
          open={showDeleteConfirm}
          title="Delete Selected Call"
          description={`Are you sure you want to delete ${selectedDeals.length} lead(s)? This action cannot be undone.`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      </div>
    </>
  );
};

export default CallPage;

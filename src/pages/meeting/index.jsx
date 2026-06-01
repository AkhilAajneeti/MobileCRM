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
import { deleteActivity } from "services/leads.service";
import { useAllMeetings, useMeetings } from "hooks/useMeetings";
import { useMeeting } from "hooks/useMeeting";
import { useQueryClient } from "@tanstack/react-query";

import {
  bulkDeleteMeeting,
  createMeeting,
  deleteMeeting,
  updateMeeting,
} from "services/meeting.service";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { canCreate, canDelete, canEdit } from "utils/permission";
import { useLocation } from "react-router-dom";

const MeetingPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mode, setMode] = useState("view");
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const location = useLocation();
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  const canCreateMeeting = canCreate("Meeting");
  const canEditMeeting = canEdit("Meeting");
  const canDeleteMeeting = canDelete("Meeting");

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignUser: "",
    startDate: "",
    endDate: "",
    dateType: "",
  });
  const { data, isLoading } = useAllMeetings({ limit, page, filters });
  const leads = data?.list || [];
  const total = data?.total || [];
  const loading = isLoading;
  const { data: selectedDealData } = useMeeting(
    selectedDeal?.id,
    isDrawerOpen && !!selectedDeal?.id,
  );
  // Mock deals data
  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setMode("view");
    setIsDrawerOpen(true);
  };
  // Pagination page count — derived from the backend's total record count
  // divided by the page size. Previously this stored the raw total, which
  // made a 32-record dataset render 32 pages.
  const totalPages = Math.ceil((data?.total || 0) / Math.max(limit, 1));

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleAddMeeting = () => {
    if (!canCreateMeeting) return;
    setSelectedDeal(null);
    setMode("add");
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
    // setIsEditing(false);
  };

  const handleCreateMeeting = async (payload) => {
    if (!canCreateMeeting) return;
    try {
      await createMeeting(payload); // API
      queryClient.invalidateQueries({ queryKey: ["meetings"], exact: false });
      toast.success("Meeting created successfully");
    } catch (err) {
      console.error("Meeting creationd failed", err);
    }
  };

  const handleUpdateMeeting = async (id, payload) => {
    await updateMeeting(id, payload);
    queryClient.invalidateQueries(["meetings"]);
  };

  const handleDeleteMeeting = async (id) => {
    try {
      toast.loading("Deleting meeting...", { id: "delete-lead" });
      await deleteMeeting(id);
      queryClient.invalidateQueries(["meetings"]);
      toast.success("Meeting deleted successfully", {
        id: "delete-lead",
      });
    } catch (err) {
      toast.error("Delete failed", { id: "delete-lead" });
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id); // API call
      queryClient.invalidateQueries(["meetings"]);
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
        toast.error("Select at least one lead");
        return;
      }

      setShowDeleteConfirm(true);
      return;
    }
  };
  const handleConfirmBulkDelete = async () => {
    try {
      toast.loading("Deleting meetings...", { id: "bulk-delete" });

      await bulkDeleteMeeting(selectedDeals);
      queryClient.invalidateQueries(["meetings"]);
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

      await Promise.all(selectedDeals.map((id) => updateMeeting(id, payload)));

      toast.success(`${selectedDeals.length} leads updated`, {
        id: "bulk-update",
      });

      queryClient.invalidateQueries(["meetings"]);

      setSelectedDeals([]);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);
  const meetingIdFromState = location.state?.meetingId;
  useEffect(() => {
    if (!meetingIdFromState || !leads?.length) return;
    const foundMeeting = leads.find(
      (item) => item.id === meetingIdFromState,
    );
    if (foundMeeting) {
      setSelectedDeal(foundMeeting);
      setMode("view");
      setIsDrawerOpen(true);
    }
  }, [meetingIdFromState, leads]);
  return (
    <>
      <Helmet>
        <title>Meetings - CRM</title>
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
                  Meetings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your meetings
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleAddMeeting}
                  className="linearbg-1 text-white hover:text-white"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Meeting
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
              deals={leads}
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
              canDelete={canDeleteMeeting}
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={setPage}
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
          selectedIds={selectedDeals}
          mode={mode}
          isOpen={isDrawerOpen}
          onCreate={handleCreateMeeting}
          onUpdate={handleUpdateMeeting}
          onClose={handleDrawerClose}
          onDelete={handleDeleteActivity}
          onBulkUpdate={handleBulkUpdateMeet}
          canEdit={canEditMeeting}
        />
        <ConfirmDeleteModal
          open={showDeleteConfirm}
          title="Delete Selected Leads"
          description={`Are you sure you want to delete ${selectedDeals.length} lead(s)? This action cannot be undone.`}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmBulkDelete}
        />
      </div>
    </>
  );
};

export default MeetingPage;

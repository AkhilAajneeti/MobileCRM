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
import TablePagination from "./components/TablePagination";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLead,
  deleteActivity,
  deleteLead,
  updateLead,
} from "services/leads.service";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import StatusChart from "./components/charts/StatusChart";
import IndustryChart from "./components/charts/IndustryChart";
import AssignedUserChart from "./components/charts/AssignedUserChart";
import ProjectChart from "./components/charts/ProjectChart";
import MultiLineChart from "pages/dashboard/components/MultiLineChart";
import { useLeads, useNewLeads } from "hooks/useLeads";
import { useMetaData } from "hooks/useMetaData";
import { useLeadDetails } from "hooks/useLeadDetails";
import { useUsers } from "hooks/useUsers";
import { fetchTeamUser } from "services/team.service";
import { useTeamUsers } from "hooks/useTeams";
// import { canCreate, canDelete, canEdit } from "utils/permission";
import {
  canCreate,
  canEditRecord,
  canDeleteRecord,
  getStoredUser,
} from "utils/permission";
import { useLocation } from "react-router-dom";

const DealsPage = () => {
  const queryClient = useQueryClient();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);

  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage, setItemsPerPage] = useState(25);
  const [limit, setLimit] = useState(20);
  // Use a lazy initializer for `page` so the persisted value (set below in
  // the filters section) is honoured on remount.
  const [page, setPage] = useState(() => {
    try {
      const raw = sessionStorage.getItem("deals.tableState");
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed?.page || 1;
    } catch {
      return 1;
    }
  });
  const [mode, setMode] = useState("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  // const canCreateLead = canCreate("Lead");
  // const canEditLead = canEdit("Lead");
  // const canDeleteLead = canDelete("Lead");
  const location = useLocation();
  const canCreateLead = canCreate("Lead");

  const { data: metaData } = useMetaData();
  const { data: leadsDetails } = useLeadDetails(selectedDeal?.id, mode);
  const { data: usersData } = useUsers();
  const currentUser = getStoredUser();
  const currentTeamIds = useMemo(
    () => [...new Set([
      ...(currentUser?.teamsIds || []),
      ...(currentUser?.teamIds || []),
      currentUser?.teamId,
      currentUser?.defaultTeamId,
    ].filter(Boolean))],
    [currentUser?.defaultTeamId, currentUser?.teamId, currentUser?.teamIds, currentUser?.teamsIds],
  );
  const { data: teamUsersData } = useQuery({
    queryKey: ["team-users", currentTeamIds],
    queryFn: async () => {
      const responses = await Promise.all(currentTeamIds.map((id) => fetchTeamUser(id)));
      return {
        list: responses.flatMap((response) => response?.list || []),
      };
    },
    enabled: currentTeamIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Persist filters / page / sort across navigation. The user expects them to
  // survive jumping into a lead's drawer (which can navigate to /tasks etc.)
  // and coming back. Cleared only via the Clear-Filters button or tab close.
  const DEALS_STATE_KEY = "deals.tableState";
  const DEFAULT_FILTERS = {
    search: "",
    status: "",
    sector: "",
    cProject: "",
    source: "",
    assignUser: "",
    team: "",
    dateType: "",
    closeDateFrom: "",
    closeDateTo: "",
    xDays: "",
  };
  const DEFAULT_SORT = { key: "createdAt", direction: "desc" };
  const loadPersistedState = () => {
    try {
      const raw = sessionStorage.getItem(DEALS_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const persisted = loadPersistedState();

  const [sortConfig, setSortConfig] = useState(persisted?.sortConfig || DEFAULT_SORT);
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, ...(persisted?.filters || {}) });

  useEffect(() => {
    try {
      sessionStorage.setItem(
        DEALS_STATE_KEY,
        JSON.stringify({ filters, sortConfig, page }),
      );
    } catch {
      /* sessionStorage full / disabled — persistence degrades silently */
    }
  }, [filters, sortConfig, page]);

  // Team filter → fetch users in the selected team and expose their ids as an
  // internal `_teamUserIds` field on the filters object. Service translates it
  // into `assignedUserId IN [...]`. The team-users query is cached by React
  // Query (10-min staleTime), so flipping teams is instant after first use.
  const { data: filterTeamUsersData } = useTeamUsers(filters.team);
  const filterTeamUserIds = useMemo(
    () =>
      filters.team
        ? (filterTeamUsersData?.list || []).map((u) => u.id)
        : null,
    [filters.team, filterTeamUsersData],
  );
  const filtersForBackend = useMemo(
    () =>
      filters.team && filterTeamUserIds !== null
        ? { ...filters, _teamUserIds: filterTeamUserIds }
        : filters,
    [filters, filterTeamUserIds],
  );

  const { data: leadsData, isLoading } = useNewLeads({
    limit,
    page,
    filters: filtersForBackend,
  });
  const createLeadMutation = useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries(["leads"]);
    },
  });
  const deleteLeadMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => {
      toast.success("Deleted");
      queryClient.invalidateQueries(["leads"]);
    },
  });
  // fetch leads
  const allLeads = leadsData?.list || [];
  const leads = allLeads;
  const usersById = useMemo(() => {
    const combinedUsers = [
      ...(usersData?.list || []),
      ...(teamUsersData?.list || []),
    ];

    return combinedUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [teamUsersData, usersData]);
  const teamUserIds = useMemo(
    () => new Set((teamUsersData?.list || []).map((user) => user.id)),
    [teamUsersData],
  );

  const getPermissionRecord = (lead) => {
    const assignedUser = usersById[lead?.assignedUserId];
    const isAssignedToCurrentTeam = teamUserIds.has(lead?.assignedUserId);

    if (!assignedUser) return lead;

    return {
      ...lead,
      teamsIds:
        lead?.teamsIds?.length
          ? lead.teamsIds
          : assignedUser.teamsIds?.length
            ? assignedUser.teamsIds
            : assignedUser.teamIds?.length
              ? assignedUser.teamIds
              : assignedUser.defaultTeamId
                ? [assignedUser.defaultTeamId]
                : isAssignedToCurrentTeam
                  ? currentTeamIds
                  : lead?.teamsIds,
      teamId: lead?.teamId || assignedUser.defaultTeamId || assignedUser.teamId || (isAssignedToCurrentTeam ? currentTeamIds[0] : null),
    };
  };

  const selectedLeadRecords = useMemo(
    () => leads.filter((lead) => selectedDeals.includes(lead.id)),
    [leads, selectedDeals],
  );
  const source = metaData?.sources || [];
  const status = metaData?.status || [];
  const industry = metaData?.industries || [];
  const total = leadsData?.total || 0;
  const exportLeadsToCSV = (rows, fileName = "leads_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((lead) => ({
      Name: lead?.name || "",
      Email: lead?.emailAddress || "",
      Phone: `"${lead?.phoneNumber || ""}"`,
      Status: lead?.status || "",
      Source: lead?.source || "",
      "Project Name": lead?.cProject || lead?.cProjectName,
      "Assigned User": lead?.assignedUserName || "",
      "Next Contact": lead?.cNextContact || "",
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


  const totalPages = Math.ceil(total / limit);

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

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
    setMode("view");
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedDeal(null);
  };
  const handleCreateLead = async (payload) => {
    try {
      createLeadMutation.mutate(payload);
    } catch (err) {
      console.error("Lead creationd failed", err);
    }
  };

  const handleUpdateLead = async (id, payload) => {
    const record = selectedDeal?.id === id
      ? selectedDeal
      : leads.find((lead) => lead.id === id);

    if (record && !canEditRecord("Lead", getPermissionRecord(record))) {
      toast.error("You do not have permission to edit this lead");
      return;
    }

    await updateLead(id, payload);
    queryClient.invalidateQueries(["leads"]);
  };

  const handleDeleteLead = async (id) => {
    const record = leads.find((lead) => lead.id === id);

    if (record && !canDeleteRecord("Lead", getPermissionRecord(record))) {
      toast.error("You do not have permission to delete this lead");
      return;
    }

    try {
      toast.loading("Deleting lead...", { id: "delete-lead" });
      deleteLeadMutation.mutate(id);
    } catch (err) {
      console.error("Delete failed", err);
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
    const currentPageDeals = leads.map((deal) => deal.id);

    if (isSelected) {
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      setSelectedDeals(
        selectedDeals.filter((id) => !currentPageDeals.includes(id))
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
      sector: "",
      cProject: "",
      source: "",
      assignUser: "",
      team: "",
      dateType: "",
      closeDateFrom: "",
      closeDateTo: "",
      xDays: ""
    });
    setPage(1);
  };
  const handleBulkAction = (action) => {
    if (action === "mass-update") {
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      const editableIds = selectedLeadRecords
        .filter((deal) => canEditRecord("Lead", getPermissionRecord(deal)))
        .map((deal) => deal.id);

      if (!editableIds.length || editableIds.length !== selectedDeals.length) {
        toast.error("Select only leads you have permission to edit");
        return;
      }

      setSelectedDeal(null);
      setMode("mass-update");
      setIsDrawerOpen(true);

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
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      const deletableIds = selectedLeadRecords
        .filter((deal) => canDeleteRecord("Lead", getPermissionRecord(deal)))
        .map((deal) => deal.id);

      if (!deletableIds.length || deletableIds.length !== selectedDeals.length) {
        toast.error("Select only leads you have permission to delete");
        return;
      }

      setShowDeleteConfirm(true);
      return;
    }

    if (action === "stage" || action === "owner") {
      // later mass update drawer
    }
  };
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      return Promise.all(ids.map((id) => deleteLead(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["leads"]);
      toast.success("Selected leads deleted");
    },
  });
  const handleConfirmBulkDelete = () => {
    if (!selectedDeals.length) {
      toast.error("No leads selected");
      return;
    }

    const deletableIds = selectedLeadRecords
      .filter((deal) => canDeleteRecord("Lead", getPermissionRecord(deal)))
      .map((deal) => deal.id);

    if (!deletableIds.length || deletableIds.length !== selectedDeals.length) {
      toast.error("Select only leads you have permission to delete");
      return;
    }

    toast.loading("Deleting leads...", { id: "bulk-delete" });

    bulkDeleteMutation.mutate(deletableIds, {
      onSuccess: () => {
        toast.success("Selected leads deleted", { id: "bulk-delete" });
        setSelectedDeals([]);
        setShowDeleteConfirm(false);
      },
      onError: () => {
        toast.error("Failed to delete leads", { id: "bulk-delete" });
      },
    });
  };



  const handleItemsPerPageChange = (newItemsPerPage) => {
    setLimit(newItemsPerPage);
    setPage(1);
  };
  const handleBulkUpdateLeads = async (payload) => {
    try {
      const editableIds = selectedLeadRecords
        .filter((deal) => canEditRecord("Lead", getPermissionRecord(deal)))
        .map((deal) => deal.id);

      if (!editableIds.length || editableIds.length !== selectedDeals.length) {
        toast.error("Select only leads you have permission to edit");
        return;
      }

      toast.loading("Updating leads...", { id: "bulk-update" });

      await Promise.all(editableIds.map((id) => updateLead(id, payload)));

      toast.success(`${editableIds.length} leads updated`, {
        id: "bulk-update",
      });

      // setLeads(data.list);
      queryClient.invalidateQueries(["leads"]);

      setSelectedDeals([]);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

//redirect to perticular lead (from pipeline DealCard / meeting / etc.)
  const leadIdFromState = location.state?.leadId;

  // Fetch the linked lead BY ID — bypasses pagination & filters so the drawer
  // opens even when the target lead isn't on the first page of `useNewLeads`.
  // Shares its queryKey ["leadDetails", id] with the drawer's own detail
  // fetch, so React Query dedupes — no extra network round-trip.
  const { data: redirectLeadData } = useLeadDetails(leadIdFromState, "view");

  useEffect(() => {
    if (!leadIdFromState || !redirectLeadData) return;

    // Safe comparison — protects against number/string id drift between sources.
    if (String(redirectLeadData.id) === String(leadIdFromState)) {
      setSelectedDeal(redirectLeadData);
      setMode("view");
      setIsDrawerOpen(true);
    }
    // location.key changes on every navigation, so clicking the same lead
    // twice from the pipeline re-opens the drawer instead of being a no-op.
  }, [leadIdFromState, redirectLeadData, location.key]);

  return (
    <>
      <Helmet>
        <title>Leads -CRM</title>
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
                  Leads
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track and manage your sales opportunities
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  className="linearbg-1 text-white hover:text-white hidden"
                  variant="outline"
                  onClick={() =>
                    exportLeadsToCSV(leads, "all_leads")
                  }
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export All
                </Button>

                <Button
                  onClick={handleAddLeads}
                  className="linearbg-1 text-white hover:text-white"
                >
                  <Icon name="Plus" size={16} className="mr-2" />
                  New Lead
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
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}
              total={total}
              limit={limit}
              page={page}
            />
            {/* chartsAnanlysis */}
            {showAnalytics && (
              <div className="bg-card border border-border rounded-lg p-5 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Lead Analytics</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAnalytics((prev) => !prev)}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                  {/* <StatusChart filters={filters} enabled={showAnalytics} /> */}

                  <ProjectChart
                    filters={filtersForBackend}
                    enabled={showAnalytics}
                  />

                  <AssignedUserChart
                    filters={filtersForBackend}
                    enabled={showAnalytics}
                  />
                </div>
              </div>
            )}

            {/* Deals Table */}
            <DealsTable
              deals={leads}
              selectedDeals={selectedDeals}
              onSelectDeal={handleSelectDeal}
              onSelectAll={handleSelectAll}
              onDealClick={handleDealClick}
              sortConfig={sortConfig}
              onSort={handleSort}
              onDelete={handleDeleteLead}
              isLoading={isLoading}
              page={page}
              setPage={setPage}
              canEdit={(deal) =>
                canEditRecord("Lead", getPermissionRecord(deal))
              }
              canDelete={(deal) =>
                canDeleteRecord("Lead", getPermissionRecord(deal))
              }
            />

            {/* Pagination */}
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              itemsPerPage={limit}
              onPageChange={(p) => setPage(p)}
              onItemsPerPageChange={(val) => {
                setLimit(val);
                setPage(1);
              }}
            />

            {/* Deal Drawer */}
            <DealDrawer
              status={status}
              industry={industry}
              source={source}
              leadsDetails={leadsDetails}
              deal={selectedDeal}
              mode={mode}
              isOpen={isDrawerOpen}
              onCreate={handleCreateLead}
              onUpdate={handleUpdateLead}
              onClose={handleDrawerClose}
              onDelete={handleDeleteActivity}
              onBulkUpdate={handleBulkUpdateLeads}
              selectedIds={selectedDeals}
            />

            <ConfirmDeleteModal
              open={showDeleteConfirm}
              title="Delete Selected Leads"
              description={`Are you sure you want to delete ${selectedDeals.length} lead(s)? This action cannot be undone.`}
              onCancel={() => setShowDeleteConfirm(false)}
              onConfirm={handleConfirmBulkDelete}
            />
          </div>
        </main>
      </div>
    </>
  );
};

export default DealsPage;

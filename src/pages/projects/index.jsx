import React, { useState, useMemo, useEffect } from "react";
import { canCreate, canEntityRecord, canRead, getStoredAcl, getStoredUser, isOwnRecord } from "../../utils/permission.js";
import { Helmet } from "react-helmet";
import toast from "react-hot-toast";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DealsTable from "./components/DealsTable";
import ProjectCard from "./components/ProjectCard";
import ProjectKpiRow from "./components/ProjectKpiRow";
import { useProjectLeadCounts, useProjectKpis } from "./hooks/useProjectLeadCounts";
import DealsFilters from "./components/DealsFilters";
import DealDrawer from "./components/DealDrawer";
import Papa from "papaparse";
import TablePagination from "./components/TablePagination";
import { useProject, useProjects } from "hooks/useProjects";
import {
  bulkDeleteProject,
  createProject,
  deleteProject,
  updateProject,
} from "services/projects.service";
import { useQueryClient } from "@tanstack/react-query";
import { runGuardedExport } from "utils/guardedExport";

const ProjectsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [mode, setMode] = useState("view");
  // Default view is cards; the choice is not persisted (spec 5.4).
  const [view, setView] = useState("cards");

  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [filters, setFilters] = useState({
    search: "",
    assignUser: "",
    dateType: "",
    closeDateFrom: "",
    closeDateTo: "",
  });
  const queryClient = useQueryClient();
  const { data, isLoading } = useProjects({
    page: currentPage,
    limit: itemsPerPage,
    filters,
    orderBy: sortConfig?.key || "createdAt",
    order: sortConfig?.direction || "desc"
  });
  const loading = isLoading;
  const { data: selectedDealData } = useProject(
    selectedDeal?.id,
    isDrawerOpen && !!selectedDeal?.id,
  );

  const handleDealClick = async (deal) => {
    setSelectedDeal(deal); // only store basic info (id)
    setMode("view");
    setIsDrawerOpen(true);
  };

  const currentUser = getStoredUser();

  const projects = data?.list || [];
  const totalItems = data?.total || 0;

  // Is any campaign filter narrowing the list? Drives whether the KPI row
  // counts leads company-wide or only across the filtered campaigns.
  const isFiltered = useMemo(
    () =>
      Object.values(filters).some(
        (v) => v !== "" && v !== null && v !== undefined,
      ),
    [filters],
  );

  // The KPI row must reflect EVERY filtered campaign, not just the page on
  // screen -- `projects` above is one page, so scoping from it under-counts
  // as soon as the filter matches more than a page. Fetched once,
  // unpaginated, for scoping only, and skipped when no filter is active.
  const { data: scopeData } = useProjects({
    page: 1,
    limit: 200,
    filters,
    orderBy: "createdAt",
    order: "desc",
    enabled: isFiltered,
  });
  // Fall back to the current page while that query is in flight, so the
  // numbers read as filtered rather than flashing the global total.
  const scopeProjects = isFiltered ? scopeData?.list || projects : null;

  // Card numbers are only fetched for the view that shows them.
  const { leadCounts } = useProjectLeadCounts(projects, view === "cards");
  const kpiValues = useProjectKpis(totalItems, { scopeProjects, isFiltered });

  // KEEP ACL permission filtering (MANDATORY)
  // const visibleProjects = projects.filter(project =>
  //   canEntityRecord('CProjects', 'read', project) ||
  //   project.collaboratorsIds?.includes(currentUser.id)
  // );

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const exportLeadsToCSV = (rows, fileName = "projects_export") => {
    if (!rows || rows.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = rows.map((project) => ({
      Name: project?.name || "",
      Status: project?.status || "",
      Priority: project?.priority || "",
      "Assigned User": project?.assignedUserName || "",
      "Created At": project?.createdAt || "",
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
      await createProject(payload); // API
      queryClient.invalidateQueries(["projects"]);
      toast.success("Project created successfully");
    } catch (err) {
      console.error("Project creationd failed", err);
      toast.error("Project is not created!");
    }
  };

  const handleUpdateTasks = async (id, payload) => {
    try {
      await updateProject(id, payload);
      queryClient.invalidateQueries(["projects"]);
      toast.success("Project Update successfully");
    } catch (err) {
      console.error("Project updation failed", err);
      toast.error("Project is not Update!");
    }
  };
  const handleBulkUpdateTasks = async (ids, payload) => {
    try {
      toast.loading("Updating projects...", { id: "bulk-update" });

      await Promise.all(ids.map((id) => updateProject(id, payload)));
      // 🔥 MISSING LINE (IMPORTANT)
      queryClient.invalidateQueries(["projects"]);
      toast.success(`${ids.length} Projects updated`, { id: "bulk-update" });
      setSelectedDeals([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };

  //deletion delete
  const handleDeleteLead = async (id) => {
    try {
      toast.loading("Deleting Project...", { id: "delete-project" });
      await deleteProject(id); // API call
      queryClient.invalidateQueries(["projects"]);
      toast.success("Project deleted successfully", {
        id: "delete-project",
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };
  const handleBulkDelete = async () => {
    if (!selectedDeals.length) {
      toast.error("Please select at least one projects");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedDeals.length} selected projects?`,
    );
    if (!ok) return;

    try {
      toast.loading("Deleting projects...", { id: "bulk-delete" });
      await bulkDeleteProject(selectedDeals);

      queryClient.invalidateQueries(["projects"]);

      setSelectedDeals([]);
      toast.success("Project deleted successfully", {
        id: "bulk-delete",
      });
    } catch (err) {
      console.error("Bulk delete failed", err);
      toast.error("Failed to delete Project", {
        id: "bulk-delete",
      });
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
      const currentPageDeals = projects.map((deal) => deal.id);
      setSelectedDeals([...new Set([...selectedDeals, ...currentPageDeals])]);
    } else {
      const currentPageDeals = projects
        ?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        ?.map((deal) => deal?.id);
      setSelectedDeals(
        selectedDeals?.filter((id) => !currentPageDeals?.includes(id)),
      );
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      assignUser: "",
      dateType: "",
      closeDateFrom: "",
      closeDateTo: "",
    });
    setCurrentPage(1);
  };

  const handleBulkAction = async (action) => {
    if (!selectedDeals.length) {
      toast.error("Please select at least one task");
      return;
    }
    if (action === "export") {
      // Selection check first: a doomed export must not ask for a code.
      if (!selectedDeals.length) {
        toast.error("Select at least one lead");
        return;
      }

      // Verify BEFORE collecting the records, not after.
      await runGuardedExport(() => {
        const selectedRows = projects.filter((deal) =>
          selectedDeals.includes(deal.id),
        );

        exportLeadsToCSV(selectedRows, "selected_leads");
      });
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
  }, [filters]);

  return (
    <>
      <Helmet>
        <title>Projects - Aajneeti Connect ltd</title>
        <meta
          name="description"
          content="Manage and track your sales deals with comprehensive filtering and pipeline management tools."
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="top-bar-offset lg:ml-64">
          <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                {/* Three names, one screen: the route is /campaigns (what the
                    backend calls it), the sidebar says My Campaigns, and the
                    page heading says My Projects. */}
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  My Projects
                </h1>
                <p className="text-muted-foreground mt-1">
                  Easily create, assign, and track tasks to ensure every
                  projects is completed on time and nothing is missed in your
                  workflow.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {/* `Export All` is commented out on web — see spec 12. */}
                {canCreate("CProjects") && (
                  <Button
                    onClick={handleAddLeads}
                    fullWidth
                    className="linearbg-1 min-h-[44px] border border-[#6E1420]/30 text-white shadow-[0_1px_2px_rgba(16,24,40,.06),0_6px_16px_-6px_rgba(110,20,32,.45)] transition-shadow hover:text-white hover:shadow-[0_2px_4px_rgba(16,24,40,.08),0_10px_22px_-6px_rgba(110,20,32,.55)] lg:w-auto"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Campaign
                  </Button>
                )}
              </div>
            </div>

            <ProjectKpiRow values={kpiValues} />

            {/* Filter card and view toggle sit side by side from lg */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start">

              <div className="min-w-0 flex-1">
                <DealsFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onClearFilters={handleClearFilters}
                  dealCount={totalItems}
                  onBulkAction={handleBulkAction}
                  selectedCount={selectedDeals?.length}
                />
              </div>

              {/* 5.4 — two equal pills, full width and centred on a phone,
                  shrinking to their own width beside the filters from lg. */}
              <div className="mx-auto mb-6 flex w-full shrink-0 rounded-full border border-[#6E1420]/15 bg-card p-1 shadow-[0_1px_2px_rgba(16,24,40,.06),0_4px_12px_-4px_rgba(16,24,40,.12)] sm:w-auto sm:max-w-[260px] lg:mx-0">
                {["cards", "table"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setView(option)}
                    className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold capitalize transition-colors sm:flex-none ${
                      view === option
                        ? "bg-[#6E1420] text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {view === "cards" ? (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <Icon name="Loader" size={22} className="mr-2 animate-spin" />
                    Loading campaigns…
                  </div>
                ) : !projects.length ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Icon name="Layers" size={28} className="mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      No projects found
                    </p>
                  </div>
                ) : (
                  // The 26px gutter is deliberate: the cards carry a lift and
                  // a halo, and a tighter gap makes neighbouring halos overlap.
                  <div className="mt-4 grid grid-cols-1 gap-[26px] sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        totalLeads={leadCounts[project.id]?.total}
                        newToday={leadCounts[project.id]?.today}
                        isLoading={leadCounts[project.id] == null}
                        onOpen={handleDealClick}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
            /* Deals Table */
            <DealsTable
              deals={projects}
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
            />
            )}

            {/* Pagination — the table card's footer in table view, and
                free-standing below the grid in cards view (spec 8). */}
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
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
          selectedIds={selectedDeals}
          onBulkUpdate={handleBulkUpdateTasks} // 👈 NEW
        />
      </div>
    </>
  );
};

export default ProjectsPage;

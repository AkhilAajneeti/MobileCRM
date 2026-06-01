import React, { useState, useMemo, useEffect } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import ContactsTable from "./components/ContactsTable";
import ContactFilters from "./components/ContactFilters";
import ContactDrawer from "./components/ContactDrawer";
import BulkActions from "./components/BulkActions";
import ContactsPagination from "./components/ContactsPagination";
import toast from "react-hot-toast";
import {
  bulkDeleteContacts,
  deleteContact,
  fetchContactById,
  updateContact,
} from "services/contact.service";
import { fetchUser } from "services/user.service";
import { fetchLeads } from "services/leads.service";
import { useUsers } from "hooks/useUsers";
import { useLeads } from "hooks/useLeads";
import { useQueryClient } from "@tanstack/react-query";

const SalesTeam = () => {
  const [drawerMode, setDrawerMode] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const { data: leadsData, isLoading: leadsLoading } = useLeads();
  const loading = usersLoading || leadsLoading;
  const mockContacts = usersData?.list || [];
  const allLeads = leadsData?.list || [];
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "asc",
  });
  // function for fetchUser
  const queryClient = useQueryClient();
  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await fetchUser();
        console.log(data.list);
      } catch (error) {
        console.log("failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    loadContact();
  }, []);
  // useEffect(() => {
  //   if (!isDrawerOpen || !selectedContact?.id || drawerMode !== "view") return;

  //   const loadContactDetail = async () => {
  //     try {
  //       const res = await fetchContactById(selectedContact.id);
  //       setContactDetail(res);
  //     } catch (err) {
  //       console.error("Failed to fetch contact detail", err);
  //     }
  //   };

  //   loadContactDetail();
  // }, [isDrawerOpen, selectedContact?.id, drawerMode]);
  useEffect(() => {
    if (mockContacts.length > 0) {
      console.log("SAMPLE CONTACT 👉", mockContacts[0]);
    }
  }, [mockContacts]);

  const [filters, setFilters] = useState({
    performance: "",
    leadsVolume: "",
  });

  // operational

  // leads
  useEffect(() => {
    const loadContact = async () => {
      try {
        const data = await fetchLeads();
      } catch (error) {
        console.log("failed to fetch data", error);
      } finally {
      }
    };
    loadContact();
  }, []);
  // ✅ 1️⃣ Lead Stats (Optimized Grouping)
  const leadStats = useMemo(() => {
    const stats = {};

    allLeads.forEach((lead) => {
      const userId = lead.assignedUserId;
      if (!userId) return;

      if (!stats[userId]) {
        stats[userId] = {
          leadsAssigned: 0,
          dealsClosed: 0,
          siteVisits: 0,
        };
      }

      stats[userId].leadsAssigned++;

      if (lead.status === "Deal Closed") {
        stats[userId].dealsClosed++;
      }

      if (lead.status === "Site Visit Done") {
        stats[userId].siteVisits++;
      }
    });

    return stats;
  }, [allLeads]);

  // ✅ 2️⃣ Filter Sales Team Users (FROM mockContacts, NOT salesStats)

  const salesTeamUsers = useMemo(() => {
    return mockContacts.filter(
      (contact) => contact.defaultTeamId === "6944587d5d068f5a0",
    );
  }, [mockContacts]);

  // ✅ 3️⃣ Merge Lead Stats Into Users
  const salesStats = useMemo(() => {
    return salesTeamUsers.map((user) => {
      const stats = leadStats[user.id] || {
        leadsAssigned: 0,
        dealsClosed: 0,
        siteVisits: 0,
      };

      const conversionRate =
        stats.leadsAssigned > 0
          ? ((stats.dealsClosed / stats.leadsAssigned) * 100).toFixed(1)
          : 0;

      return {
        ...user,
        ...stats,
        conversionRate,
      };
    });
  }, [salesTeamUsers, leadStats]);

  // ✅ 4️⃣ Search + Safe Sorting
  const filteredUsers = useMemo(() => {
    let users = [...salesStats];

    // 🔎 Search
    if (searchTerm) {
      users = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // 🎯 Performance Filter
    if (filters.performance) {
      users = users.filter((user) => {
        const rate = Number(user.conversionRate);

        if (filters.performance === "high") return rate > 40;
        if (filters.performance === "medium") return rate >= 10 && rate <= 40;
        if (filters.performance === "low") return rate > 0 && rate < 10;
        if (filters.performance === "none") return rate === 0;

        return true;
      });
    }

    // 📊 Leads Volume Filter
    if (filters.leadsVolume) {
      users = users.filter((user) => {
        const leads = user.leadsAssigned;

        if (filters.leadsVolume === "heavy") return leads >= 30;
        if (filters.leadsVolume === "medium") return leads >= 10 && leads < 30;
        if (filters.leadsVolume === "low") return leads > 0 && leads < 10;
        if (filters.leadsVolume === "none") return leads === 0;

        return true;
      });
    }

    // 🔽 Sorting
    if (sortConfig.key) {
      users.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return users;
  }, [salesStats, searchTerm, filters, sortConfig]);
  // end
  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginatedContacts = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Active filters count
  const activeFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "",
  )?.length;

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ accounts: "", assignUser: "", status: "" });
    setCurrentPage(1);
  };

  const handleSelectContact = (contactId, checked) => {
    if (checked) {
      setSelectedContacts((prev) => [...prev, contactId]);
    } else {
      setSelectedContacts((prev) => prev?.filter((id) => id !== contactId));
    }
  };

  const handleSelectAllContacts = (checked) => {
    if (checked) {
      setSelectedContacts(paginatedContacts?.map((contact) => contact?.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleContactClick = (contact) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
    setDrawerMode("view");
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedContact(null);
    // setContactDetail(null);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedContacts([]);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setSelectedContacts([]);
  };

  const handleBulkExport = () => {
    console.log("Exporting contacts:", selectedContacts);
    // Implement export functionality
  };

  const handleBulkEmail = () => {
    console.log("Sending bulk email to contacts:", selectedContacts);
    // Implement bulk email functionality
  };

  const handleBulkTag = (tag) => {
    console.log("Adding tag to contacts:", selectedContacts, tag);
    // Implement bulk tagging functionality
  };
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };
  const handleBulkDelete = async () => {
    if (selectedContacts.length === 0) return;

    const confirmDelete = window.confirm(
      `Delete ${selectedContacts.length} contacts?`,
    );

    if (!confirmDelete) return;

    try {
      await bulkDeleteContacts(selectedContacts);

      // Remove deleted contacts from UI
      queryClient.invalidateQueries(["users"]);

      setSelectedContacts([]);
    } catch (error) {
      console.error("Bulk delete failed", error);
      alert("Failed to delete contacts");
    }
  };

  const handleAddContact = () => {
    console.log("Add new contact");
    // Implement add contact functionality
    setSelectedContact(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };
  const handleEditContact = (contact) => {
    setSelectedContact(contact); // 🔥 important
    setDrawerMode("edit"); // 🔥 edit mode
    setIsDrawerOpen(true);
  };
  const handleImportContacts = () => {
    console.log("Import contacts");
    // Implement import functionality
  };
  const handleDeleteContact = async (id) => {
    if (!id) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this contact?",
    );
    if (!confirmDelete) return;

    try {
      await deleteContact(id);
      toast.success("Contact deleted successfully");

      queryClient.invalidateQueries(["users"]);

      // agar paginatedContacts derive ho raha hai → auto update ho jayega
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete contact");
    }
  };
  const handleBulkUpdateContact = async (payload) => {
    if (!selectedContacts.length) return;

    try {
      toast.loading("Updating contacts...", { id: "bulk-update" });

      // 🔁 update each contact
      await Promise.all(
        selectedContacts.map((id) => updateContact(id, payload)),
      );

      // 🔄 update local state
      queryClient.invalidateQueries(["users"]);

      toast.success(`${selectedContacts.length} contacts updated`, {
        id: "bulk-update",
      });

      setSelectedContacts([]);
    } catch (err) {
      console.error(err);
      toast.error("Mass update failed", { id: "bulk-update" });
    }
  };
  const handleMassUpdate = () => {
    if (selectedContacts.length === 0) return;

    setDrawerMode("mass-update");
    setIsDrawerOpen(true);
  };

  //
  const siteVisits = allLeads.filter(
    (l) => l.status === "Site Visit Done",
  ).length;
  const closedDeals = allLeads.filter((l) => l.status === "Deal Closed").length;

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Team</h1>
              <p className="text-muted-foreground mt-1">
                Manage your individual contacts and relationships
              </p>
            </div>
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <Button variant="outline" onClick={handleImportContacts}>
                <Icon name="Upload" size={16} className="mr-2" />
                Import
              </Button>
              <Button onClick={handleAddContact} className="hidden">
                <Icon name="Plus" size={16} className="mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Sales Members
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {salesStats?.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Users" size={24} className="text-primary" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Site Visits</p>
                  <p className="text-2xl font-bold text-foreground">
                    {siteVisits}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Icon name="MapPin" size={24} className="text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Deals Closed
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {closedDeals}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center">
                  <Icon name="Target" size={24} className="text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <ContactFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFilterChange={handleFilterChange}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={handleClearFilters}
          />

          {/* Bulk Actions */}
          <BulkActions
            selectedCount={selectedContacts?.length}
            onExport={handleBulkExport}
            onBulkEmail={handleBulkEmail}
            onBulkTag={handleBulkTag}
            onBulkDelete={handleBulkDelete}
            onMassUpdate={handleMassUpdate}
          />

          {/* Contacts Table */}
          <ContactsTable
            contacts={paginatedContacts}
            selectedContacts={selectedContacts}
            onSelectContact={handleSelectContact}
            onSelectAllContacts={handleSelectAllContacts}
            onContactClick={handleContactClick}
            sortConfig={sortConfig}
            onSort={handleSort}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            isLoading={loading}
          />

          {/* Pagination */}
          <div className="mt-6">
            <ContactsPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers?.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        </div>
      </main>
      {/* Contact Drawer */}
      <ContactDrawer
        // contactDetail={contactDetail}
        mode={drawerMode}
        contact={selectedContact}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onBulkUpdate={handleBulkUpdateContact}
        allLeads={allLeads}
      />
    </div>
  );
};

export default SalesTeam;

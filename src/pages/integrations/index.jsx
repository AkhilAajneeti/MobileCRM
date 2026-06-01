import React, { useEffect, useState, useMemo } from "react";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import toast from "react-hot-toast";
import CategoryFilter from "./components/CategoryFilter";
import SetupWizard from "./components/SetupWizard";
import ConnectedIntegrationsList from "./components/ConnectedIntegrationsList";
import {
  deleteIntegration,
  fetchIntegrationAcc,
  fetchIntegrationAccById,
} from "services/intergration.service";
import DealDrawer from "./components/DealDrawer";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import { canCreate, canEntityRecord } from "utils/permission";

const IntegrationsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [integrationsAcc, setIntegrationAcc] = useState([]);
  const visibleIntegrations = useMemo(() =>
    integrationsAcc.filter(integration => canEntityRecord('LeadCapture', 'read', integration))
    , [integrationsAcc]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerMode, setDrawerMode] = useState("view"); // add | edit
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchIntegrationAcc();
        setIntegrationAcc(data.list);
      } catch (error) {
        console.log("failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const categories = [
    { id: "all", name: "All Integrations", count: visibleIntegrations.length },
  ];

  const integrations = [
    {
      id: "google-workspace",
      name: "Google Workspace",
      category: "email",
      logo: "https://images.unsplash.com/photo-1730817403196-80d494660640",
      description:
        "Sync emails, calendar events, and contacts with your Google Workspace account for seamless productivity.",
      features: [
        "Email synchronization",
        "Calendar integration",
        "Contact management",
        "Drive file sharing",
      ],

      isConnected: true,
      status: "connected",
      statusText: "Connected",
      lastSync: "2 minutes ago",
      syncFrequency: "Every 15 minutes",
      isPopular: true,
      notifications: [
        { label: "New emails", enabled: true },
        { label: "Calendar reminders", enabled: true },
        { label: "Contact updates", enabled: false },
      ],
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      category: "email",
      logo: "https://images.unsplash.com/photo-1729860647900-951d7184b5c0",
      description:
        "Connect your Outlook account to sync emails, meetings, and contacts across your Microsoft ecosystem.",
      features: [
        "Email synchronization",
        "Meeting integration",
        "Contact sync",
        "Teams integration",
      ],

      isConnected: false,
      status: "disconnected",
      statusText: "Not connected",
      lastSync: null,
      syncFrequency: "Every 30 minutes",
      isPopular: true,
      notifications: [],
    },
    {
      id: "slack",
      name: "Slack",
      category: "communication",
      logo: "https://images.unsplash.com/photo-1497565998880-bd009060dcd7",
      description:
        "Get real-time CRM notifications and updates directly in your Slack channels for better team collaboration.",
      features: [
        "Deal notifications",
        "Activity updates",
        "Team mentions",
        "Custom alerts",
      ],

      isConnected: true,
      status: "connected",
      statusText: "Connected",
      lastSync: "5 minutes ago",
      syncFrequency: "Real-time",
      isPopular: false,
      notifications: [
        { label: "Deal updates", enabled: true },
        { label: "New leads", enabled: true },
        { label: "Task reminders", enabled: false },
      ],
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "payments",
      logo: "https://images.unsplash.com/photo-1507362569319-ce3cce2b6e32",
      description:
        "Automatically sync payment data and customer information from Stripe to track revenue and billing.",
      features: [
        "Payment tracking",
        "Customer sync",
        "Invoice management",
        "Revenue analytics",
      ],

      isConnected: false,
      status: "disconnected",
      statusText: "Not connected",
      lastSync: null,
      syncFrequency: "Every hour",
      isPopular: true,
      notifications: [],
    },
    {
      id: "zapier",
      name: "Zapier",
      category: "productivity",
      logo: "https://images.unsplash.com/photo-1648134859182-98df6e93ef58",
      description:
        "Connect CRMPro with 5000+ apps through Zapier to automate your workflows and boost productivity.",
      features: [
        "Workflow automation",
        "5000+ app connections",
        "Custom triggers",
        "Data synchronization",
      ],

      isConnected: false,
      status: "disconnected",
      statusText: "Not connected",
      lastSync: null,
      syncFrequency: "Event-based",
      isPopular: false,
      notifications: [],
    },
    {
      id: "hubspot",
      name: "HubSpot",
      category: "productivity",
      logo: "https://images.unsplash.com/photo-1632518193201-72278769704a",
      description:
        "Migrate and sync data between HubSpot and CRMPro for unified customer relationship management.",
      features: [
        "Data migration",
        "Contact sync",
        "Deal pipeline sync",
        "Marketing automation",
      ],

      isConnected: false,
      status: "disconnected",
      statusText: "Not connected",
      lastSync: null,
      syncFrequency: "Daily",
      isPopular: false,
      notifications: [],
    },
    {
      id: "mailchimp",
      name: "Mailchimp",
      category: "email",
      logo: "https://images.unsplash.com/photo-1680459575540-2bbdf72151c2",
      description:
        "Sync your email marketing campaigns and subscriber data with CRMPro for better lead nurturing.",
      features: [
        "Email campaign sync",
        "Subscriber management",
        "Campaign analytics",
        "Lead scoring",
      ],

      isConnected: true,
      status: "syncing",
      statusText: "Syncing...",
      lastSync: "1 hour ago",
      syncFrequency: "Every 2 hours",
      isPopular: false,
      notifications: [
        { label: "Campaign updates", enabled: true },
        { label: "New subscribers", enabled: false },
      ],
    },
    {
      id: "zoom",
      name: "Zoom",
      category: "communication",
      logo: "https://images.unsplash.com/photo-1585418052482-a987e68cef2c",
      description:
        "Schedule and track Zoom meetings directly from CRMPro with automatic meeting notes and recordings.",
      features: [
        "Meeting scheduling",
        "Automatic recordings",
        "Meeting notes sync",
        "Calendar integration",
      ],

      isConnected: false,
      status: "disconnected",
      statusText: "Not connected",
      lastSync: null,
      syncFrequency: "Real-time",
      isPopular: false,
      notifications: [],
    },
  ];
  const handleRowClick = async (integration, mode = "view") => {
    try {
      setDrawerMode(mode);
      setIsOpen(true);

      const data = await fetchIntegrationAccById(integration.id);

      // assuming API returns single object
      setSelectedAccount(data);
    } catch (error) {
      console.log("Failed to fetch integration by id", error);
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const handleDeleteClick = (integration) => {
    setDeleteId(integration.id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    const recordToDelete = integrationsAcc.find(acc => acc.id === deleteId);
    if (!canEntityRecord('LeadCapture', 'delete', recordToDelete)) {
      toast.error('No permission to delete this integration');
      return;
    }

    try {
      await deleteIntegration(deleteId);
      setIsDeleteOpen(false);
      setDeleteId(null);

      // refresh list
      const data = await fetchIntegrationAcc();
      setIntegrationAcc(data.list);
      toast.success("Integration Deleted Successfully");
    } catch (error) {
      console.log("Delete failed", error);
      toast.error("Integration Deletion Failed");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setDeleteId(null);
  };

  const handleWizardComplete = (integrationId) => {
    console.log("Integration setup completed:", integrationId);
    setIsWizardOpen(false);
    setSelectedIntegration(null);
    // In a real app, this would update the integration status
  };

  const handleWizardClose = () => {
    setIsWizardOpen(false);
    setSelectedIntegration(null);
  };


  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="lg:ml-64 pt-16">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Integrations
                </h1>
                <p className="text-muted-foreground mt-1">
                  Connect your favorite tools and services to enhance your CRM
                  workflow
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  iconName="RefreshCw"
                  iconPosition="left"
                >
                  Refresh All
                </Button>

                <Button
                  variant="default" className="linearbg-1 text-white hover:text-white"
                  iconName="Plus"
                  iconPosition="left"
                  onClick={() => {
                    setSelectedIntegration(null);
                    setDrawerMode("add");
                    setIsOpen(true);
                  }}
                >
                  Create Entry Point
                </Button>

              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Icon
                  name="Search"
                  size={20}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />

                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Connected Integrations Summary */}
          <div className="mb-8">
            <ConnectedIntegrationsList
              integrations={visibleIntegrations}
              onRowClick={handleRowClick}
              onDelete={handleDeleteClick}
              isLoading={loading}
            />
          </div>


        </div>
      </main>

      <DealDrawer
        integrations={visibleIntegrations}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={drawerMode}
        deal={selectedAccount}
      />
      {/* Setup Wizard Modal */}
      <SetupWizard
        integration={selectedIntegration}
        isOpen={isWizardOpen}
        onClose={handleWizardClose}
        onComplete={handleWizardComplete}
      />
      <ConfirmDeleteModal
        open={isDeleteOpen}
        title="Delete Integration"
        description="Are you sure you want to delete this integration? This action cannot be undone."
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default IntegrationsPage;

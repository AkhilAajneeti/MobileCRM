import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import MetricsCard from "./components/MetricsCard";
import FilterControls from "./components/FilterControls";
import ConversionFunnelChart from "./components/ConversionFunnelChart";
import WinRateChart from "./components/WinRateChart";
import TablePagination from "./components/TablePagination";
// import { fetchSources, fetchStatus } from "services/others.service";
import Button from "components/ui/Button";
import Icon from "../../components/AppIcon";
import DealsTable from "./components/DealsTable";
// import { fetchLeads } from "services/leads.service";
import { useNewLeads } from "hooks/useLeads";
import { useFilteredMetrics } from "./hooks/useFilteredMetrics";

const Reports = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [source, setSource] = useState([]);
  const [status, setStatus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    source: "",
    assignUser: "",
    dateType: "",        // 👈 NEW (today, before, between, etc.)
    closeDateFrom: "",
    closeDateTo: "",
  });

  // useEffect(() => {
  //   const loadSource = async () => {
  //     try {
  //       const data = await fetchSources();
  //       setSource(data.options || []);
  //       // console.log(data.list);
  //     } catch (error) {
  //       console.log("failed to fetch data", error);
  //     } finally {

  //     }
  //   };
  //   loadSource();
  // }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "",
      dateType: "",
      source: "",
      assignUser: "",
      closeDateFrom: "",
      closeDateTo: "",
    });
    setCurrentPage(1);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };
  const handleSelectDeal = (dealId, isSelected) => {
    if (isSelected) {
      setSelectedDeals([...selectedDeals, dealId]);
    } else {
      setSelectedDeals(selectedDeals?.filter((id) => id !== dealId));
    }
  };
  const handleFiltersChange = (newFilters) => {

    setFilters(newFilters);

  };

  // Close sidebar on route change or outside click
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  // fetch status
  // useEffect(() => {
  //   const loadStatus = async () => {
  //     try {
  //       const data = await fetchStatus();
  //       setStatus(data.options || []);
  //       console.log(data.list);
  //     } catch (error) {
  //       console.log("failed to fetch data", error);
  //     } finally {
  //     }
  //   };
  //   loadStatus();
  // }, []);

  const { data: leadsData, isLoading } = useNewLeads({ limit, page, filters });
  const leads = leadsData?.list || [];
  const total = leadsData?.total || 0;
  const isWithinSelectedDays = (createdAt, selectedDay) => {
    if (!selectedDay) return true;

    const createdDate = new Date(`${createdAt?.replace(" ", "T")}Z`);
    const today = new Date();

    // Reset time for accurate comparison
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(createdDate);
    compareDate.setHours(0, 0, 0, 0);

    const diffInDays = (today - compareDate) / (1000 * 60 * 60 * 24);

    switch (selectedDay) {
      case "Today":
        return diffInDays === 0;

      case "Yesterday":
        return diffInDays === 1;

      case "Last 3 Days":
        return diffInDays >= 0 && diffInDays <= 2;

      case "Last 7 Days":
        return diffInDays >= 0 && diffInDays <= 6;

      case "Current Month":
        return (
          createdDate.getMonth() === today.getMonth() &&
          createdDate.getFullYear() === today.getFullYear()
        );

      default:
        return true;
    }
  };


  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  const totalPages = Math.ceil(total / limit);
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig?.key === key && prevConfig?.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Filter-aware metrics — each card runs its own backend count against the
  // full filtered dataset, so the numbers stay correct beyond page 1.
  const { metricsData } = useFilteredMetrics({ filters });


  return (
    <>
      <Helmet>
        <title>CRM Reports</title>
        <meta
          name="description"
          content="Comprehensive sales analytics with interactive visualizations and export capabilities for data-driven decision making"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header
          onMenuToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="lg:ml-64 pt-16">
          <div className="p-4 lg:p-8">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Reports & Analytics
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    Comprehensive sales insights and performance metrics
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    <span>Live data</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Key Metrics Cards */}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8"
            >
              {metricsData?.map((metric, index) => (
                <MetricsCard
                  key={metric?.title}
                  title={metric?.title}
                  value={metric?.value}
                  change={metric?.change}
                  changeType={metric?.changeType}
                  icon={metric?.icon}
                  iconColor={metric?.iconColor}
                  description={metric?.description}
                />
              ))}
            </motion.div>

            {/* Filter Controls */}
            <FilterControls
              filters={filters}
              status={status}
              source={source}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              dealCount={total}
              selectedCount={selectedDeals?.length}
              toggleAnalytics={() => setShowAnalytics((prev) => !prev)}
            />

            {/* Charts Grid */}
            {showAnalytics && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Report Analytics</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAnalytics((prev) => !prev)}
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>

                {/*
                  Charts are intentionally NOT given `filters` — they fetch the
                  full year's dataset independently. The filter bar above drives
                  the table only. This keeps the two flows fully decoupled.
                */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                  <ConversionFunnelChart enabled={showAnalytics} />
                  <WinRateChart enabled={showAnalytics} />
                </div>
              </>
            )}
            {/* table */}
            <DealsTable
              deals={leads}
              sortConfig={sortConfig}
              onSelectDeal={handleSelectDeal}
              onSort={handleSort}
              currentPage={page}
              itemsPerPage={limit}
              isLoading={isLoading}
            />
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

            {/* Revenue Forecasting - Full Width */}
            {/* <div className="mb-8">
              
              <RevenueChart />
            </div> */}

            {/* Export Controls */}
            {/* <ExportControls /> */}

            {/* Additional Insights */}
            {/* <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 bg-card border border-border rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Key Insights
              </h3>

              {monthlyInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">
                      Top Performing Month
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {monthlyInsights.bestMonth.month} achieved the highest win
                      rate at {monthlyInsights.bestMonth.winRate}% with{" "}
                      {monthlyInsights.bestMonth.won} deals closed
                    </p>
                  </div>

          
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">
                      Overall Conversion Rate
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      The team closed {monthlyInsights.totalDeals} leads with an
                      overall win rate of {monthlyInsights.overallWinRate}%
                    </p>
                  </div>

             
                  <div className="space-y-2">
                    <h4 className="font-medium text-foreground">
                      Conversion Opportunity
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Increasing win rate by just 5% could significantly improve
                      monthly performance.
                    </p>
                  </div>
                </div>
              )}
            </motion.div> */}
          </div>
        </main>
      </div>
    </>
  );
};

export default Reports;

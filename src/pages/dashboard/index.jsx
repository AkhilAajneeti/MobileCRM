import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import KPICard from "./components/KPICard";
import PipelineChart from "./components/PipelineChart";
import RightRail from "./components/RightRail";
import DashboardSummaryAlert from "./components/DashboardSummaryAlert";
import ActivityFunnel from "./components/ActivityFunnel";
import InsightSheet from "./components/InsightSheet";
import MetricsCard from "./components/MetricsCard";
import QualifiedBreakdown, {
  QUALIFIED_STAGES,
} from "./components/QualifiedBreakdown";
import { fetchLeads } from "services/leads.service";
import MultiLineChart from "./components/MultiLineChart";
import { fetchMeeting } from "services/meeting.service";
import { useLeadsCount } from "hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeInsight, setActiveInsight] = useState(null);
  const [insightData, setInsightData] = useState([]);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  // update by filter

  const getTodayRange = () => {
    const now = new Date();

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  };
  const { start, end } = getTodayRange();
  // ✅ 1. HOOKS FIRST
  const thisMonthQuery = useLeadsCount([
    { type: "currentMonth", attribute: "createdAt" }
  ]);

  const todayQuery = useLeadsCount([
    {
      type: "today",
      attribute: "createdAt",
    },
  ]);

  const interestedQuery = useLeadsCount([
    {
      type: "in",
      attribute: "status",
      value: ["Interested"],
    },
    {
      type: "currentMonth",
      attribute: "createdAt",
    },
  ]);

  const lastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" }
  ]);
  // yesterday 
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const yesterdayStart = new Date(yesterdayDate);
  yesterdayStart.setHours(0, 0, 0, 0);

  const yesterdayEnd = new Date(yesterdayDate);
  yesterdayEnd.setHours(23, 59, 59, 999);

  const yesterdayQuery = useLeadsCount([
    {
      type: "between",
      attribute: "createdAt",
      value: [
        yesterdayStart.toISOString(),
        yesterdayEnd.toISOString(),
      ],
      dateTime: true,
    },
  ]);

  const interestedLastMonthQuery = useLeadsCount([
    { type: "lastMonth", attribute: "createdAt" },
    { type: "equals", attribute: "status", value: "Interested" }
  ]);

  /* ----------------------------------------------------------------
   * Qualification row (spec 4) — lifetime counts, no date filter, so
   * every percentage reads against the whole book of leads.
   * ---------------------------------------------------------------- */

  // The statuses that make up "Qualified Now". QDTD is deliberately absent:
  // it has its own card and is excluded from the breakdown.
  const QUALIFIED_STATUSES = QUALIFIED_STAGES.map((stage) => stage.status);

  // "Showed real interest once, now written off."
  // Junk is excluded on purpose — Fake Lead, Invalid Number, Irrelevant Lead,
  // Duplicate and Broker were never real prospects, so counting them here
  // would overstate how much genuine interest was lost.
  const LOST_STATUSES = [
    "Not Interested",
    "Low Budget",
    "Low Interest",
    "Other Location",
  ];

  const allLeadsQuery = useLeadsCount([]);
  const qualifiedNowQuery = useLeadsCount([
    { type: "in", attribute: "status", value: QUALIFIED_STATUSES },
  ]);
  const qualifiedOnDelayQuery = useLeadsCount([
    { type: "in", attribute: "status", value: ["QDTD"] },
  ]);
  const qualifiedLostQuery = useLeadsCount([
    { type: "in", attribute: "status", value: LOST_STATUSES },
  ]);

  // One count per qualified status, for the breakdown drawer. Fixed order and
  // fixed length, so the hook count never changes between renders — but they
  // only hit the network once the drawer is actually opened.
  const followUpCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Follow up"] }], isBreakdownOpen);
  const interestedCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Interested"] }], isBreakdownOpen);
  const visitScheduledCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Site Visit Scheduled"] }], isBreakdownOpen);
  const invitationSentCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Invitation Sent"] }], isBreakdownOpen);
  const visitDoneCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Site Visit Done"] }], isBreakdownOpen);
  const purchasedCount = useLeadsCount([{ type: "in", attribute: "status", value: ["Purchased"] }], isBreakdownOpen);

  const breakdownQueries = [
    followUpCount,
    interestedCount,
    visitScheduledCount,
    invitationSentCount,
    visitDoneCount,
    purchasedCount,
  ];

  // ✅ 2. EXTRACT DATA
  const thisMonth = thisMonthQuery.data || 0;
  const today = todayQuery.data || 0;
  const interested = interestedQuery.data || 0;

  const lastMonth = lastMonthQuery.data || 0;
  const yesterday = yesterdayQuery.data || 0;
  const interestedLastMonth = interestedLastMonthQuery.data || 0;

  // ✅ 3. CALCULATIONS
  const monthGrowth =
    lastMonth === 0
      ? 0
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  const todayDiff = today - yesterday;

  const interestedGrowth =
    interestedLastMonth === 0
      ? 0
      : Math.round(
        ((interested - interestedLastMonth) / interestedLastMonth) * 100
      );


  // leads
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-leads"],
    queryFn: () => fetchLeads({ limit: 200, page: 1 }),

    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const leads = data?.list || [];

  const { data: meetingData = [] } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeeting
  });

  const meetingsList = meetingData?.list || [];
  const isSameMonth = (date1, date2) => {
    const d1 = new Date(date1);
    return (
      d1.getMonth() === date2.getMonth() &&
      d1.getFullYear() === date2.getFullYear()
    );
  };
  // EspoCRM transports datetimes as "YYYY-MM-DD HH:mm:ss" in UTC.
  // Append Z so JS interprets as UTC, then format/compare in local tz.
  const toLocalDate = (value) => {
    if (!value) return null;
    const s = typeof value === "string" ? value.trim() : value;
    if (typeof s === "string" && s.length > 10) {
      return new Date(`${s.replace(" ", "T")}Z`);
    }
    return new Date(s);
  };
  const formatDate = (date) => {
    if (!date) return "—"; // null / undefined / empty

    const parsedDate = toLocalDate(date);

    if (!parsedDate || isNaN(parsedDate.getTime())) return "—"; // invalid date
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })?.format(parsedDate);
  };
  const formatTime = (value) => {
    if (!value) return "—";

    const date = toLocalDate(value);
    if (!date) return "—";

    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const isToday = (date) => {
    const d = toLocalDate(date);
    if (!d || isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isYesterday = (date) => {
    const d = toLocalDate(date);
    if (!d || isNaN(d.getTime())) return false;
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return d.toDateString() === y.toDateString();
  };
  // calculate
  const now = new Date();

  const handleMenuToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  const meetings = meetingsList.filter((m) => {
    const createdToday =
      m.createdAt &&
      isToday(m.createdAt);

    const scheduledToday =
      m.dateStart &&
      isToday(m.dateStart);

    return createdToday || scheduledToday;
  }).length;

  // Leads whose status was set to "Purchased" today — a closed-won counter.
  const purchased = leads.filter(
    (l) => l.status === "Purchased" && isToday(l.modifiedAt),
  ).length;

  const siteVisits = leads.filter(
    (l) => l.status === "Site Visit Done" && isToday(l.modifiedAt),
  ).length;

  // Leads moved into "Site Visit Scheduled" today — new bookings counter.
  const siteVisitsScheduled = leads.filter(
    (l) => l.status === "Site Visit Scheduled" && isToday(l.modifiedAt),
  ).length;
  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e?.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  /**
   * Funnel -> insight sheet. Each stage filters the records behind its own
   * count; the filtering rules are unchanged from the previous tiles.
   */
  const openInsight = (key) => {
    if (key === "meetings") {
      const filtered = meetingsList
        .filter((m) => {
          const createdToday = m.createdAt && isToday(m.createdAt);
          const scheduledToday = m.dateStart && isToday(m.dateStart);
          return createdToday || scheduledToday;
        })
        .map((m) => {
          const createdToday = m.createdAt && isToday(m.createdAt);
          const scheduledToday = m.dateStart && isToday(m.dateStart);
          return {
            ...m,
            insightType:
              createdToday && scheduledToday
                ? "Created & Scheduled Today"
                : createdToday
                  ? "Created Today"
                  : "Scheduled Today",
          };
        });
      setInsightData(filtered);
    } else {
      const statusByKey = {
        purchased: "Purchased",
        visits: "Site Visit Done",
        siteVisitsScheduled: "Site Visit Scheduled",
      };
      const status = statusByKey[key];
      setInsightData(
        leads.filter((l) => l.status === status && isToday(l.modifiedAt)),
      );
    }

    setActiveInsight(key);
  };

  // Clock-derived greeting (spec 1.3). The first name is title-cased from the
  // stored login, first word only — never show the raw username, so
  // `akhil_aajneeti_admin` reads as "Akhil".
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  })();

  const firstName = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem("login_object") || "null");
      const raw = String(stored?.username || "").split(/[._\s-]+/)[0];
      if (!raw) return "";
      return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    } catch {
      return "";
    }
  })();

  const allLeadsTotal = allLeadsQuery.data || 0;
  const shareOf = (value) =>
    allLeadsTotal ? Math.round((value / allLeadsTotal) * 100) : 0;

  const qualificationLoading =
    allLeadsQuery.isLoading ||
    qualifiedNowQuery.isLoading ||
    qualifiedOnDelayQuery.isLoading ||
    qualifiedLostQuery.isLoading;

  const qualificationCards = [
    {
      title: "All Leads",
      value: allLeadsTotal,
      icon: "Users",
      from: "#3B82F6",
      to: "#2563EB",
      description: "Everything in this view — the base for every % below",
    },
    {
      title: "Qualified Now",
      value: qualifiedNowQuery.data || 0,
      share: shareOf(qualifiedNowQuery.data || 0),
      icon: "BadgeCheck",
      from: "#14B8A6",
      to: "#0D9488",
      description: "Interested today — tap to see the split",
      expandable: true,
    },
    {
      title: "Qualified On Delay",
      value: qualifiedOnDelayQuery.data || 0,
      share: shareOf(qualifiedOnDelayQuery.data || 0),
      icon: "Hourglass",
      from: "#6366F1",
      to: "#4338CA",
      description: "Status is QDTD — qualified, but on delay",
    },
    {
      title: "Qualified, Then Lost",
      value: qualifiedLostQuery.data || 0,
      share: shareOf(qualifiedLostQuery.data || 0),
      icon: "TrendingDown",
      from: "#78716C",
      to: "#57534E",
      description: "Showed real interest once, now written off",
    },
  ];

  const breakdownRows = QUALIFIED_STAGES.map((stage, index) => ({
    ...stage,
    value: breakdownQueries[index].data || 0,
  }));

  const kpiData = [
    {
      title: "This Month Leads",
      value: thisMonth,
      change: `${monthGrowth}%`,
      changeType: monthGrowth >= 0 ? "positive" : "negative",
      icon: "Users",
      accent: "#3B82F6",
      featured: true,
      comparisonLabel: "last month",
    },
    {
      title: "Today Leads",
      value: today,
      change: todayDiff >= 0 ? `+${todayDiff}` : `${todayDiff}`,
      changeType: todayDiff >= 0 ? "positive" : "negative",
      icon: "Calendar",
      accent: "#10B981",
      comparisonLabel: "yesterday",
    },
    {
      // Just "Interested" — the parenthetical forced a three-line wrap on the
      // compact card and knocked the number off the row baseline.
      // "vs last month" already implies the period.
      title: "Interested",
      value: interested,
      change: `${interestedGrowth}%`,
      changeType: interestedGrowth >= 0 ? "positive" : "negative",
      icon: "Star",
      accent: "#F59E0B",
      comparisonLabel: "last month",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />
      <main className="top-bar-offset lg:ml-64">
        <div className="m-4 sm:m-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {greeting}
            {firstName ? `, ${firstName}` : ""}! Here's what's happening with
            your sales today.
          </p>
        </div>

        {/* Summary alert — overdue + follow-up-today leads. Plays a chime,
            lists clickable leads that open the lead drawer. Tighter mobile
            margin so the inner card has more breathing room. */}
        <div className="mx-2 sm:mx-5">
          <DashboardSummaryAlert />
        </div>

        {/* KPI Cards */}
        {/* The hero spans both columns on a phone so the third card is never
            orphaned alone on a row; from md all three are equal columns. */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 m-3 sm:m-5">
          {kpiData?.map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`h-full ${index === 0 ? "col-span-2 md:col-span-1" : "col-span-1"}`}
            >
              <KPICard {...kpi} isLoading={
                thisMonthQuery.isLoading ||
                todayQuery.isLoading ||
                interestedQuery.isLoading
              } />
            </motion.div>
          ))}
        </div>
        {/* Qualification row (spec 4) — what happened to all our leads,
            below the KPI row which answers how are we doing this month.
            Two columns on a phone so the four tile 2x2. */}
        {allLeadsTotal > 0 && (
          <div className="m-3 sm:m-5">
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {qualificationCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="h-full"
                >
                  <MetricsCard
                    {...card}
                    isLoading={qualificationLoading}
                    expandable={card.expandable}
                    isOpen={card.expandable && isBreakdownOpen}
                    onToggle={
                      card.expandable
                        ? () => setIsBreakdownOpen((open) => !open)
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </div>

            <div className="mt-3 sm:mt-5">
              <QualifiedBreakdown
                isOpen={isBreakdownOpen}
                rows={breakdownRows}
                isLoading={breakdownQueries.some((q) => q.isLoading)}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
          {/* Main Content */}
          <div className="flex-1 p-4 lg:p-0 xl:pr-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >


              {/* Pipeline Chart */}
              <div className="sm:m-5 py-3">
                <PipelineChart leads={leads} />
              </div>
              <div className="sm:m-5 py-3">
                <MultiLineChart leads={leads} />
              </div>


              {/* Today's Activity funnel (spec 8) */}
              <div className="sm:m-5 py-3">
                <ActivityFunnel
                  counts={{
                    meetings,
                    siteVisitsScheduled,
                    visits: siteVisits,
                    purchased,
                  }}
                  activeKey={activeInsight}
                  onSelect={openInsight}
                />
                {/* <RecentActivities activities={activities} /> */}
              </div>

              {/* On mobile the right-rail donuts are inlined here rather than
                  hidden, so the phone does not lose the data entirely. */}
              <div className="sm:m-5 py-3 xl:hidden">
                <RightRail leads={leads} />
              </div>
            </motion.div>
          </div>

          {/* Right Rail — desktop column. The mobile copy is inlined after
              the funnel above. */}
          <div className="hidden xl:block max-w-96 p-6 border-l border-border bg-background">
            <RightRail leads={leads} />
          </div>
        </div>
      </main>

      {/* Insight sheet (spec 9) — bottom sheet on mobile, dialog on desktop */}
      <InsightSheet
        stageKey={activeInsight}
        records={insightData}
        onClose={() => setActiveInsight(null)}
        formatTime={formatTime}
        formatDate={formatDate}
      />
    </div>
  );
};

export default Dashboard;

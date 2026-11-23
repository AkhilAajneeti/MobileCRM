import React, { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import WeekendHero from "./components/WeekendHero";
import VisitsList from "./components/VisitsList";
import DateTimePicker from "./components/DateTimePicker";
import ScheduleVisitDialog from "./components/ScheduleVisitDialog";
import {
  fetchSiteVisits,
  markVisitDone,
  rescheduleVisit,
  scheduleVisit,
} from "services/siteVisits.service";
import { useUsers } from "hooks/useUsers";
import { canReadField } from "utils/permission";
import { toEspoDateTime } from "../pipeline/utils/dateHelpers";
import {
  STATUS_SCHEDULED,
  STATUS_VISITED,
  getVisitAt,
  getWeekendRange,
  isOutcome,
  isThisWeekend,
  parseVisitDate,
  sortVisits,
  toDisplayStatus,
} from "./utils/siteVisitHelpers";

const TABS = [
  { key: "all", label: "All visits" },
  { key: "needs", label: "Needs confirming" },
  { key: "weekend", label: "This weekend" },
  { key: "outcomes", label: "Outcomes" },
];

const SiteVisitsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [repFilter, setRepFilter] = useState("");
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [savingId, setSavingId] = useState(null);

  const queryClient = useQueryClient();
  const { data: usersData } = useUsers();

  // No masking helper exists in this codebase, so the closest real signal is
  // the field-level read permission (spec 7.2 / 8.4).
  const masked = !canReadField("Lead", "phoneNumber");

  const { data, isLoading } = useQuery({
    queryKey: ["site-visits"],
    queryFn: fetchSiteVisits,
    staleTime: 1000 * 60 * 2,
  });

  const visits = useMemo(() => sortVisits(data?.list || []), [data]);

  /* ---------------- Tab membership ----------------
     Counts are computed over the WHOLE dataset, before search and the two
     selects are applied. A tab can read 12 while the table shows 3 rows:
     the tab count describes the view, the filters narrow within it. */
  const byTab = useMemo(
    () => ({
      all: visits,
      needs: visits.filter((v) => toDisplayStatus(v.status) === STATUS_SCHEDULED),
      weekend: visits.filter((v) => isThisWeekend(getVisitAt(v))),
      outcomes: visits.filter((v) => isOutcome(toDisplayStatus(v.status))),
    }),
    [visits],
  );

  /** Built from the loaded records, not a user directory, so the list only
      ever contains reps who actually have visits. */
  const repOptions = useMemo(() => {
    const names = new Set(
      visits.map((v) => v.assignedUserName || "Unassigned"),
    );
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [visits]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (byTab[activeTab] || []).filter((visit) => {
      if (statusFilter && toDisplayStatus(visit.status) !== statusFilter) return false;
      if (repFilter && (visit.assignedUserName || "Unassigned") !== repFilter) {
        return false;
      }
      if (!term) return true;

      return [
        visit.name,
        visit.cProject || visit.cProjectName,
        visit.phoneNumber,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [byTab, activeTab, statusFilter, repFilter, search]);

  /* ---------------- Hero numbers ---------------- */
  const weekendStats = useMemo(() => {
    const { saturday, sunday } = getWeekendRange();
    const onDay = (target) =>
      byTab.weekend.filter((v) => {
        const date = parseVisitDate(getVisitAt(v));
        return (
          date &&
          date.getFullYear() === target.getFullYear() &&
          date.getMonth() === target.getMonth() &&
          date.getDate() === target.getDate()
        );
      });

    const countDone = (rows) =>
      rows.filter((v) => toDisplayStatus(v.status) === STATUS_VISITED).length;

    const sat = onDay(saturday);
    const sun = onDay(sunday);
    const total = byTab.weekend.length;
    const done = countDone(byTab.weekend);

    return {
      saturday: { total: sat.length, done: countDone(sat) },
      sunday: { total: sun.length, done: countDone(sun) },
      total,
      done,
      pending: total - done,
    };
  }, [byTab.weekend]);

  /* ---------------- Mutations ---------------- */
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["site-visits"] });

  const markVisited = useMutation({
    mutationFn: (visit) => markVisitDone(visit.id),
    onMutate: (visit) => setSavingId(visit.id),
    onSuccess: () => {
      toast.success("Marked as visited");
      refresh();
    },
    // Failure copy never names a cause; the console carries the detail.
    onError: (error) => {
      console.error("Mark visited failed", error);
      toast.error("Could not update the visit");
    },
    onSettled: () => setSavingId(null),
  });

  const reschedule = useMutation({
    mutationFn: ({ id, date }) => rescheduleVisit(id, toEspoDateTime(date)),
    onMutate: ({ id }) => setSavingId(id),
    onSuccess: () => {
      toast.success("Visit rescheduled");
      setRescheduleTarget(null);
      refresh();
    },
    onError: (error) => {
      console.error("Reschedule failed", error);
      toast.error("Could not reschedule the visit");
    },
    onSettled: () => setSavingId(null),
  });

  const schedule = useMutation({
    mutationFn: ({ lead, assignedUserId, visitAt }) =>
      scheduleVisit(lead.id, {
        cSiteVisitAt: toEspoDateTime(visitAt),
        assignedUserId,
      }),
    onSuccess: () => {
      toast.success("Site visit scheduled");
      setIsScheduleOpen(false);
      refresh();
    },
    // Dialog stays open on failure with the entered values intact.
    onError: (error) => {
      console.error("Schedule failed", error);
      toast.error("Could not schedule the visit");
    },
  });

  return (
    <>
      <Helmet>
        <title>Site Visits - CRM</title>
        <meta
          name="description"
          content="Confirm scheduled site visits and track who actually shows up."
        />
      </Helmet>

      <div className="relative min-h-screen bg-background">
        <Header
          onMenuToggle={() => setIsSidebarOpen((open) => !open)}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className="top-bar-offset lg:ml-64">
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:p-6">
            {/* Page header */}
            <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground lg:text-3xl">
                  Site Visits
                </h1>
                <p className="mt-1 text-muted-foreground">
                  Confirm scheduled visits and track who actually shows up.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsScheduleOpen(true)}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 self-stretch rounded-lg bg-[#AC2334] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#961e2d] lg:self-start lg:py-2.5"
              >
                <Icon name="Plus" size={16} />
                Schedule visit
              </button>
            </div>

            <WeekendHero
              saturday={weekendStats.saturday}
              sunday={weekendStats.sunday}
              done={weekendStats.done}
              total={weekendStats.total}
              pending={weekendStats.pending}
              onStartCalls={() => {
                setActiveTab("needs");
                setStatusFilter("");
                setRepFilter("");
                setSearch("");
              }}
            />

            {/* One container holds tabs, filters and list. The shared borders
                are what make the filter row read as belonging to the tab
                above it rather than floating free. */}
            <div className="rounded-2xl border border-border bg-card">
              {/* Tab strip — a horizontal scroller on mobile. Not a select,
                  not stacked: the counts are meant to be comparable. */}
              <div className="flex gap-5 overflow-x-auto border-b border-border px-4 scrollbar-hide sm:gap-6 sm:px-5">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`relative -mb-px flex shrink-0 items-center gap-2 py-4 text-sm font-medium transition-colors ${
                        isActive ? "text-[#AC2334]" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {tab.label}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                          isActive
                            ? "bg-[#AC2334]/10 text-[#AC2334]"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {byTab[tab.key]?.length ?? 0}
                      </span>
                      {/* -mb-px puts the underline ON the container border */}
                      {isActive && (
                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#AC2334]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Filter row */}
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="relative flex-1">
                  <Icon
                    name="Search"
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by lead, project or phone..."
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#AC2334] focus:outline-none focus:ring-2 focus:ring-[#AC2334]/10 sm:h-10"
                  />
                </div>

                <select
                  aria-label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-[#AC2334] focus:outline-none sm:h-10"
                >
                  <option value="">All statuses</option>
                  <option value={STATUS_SCHEDULED}>Scheduled</option>
                  <option value={STATUS_VISITED}>Visited</option>
                </select>

                <select
                  aria-label="Assigned rep"
                  value={repFilter}
                  onChange={(e) => setRepFilter(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 focus:border-[#AC2334] focus:outline-none sm:h-10"
                >
                  <option value="">All reps</option>
                  {repOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <VisitsList
                visits={filtered}
                isLoading={isLoading}
                masked={masked}
                savingId={savingId}
                onReschedule={setRescheduleTarget}
                onMarkVisited={(visit) => markVisited.mutate(visit)}
              />
            </div>
          </div>
        </main>

        {rescheduleTarget && (
          <DateTimePicker
            title="Reschedule site visit"
            value={getVisitAt(rescheduleTarget)}
            onApply={(date) =>
              reschedule.mutate({ id: rescheduleTarget.id, date })
            }
            onClose={() => setRescheduleTarget(null)}
          />
        )}

        {isScheduleOpen && (
          <ScheduleVisitDialog
            users={usersData?.list || []}
            masked={masked}
            isSaving={schedule.isPending}
            onSubmit={(payload) => schedule.mutate(payload)}
            onClose={() => setIsScheduleOpen(false)}
          />
        )}
      </div>
    </>
  );
};

export default SiteVisitsPage;

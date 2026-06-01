import React, { memo, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { useUsers } from "hooks/useUsers";
import { useTeams } from "hooks/useTeams";
import { useProjectBreakdown } from "../../hooks/useLeadAnalytics";

const GROUP_OPTIONS = [
  { value: "project", label: "Projects" },
  { value: "team", label: "Teams" },
];

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

const ProjectTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  const data = slice?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] px-3.5 py-2.5 text-xs min-w-[180px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="w-2.5 h-2.5 rounded-sm shadow-sm"
          style={{ backgroundColor: data.fill }}
        />
        <span className="font-semibold text-slate-900 truncate">{data.name}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Leads</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {data.value}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Share</span>
          <span className="font-semibold text-violet-600 tabular-nums">
            {data.percent}%
          </span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Empty / loading states
// ---------------------------------------------------------------------------

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-4">
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center">
      <Icon name="PieChart" size={22} className="text-violet-500" />
    </div>
    <p className="text-sm font-semibold text-slate-700">No project data</p>
    <p className="text-xs text-slate-500 max-w-xs">
      Adjust your filters or tag leads with a project to see distribution here.
    </p>
  </div>
);

const Skeleton = () => (
  <div className="h-full flex items-center justify-center relative overflow-hidden">
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
      style={{ animation: "prj-shimmer 1.6s infinite" }}
    />
    <div className="w-48 h-48 rounded-full bg-slate-200 flex items-center justify-center">
      <div className="w-24 h-24 rounded-full bg-white" />
    </div>
    <style>{`
      @keyframes prj-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

// ---------------------------------------------------------------------------
// Center label inside the donut
// ---------------------------------------------------------------------------

const renderCenterLabel = ({ viewBox, total }) => {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#64748B"
        fontSize={11}
        fontWeight={500}
      >
        Total leads
      </text>
      <text
        x={cx}
        y={cy + 14}
        textAnchor="middle"
        fill="#0F172A"
        fontSize={22}
        fontWeight={700}
      >
        {total}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------

const ProjectChartComponent = ({ filters = {}, enabled = true }) => {
  const [groupBy, setGroupBy] = useState("project");

  // Users + teams power the "Teams" tab. Both hooks are cached app-wide, so
  // switching tabs is free after the first fetch. `useUsers` only matters when
  // we're in team mode — but it's harmless to mount either way (cache hit).
  const { data: usersData } = useUsers();
  const { data: teamsData } = useTeams();

  // userId → team name. Built once per users/teams change and only when the
  // chart is actually in team mode, so the project view pays no cost.
  const userTeamMap = useMemo(() => {
    if (groupBy !== "team") return null;
    const teamsById = new Map(
      (teamsData?.list || []).map((t) => [t.id, t.name]),
    );
    const map = new Map();
    for (const u of usersData?.list || []) {
      // Prefer the default team; fall back to the first team in the relation.
      const teamId = u.defaultTeamId || (u.teamsIds || [])[0];
      if (teamId) map.set(u.id, teamsById.get(teamId) || "Unknown team");
    }
    return map;
  }, [groupBy, usersData, teamsData]);

  const {
    pieData,
    total,
    projectCount,
    topProject,
    isLoading,
    isFetching,
    isEmpty,
  } = useProjectBreakdown({ filters, enabled, groupBy, userTeamMap });

  // Tab-aware copy.
  const isTeams = groupBy === "team";
  const titleText = isTeams ? "Team Distribution" : "Project Distribution";
  const subtitleText = isTeams
    ? "Lead share across teams"
    : "Lead share across projects";
  const bucketLabel = isTeams ? "Teams" : "Projects";
  const topLabel = isTeams ? "Top team" : "Top project";

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-elevation-1 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] transition-shadow duration-500 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              {titleText}
            </span>
            {isFetching && !isLoading && (
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subtitleText}
          </p>
        </div>

        {/* Group-by tabs — flips the donut from project to team buckets without
            re-fetching anything (same dataset, different reducer). */}
        <div
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 self-start"
          role="tablist"
          aria-label="Group by"
        >
          {GROUP_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              variant={groupBy === opt.value ? "default" : "ghost"}
              onClick={() => setGroupBy(opt.value)}
              className="h-7 px-3 text-xs transition-all duration-200"
              role="tab"
              aria-selected={groupBy === opt.value}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Donut body — flex-1 so it absorbs any extra height when the card is
          stretched to match a taller sibling card. Minimum keeps a single-data
          view legible. */}
      <div className="flex-1 min-h-[260px]">
        {isLoading && isEmpty ? (
          <Skeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                animationDuration={800}
                animationEasing="ease-out"
                isAnimationActive
                label={(props) => renderCenterLabel({ ...props, total })}
                labelLine={false}
              >
                {pieData.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.fill}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<ProjectTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Custom legend (top projects with bars) — more useful than Recharts default */}
      {!isEmpty && (
        <div className="mt-3 space-y-1.5 max-h-[140px] overflow-y-auto pr-1 shrink-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
          {pieData.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: p.fill }}
              />
              <span className="text-slate-700 truncate flex-1 min-w-0">
                {p.name}
              </span>
              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${p.percent}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: p.fill }}
                />
              </div>
              <span className="text-slate-900 font-semibold tabular-nums w-10 text-right shrink-0">
                {p.value}
              </span>
              <span className="text-slate-500 tabular-nums w-12 text-right shrink-0">
                {p.percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Footer KPI strip — pinned to the bottom of the card via flex-col + shrink-0,
          so it lines up with the AssignedUserChart's footer regardless of card height. */}
      {!isEmpty && (
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3 shrink-0">
          <div className="rounded-lg bg-slate-50 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
              {bucketLabel}
            </div>
            <div className="text-lg font-bold text-slate-900 tabular-nums">
              {projectCount}
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 px-3 py-2 text-right">
            <div className="text-[10px] uppercase tracking-wider text-indigo-700 font-medium truncate">
              {topLabel}
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {topProject?.name || "—"}
              {topProject && (
                <span className="text-xs font-medium text-slate-500 ml-1">
                  ({topProject.percent}%)
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default memo(ProjectChartComponent);

import React, { memo, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { useWinRateAnalytics } from "../hooks/useWinRateAnalytics";

const PRIMARY = "#8B5CF6";
const PRIMARY_DARK = "#6D28D9";
const YEAR = new Date().getFullYear();

// ---------------------------------------------------------------------------
// Tooltip — shows won / lost / active / win rate
// ---------------------------------------------------------------------------

const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] px-3.5 py-3 text-xs min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-900">
          {label} {YEAR}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
          {row.winRate}%
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-500">Won</span>
          </div>
          <span className="font-semibold text-slate-900 tabular-nums">
            {row.won}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
            <span className="text-slate-500">Lost</span>
          </div>
          <span className="font-semibold text-slate-900 tabular-nums">
            {row.lost}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="text-slate-500">Active</span>
          </div>
          <span className="font-semibold text-slate-900 tabular-nums">
            {row.active}
          </span>
        </div>
      </div>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  const data = slice?.payload;
  if (!data) return null;

  return (
    <div className="rounded-xl border border-white/40 bg-white/95 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] px-3.5 py-2.5 text-xs min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2.5 h-2.5 rounded-sm"
          style={{ backgroundColor: data.fill }}
        />
        <span className="font-semibold text-slate-900">{data.name}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-slate-500">
        <span>Leads</span>
        <span className="font-semibold text-slate-900 tabular-nums">
          {data.value}
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// KPI tile with trend arrow
// ---------------------------------------------------------------------------

const TrendBadge = ({ trend, invert = false }) => {
  if (!trend) return null;
  const { direction, pct } = trend;
  // `invert` flips meaning for metrics where lower is better (e.g. lost).
  const isGood =
    direction === "flat"
      ? null
      : invert
        ? direction === "down"
        : direction === "up";

  const colorClass =
    isGood === null
      ? "text-slate-400 bg-slate-100"
      : isGood
        ? "text-emerald-700 bg-emerald-50"
        : "text-rose-700 bg-rose-50";

  const arrow =
    direction === "up" ? "ArrowUpRight" : direction === "down" ? "ArrowDownRight" : "Minus";

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}
    >
      <Icon name={arrow} size={10} />
      {direction === "flat" ? "0%" : `${pct}%`}
    </span>
  );
};

const KpiTile = ({ icon, iconColor, label, value, trend, invert, accent }) => (
  <div className="rounded-xl bg-slate-50/80 border border-slate-100 px-4 py-3">
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <Icon name={icon} size={14} className={iconColor} />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <TrendBadge trend={trend} invert={invert} />
    </div>
    <div
      className={`text-2xl font-bold tabular-nums ${
        accent ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent" : "text-slate-900"
      }`}
    >
      {value}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Empty states
// ---------------------------------------------------------------------------

const EmptyState = ({
  iconName = "BarChart3",
  title = "No analytics available yet",
  message = "Once leads are created and moved through statuses, win rate trends will appear here.",
}) => (
  <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center">
      <Icon name={iconName} size={24} className="text-violet-500" />
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5 max-w-sm">{message}</p>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Skeleton (shimmer)
// ---------------------------------------------------------------------------

const Skeleton = () => (
  <div className="h-full flex flex-col gap-3 p-2 relative overflow-hidden rounded-lg">
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
      style={{ animation: "wrc-shimmer 1.6s infinite" }}
    />
    <div className="flex-1 flex items-end gap-2">
      {[40, 60, 50, 75, 65, 80, 55, 70, 60, 85, 70, 90].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-200 rounded-t"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
    <style>{`
      @keyframes wrc-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

// ---------------------------------------------------------------------------

const WinRateChart = ({ filters = {}, enabled = true }) => {
  const [chartType, setChartType] = useState("line");

  const {
    monthlyData,
    pieData,
    summary,
    isEmpty,
    hasWins,
    isLoading,
    isFetching,
  } = useWinRateAnalytics({ filters, year: YEAR, enabled });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] transition-shadow duration-500"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-3">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 bg-clip-text text-transparent">
              Win Rate Analytics
            </span>
            {isFetching && !isLoading && (
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monthly win rate trends and distribution · {YEAR}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={chartType === "line" ? "default" : "outline"}
            size="sm"
            onClick={() => setChartType("line")}
            iconName="TrendingUp"
            iconPosition="left"
          >
            Trend
          </Button>
          
        </div>
      </div>

      {/* Chart body */}
      <div className="h-80">
        {isLoading && (!monthlyData || monthlyData.every((m) => m.total === 0)) ? (
          <Skeleton />
        ) : isEmpty ? (
          <EmptyState />
        ) : chartType === "line" && !hasWins ? (
          // Lost/active exist but zero purchases → win rate would draw a flat 0% line.
          // Per spec, replace with a contextual empty state instead.
          <EmptyState
            iconName="Trophy"
            title="No closed deals yet"
            message="Move a lead to “Purchased” to start the win rate trend. Switch to Distribution to see active and lost leads."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="wrc-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={PRIMARY} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={PRIMARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                domain={[0, "dataMax + 5"]}
                tickFormatter={(v) => `${v}%`}
                width={40}
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<LineTooltip />}
                cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }}
              />
              <Area
                type="monotone"
                dataKey="winRate"
                stroke={PRIMARY}
                strokeWidth={2.5}
                fill="url(#wrc-area)"
                dot={{ r: 4, fill: PRIMARY, stroke: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: PRIMARY_DARK, stroke: "#fff", strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* KPI tiles */}
      {summary && !isEmpty && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
          <KpiTile
            icon="CheckCircle2"
            iconColor="text-emerald-600"
            label="Total Won"
            value={summary.totalWon}
            trend={summary.trends?.won}
          />
          <KpiTile
            icon="XCircle"
            iconColor="text-rose-600"
            label="Total Lost"
            value={summary.totalLost}
            trend={summary.trends?.lost}
            invert
          />
          <KpiTile
            icon="Target"
            iconColor="text-violet-600"
            label="Win Rate"
            value={`${summary.overallWinRate}%`}
            trend={summary.trends?.winRate}
            accent
          />
          <KpiTile
            icon="TrendingUp"
            iconColor="text-amber-600"
            label="Best Month"
            value={
              summary.bestMonth
                ? `${summary.bestMonth.month} · ${summary.bestMonth.winRate}%`
                : "—"
            }
          />
        </div>
      )}
    </motion.div>
  );
};

export default memo(WinRateChart);

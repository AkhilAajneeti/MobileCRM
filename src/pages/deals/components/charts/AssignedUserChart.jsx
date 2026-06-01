import React, { memo, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Select from "components/ui/Select";
import { useUserBreakdown } from "../../hooks/useLeadAnalytics";

// Each segment defines a gradient {from -> to} for the bar fill.
const SEGMENTS = [
  { key: "interested", label: "Interested", from: "#34D399", to: "#10B981" },
  { key: "followUp", label: "Follow up", from: "#FBBF24", to: "#F59E0B" },
  { key: "purchased", label: "Purchased", from: "#A78BFA", to: "#7C3AED" },
  { key: "notInterested", label: "Not Interested", from: "#FB7185", to: "#E11D48" },
  { key: "newOpen", label: "New/Open", from: "#60A5FA", to: "#2563EB" },
  { key: "other", label: "Other/Closed", from: "#CBD5E1", to: "#94A3B8" },
];

const ROW_HEIGHT = 48;
const VISIBLE_ROWS = 7;
const Y_AXIS_WIDTH = 180;
// Fixed vertical overhead inside the chart (X-axis + legend + paddings).
// Used so the chart hugs its content even with a single row.
const CHART_CHROME = 60;
// Hard floor — just enough to render one bar, axis ticks, and legend cleanly.
const MIN_CHART_HEIGHT = 140;
// Cap on bar segment thickness — prevents a one-rep view from rendering a huge chunky bar.
const MAX_BAR_SIZE = 36;

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "currentMonth", label: "This month" },
  { value: "on", label: "On a date…" },
];

const formatPickedDate = (dateStr) => {
  if (!dateStr) return "selected date";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// Human label for the active range, used in subtitle + empty state.
const rangeLabel = (range, onDate) => {
  if (range === "on") return onDate ? `on ${formatPickedDate(onDate)}` : "a selected date";
  if (range === "today") return "today";
  if (range === "currentMonth") return "this month";
  return "the last 7 days";
};

// Stable avatar color per user name.
const AVATAR_PALETTE = [
  "#6366F1", "#22C55E", "#F59E0B", "#EF4444",
  "#06B6D4", "#8B5CF6", "#EC4899", "#14B8A6",
];
const colorForName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
};

const initialsOf = (name = "") =>
  name.trim().charAt(0).toUpperCase() || "?";

// ---------------------------------------------------------------------------
// Tooltip — glassmorphic, animated, segment-aware
// ---------------------------------------------------------------------------

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={row.userId}
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="rounded-xl border border-white/40 bg-white/90 backdrop-blur-md shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)] px-3.5 py-3 text-xs min-w-[230px]"
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-inner"
              style={{ backgroundColor: colorForName(row.name) }}
            >
              {initialsOf(row.name)}
            </span>
            <span className="font-semibold text-slate-900">{row.name}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {row.total} leads
          </span>
        </div>

        <div className="space-y-1.5">
          {SEGMENTS.map((seg) => {
            const value = row[seg.key] || 0;
            const isOther = seg.key === "other";
            const breakdown = isOther
              ? Object.entries(row.otherBreakdown || {}).sort(
                  (a, b) => b[1] - a[1],
                )
              : [];

            return (
              <div key={seg.key}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${seg.from}, ${seg.to})`,
                      }}
                    />
                    <span className="text-slate-500">{seg.label}</span>
                  </div>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {value}
                  </span>
                </div>

                {isOther && value > 0 && breakdown.length > 0 && (
                  <div className="mt-1 ml-4.5 pl-3 border-l border-slate-200/80 space-y-0.5">
                    {breakdown.map(([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center justify-between text-[10px] text-slate-500"
                      >
                        <span className="truncate">{status}</span>
                        <span className="font-medium tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {row.overdue > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/70">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Overdue follow-ups</span>
              <span className="font-semibold text-rose-600 tabular-nums">
                {row.overdue}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// ---------------------------------------------------------------------------
// Skeleton with shimmer sweep
// ---------------------------------------------------------------------------

const Skeleton = () => (
  <div className="h-full flex flex-col justify-center gap-3 px-2 relative overflow-hidden rounded-lg">
    <div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent"
      style={{ animation: "auc-shimmer 1.6s infinite" }}
    />
    {[1, 2, 3, 4, 5].map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-200 rounded-full" />
        <div className="w-24 h-3 bg-slate-200 rounded" />
        <div
          className="flex-1 h-5 bg-slate-200 rounded-full"
          style={{ width: `${80 - i * 10}%` }}
        />
      </div>
    ))}
    <style>{`
      @keyframes auc-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `}</style>
  </div>
);

// ---------------------------------------------------------------------------
// Y-axis tick: avatar + name + meta on two lines, gold ring for top performer
// ---------------------------------------------------------------------------

const YTick = ({ x, y, payload, sortedRows }) => {
  const row = sortedRows.find((r) => r.name === payload.value);
  if (!row) return null;

  const isTop = sortedRows[0]?.userId === row.userId;
  const avatar = colorForName(row.name);
  const initials = initialsOf(row.name);

  return (
    <g transform={`translate(${x},${y})`} style={{ cursor: "pointer" }}>
      {/* glow ring for #1 */}
      {isTop && (
        <circle
          cx={-Y_AXIS_WIDTH + 22}
          cy={0}
          r={15}
          fill="none"
          stroke="#F59E0B"
          strokeWidth={1.5}
          opacity={0.7}
        />
      )}
      <circle cx={-Y_AXIS_WIDTH + 22} cy={0} r={13} fill={avatar} opacity={0.18} />
      <circle cx={-Y_AXIS_WIDTH + 22} cy={0} r={11} fill={avatar} />
      <text
        x={-Y_AXIS_WIDTH + 22}
        y={0}
        dy={4}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight={700}
      >
        {initials}
      </text>

      <text
        x={-Y_AXIS_WIDTH + 42}
        y={0}
        dy={-2}
        textAnchor="start"
        fill="#0F172A"
        fontSize={12}
        fontWeight={600}
      >
        {row.name}
      </text>
      <text
        x={-Y_AXIS_WIDTH + 42}
        y={0}
        dy={12}
        textAnchor="start"
        fill="#64748B"
        fontSize={10}
      >
        {row.total} {row.total === 1 ? "lead" : "leads"}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------

const AssignedUserChartComponent = ({ filters = {}, enabled = true }) => {
  const [range, setRange] = useState("7d");
  const [onDate, setOnDate] = useState("");

  const { data, isLoading, isFetching } = useUserBreakdown({
    filters,
    range,
    onDate: range === "on" ? onDate : null,
    enabled,
  });

  // Cap the date picker so users can't pick the future (ESPO would return 0 anyway).
  const todayIso = new Date().toISOString().slice(0, 10);

  const populated = useMemo(
    () => (data || []).filter((r) => r.total > 0),
    [data],
  );

  const sortedRows = useMemo(() => {
    return [...populated].sort((a, b) => b.total - a.total);
  }, [populated]);

  const totalLeads = useMemo(
    () => sortedRows.reduce((s, r) => s + (Number(r.total) || 0), 0),
    [sortedRows],
  );

  // Hug the content: rows × ROW_HEIGHT for the bars + fixed CHART_CHROME for
  // axis & legend. A small MIN_CHART_HEIGHT keeps a single-row view legible.
  // `chartHeight` is a FLOOR — the chart never gets smaller than this. When the
  // card is stretched taller by its grid sibling, `min-h-full` on the inner div
  // lets the chart fill the extra space. When the row count would exceed the
  // available area, the wrapper's `overflow-y-auto` kicks in.
  const chartHeight = Math.max(
    sortedRows.length * ROW_HEIGHT + CHART_CHROME,
    MIN_CHART_HEIGHT,
  );

  // Re-key the bars on range change so animations replay when the user toggles.
  const chartKey = `${range}:${onDate}:${sortedRows.length}`;

  return (
    <motion.div
      className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-elevation-1 hover:shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] transition-shadow duration-500 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 shrink-0">
        <div>
          <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
            <span className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Leads by Assigned User
            </span>
            {isFetching && !isLoading && (
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            <span className="capitalize">{rangeLabel(range, onDate)}</span> · distribution across the team
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[160px]">
            <Select
              options={RANGE_OPTIONS}
              value={range}
              onChange={(val) => {
                setRange(val);
                if (val !== "on") setOnDate("");
              }}
              placeholder="Range"
            />
          </div>

          {range === "on" && (
            <motion.input
              key="on-date-input"
              type="date"
              value={onDate}
              max={todayIso}
              onChange={(e) => setOnDate(e.target.value)}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18 }}
              className="h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
            />
          )}
        </div>
      </div>

      {isLoading && sortedRows.length === 0 ? (
        <div className="flex-1 min-h-[200px]">
          <Skeleton />
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="flex-1 min-h-[200px] flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-2xl">
            {range === "on" && !onDate ? "📅" : "∅"}
          </div>
          {range === "on" && !onDate
            ? "Pick a date to view leads"
            : `No leads ${rangeLabel(range, onDate)}`}
        </div>
      ) : (
        <>
          <motion.div
            key={chartKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            <div className="min-h-full" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedRows}
                  layout="vertical"
                  margin={{ top: 6, right: 28, left: 0, bottom: 6 }}
                  barCategoryGap={10}
                >
                  <defs>
                    {SEGMENTS.map((seg) => (
                      <linearGradient
                        key={seg.key}
                        id={`auc-grad-${seg.key}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop offset="0%" stopColor={seg.from} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={seg.to} stopOpacity={1} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    strokeOpacity={0.18}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={Y_AXIS_WIDTH}
                    tick={(props) => <YTick {...props} sortedRows={sortedRows} />}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "rgba(99,102,241,0.05)" }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />

                  {SEGMENTS.map((seg, i) => (
                    <Bar
                      key={seg.key}
                      dataKey={seg.key}
                      name={seg.label}
                      stackId="a"
                      fill={`url(#auc-grad-${seg.key})`}
                      radius={i === SEGMENTS.length - 1 ? [0, 8, 8, 0] : [0, 0, 0, 0]}
                      maxBarSize={MAX_BAR_SIZE}
                      animationDuration={700}
                      animationEasing="ease-out"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Footer with stat tiles — `shrink-0` anchors it at the bottom even
              when the chart area above flex-grows to fill a stretched card. */}
          <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3 shrink-0">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                Active reps
              </div>
              <div className="text-lg font-bold text-slate-900 tabular-nums">
                {sortedRows.length}
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 px-3 py-2 text-right">
              <div className="text-[10px] uppercase tracking-wider text-indigo-700 font-medium">
                Total leads
              </div>
              <motion.div
                key={totalLeads}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent tabular-nums"
              >
                {totalLeads}
              </motion.div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default memo(AssignedUserChartComponent);

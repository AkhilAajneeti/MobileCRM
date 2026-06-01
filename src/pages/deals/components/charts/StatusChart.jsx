import React, { memo, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import Button from "components/ui/Button";
import { useStatusTrend, STATUS_KEY } from "../../hooks/useLeadAnalytics";

const SERIES = [
  { key: STATUS_KEY["New"], label: "New", color: "#3B82F6" },
  { key: STATUS_KEY["Interested"], label: "Interested", color: "#22C55E" },
  { key: STATUS_KEY["Follow up"], label: "Follow up", color: "#F59E0B" },
  { key: STATUS_KEY["Purchased"], label: "Purchased", color: "#8B5CF6" },
  { key: STATUS_KEY["Not Interested"], label: "Not Interested", color: "#EF4444" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);

  return (
    <div className="rounded-lg border border-border bg-popover shadow-elevation-2 px-3 py-2 text-xs">
      <div className="font-semibold text-foreground mb-1.5">{label}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-muted-foreground">{p.name}</span>
            </div>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-1.5 border-t border-border flex items-center justify-between">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold text-foreground">{total}</span>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <div className="h-full flex flex-col justify-end gap-2 px-2 pb-6 pt-4 animate-pulse">
    <div className="flex-1 flex items-end gap-3">
      {[40, 70, 55, 85, 35, 60, 75].map((h, i) => (
        <div key={i} className="flex-1 bg-gray-200 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
    <div className="h-2 bg-gray-200 rounded w-full mt-2" />
  </div>
);

const StatusChartComponent = ({ filters = {}, enabled = true }) => {
  const [viewType, setViewType] = useState("monthly");

  const { data, isLoading, isFetching } = useStatusTrend({
    filters,
    viewType,
    enabled,
  });

  const hasData = useMemo(
    () => (data || []).some((d) => SERIES.some((s) => (d[s.key] || 0) > 0)),
    [data],
  );

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            Status Trend
            {isFetching && !isLoading && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            )}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Sales status movement over time
          </p>
        </div>

        <div
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5"
          role="tablist"
          aria-label="Trend interval"
        >
          {["monthly", "weekly", "daily"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={viewType === type ? "default" : "ghost"}
              onClick={() => setViewType(type)}
              className="capitalize h-7 px-3 text-xs"
              role="tab"
              aria-selected={viewType === type}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[280px] sm:h-[340px]">
        {isLoading ? (
          <Skeleton />
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            No leads in this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                width={32}
                allowDecimals={false}
                domain={[0, "dataMax + 1"]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#CBD5E1", strokeDasharray: "3 3" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />

              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default memo(StatusChartComponent);

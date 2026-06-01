import React, { useEffect, useMemo, useState } from "react";
import {
  Pie,
  PieChart,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Label,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Select from "../../../components/ui/Select";
import Input from "../../../components/ui/Input";
import { fetchLeadsCount } from "services/leads.service";

const COLORS = [
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#2563eb", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#10b981", // green
  "#f97316", // orange
  "#22c55e", // light green
  "#e11d48", // rose
];
const STATUS_OPTIONS = [
  "Call Later",
  "Call Not Connecting",
  "Call Not Picked",
  "Converted",
  "Dead",
  "Duplicate",
  "Follow Up",
  "Future Prospect",
  "In Process",
  "Interested",
  "Invalid",
  "Low Budget | Low Intent",
  "New",
  "Not interested",
  "Proposal Shared",
  "Qualified",
  "Webinar",
];

const StatusChart = () => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const ACTIVITY_DATE_FILTERS = [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 Days", value: "last7Days" },

    { label: "This Month", value: "currentMonth" },
    { label: "Last Month", value: "lastMonth" },
  ];
  const [filters, setFilters] = useState({
    dateType: "today",        // 👈 NEW (today, before, between, etc.)
    closeDateFrom: "",
    closeDateTo: "",
    xDays: ""            // 👈 for "Last X Days", "After X Days"
  });
  const showXDaysInput = [
    "lastXDays",
    "nextXDays",
    "olderThanXDays",
    "afterXDays"
  ].includes(filters?.dateType);


  // 🔥 Group by industry
  const buildDateFilter = (filters) => {
    const { dateType, closeDateFrom, closeDateTo, xDays } = filters;

    if (!dateType) return null;

    // ✅ TODAY
    if (dateType === "today") {
      return {
        type: "today",
        attribute: "createdAt",
        dateTime: true,
      };
    }

    // ✅ YESTERDAY
    if (dateType === "yesterday") {
      const today = new Date();
      const y = new Date(today);
      y.setDate(today.getDate() - 1);

      const start = new Date(y.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(y.setHours(23, 59, 59, 999)).toISOString();

      return {
        type: "between",
        attribute: "createdAt",
        value: [start, end],
        dateTime: true,
      };
    }
    // ✅ LAST 7 DAYS
    if (dateType === "last7Days") {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - 6);

      return {
        type: "between",
        attribute: "createdAt",
        value: [
          new Date(past.setHours(0, 0, 0, 0)).toISOString(),
          new Date(today.setHours(23, 59, 59, 999)).toISOString(),
        ],
        dateTime: true,
      };
    }

    // ✅ CURRENT MONTH
    if (dateType === "currentMonth") {
      const today = new Date();

      return {
        type: "between",
        attribute: "createdAt",
        value: [
          new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
          new Date().toISOString(),
        ],
        dateTime: true,
      };
    }

    // ✅ LAST MONTH
    if (dateType === "lastMonth") {
      const today = new Date();

      return {
        type: "between",
        attribute: "createdAt",
        value: [
          new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(),
          new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59).toISOString(),
        ],
        dateTime: true,
      };
    }

    // ✅ LAST X DAYS
    if (dateType === "lastXDays" && xDays) {
      const today = new Date();
      const past = new Date();
      past.setDate(today.getDate() - Number(xDays));

      const start = new Date(past.setHours(0, 0, 0, 0)).toISOString();
      const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      return {
        type: "between",
        attribute: "createdAt",
        value: [start, end],
        dateTime: true,
      };
    }

    // ✅ BEFORE
    if (dateType === "before" && closeDateFrom) {
      return {
        type: "before",
        attribute: "createdAt",
        value: new Date(closeDateFrom).toISOString(),
        dateTime: true,
      };
    }

    // ✅ AFTER
    if (dateType === "after" && closeDateFrom) {
      return {
        type: "after",
        attribute: "createdAt",
        value: new Date(closeDateFrom).toISOString(),
        dateTime: true,
      };
    }

    return null;
  };
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };
  const IMPORTANT_STATUSES = [
    "Converted",
    "Proposal Shared",
    "Interested",
    "Follow Up",
    "New",
    "Not interested"
  ];
  const getStatusData = async (filtersState) => {
    const dateFilter = buildDateFilter(filtersState);
    const baseFilters = dateFilter ? [dateFilter] : [];

    // ✅ Only call important statuses (6 calls instead of 17)
    const results = await Promise.all(
      IMPORTANT_STATUSES.map((status) =>
        fetchLeadsCount([
          ...baseFilters,
          {
            type: "equals",
            attribute: "status",
            value: status,
          },
        ])
      )
    );

    const data = IMPORTANT_STATUSES.map((status, i) => ({
      name: status,
      value: results[i],
    }));

    // ✅ Get total count (1 extra call)
    const total = await fetchLeadsCount(baseFilters);

    const knownTotal = results.reduce((sum, val) => sum + val, 0);

    // ✅ Add "Others"
    const others = Math.max(total - knownTotal, 0);

    if (others > 0) {
      data.push({
        name: "Others",
        value: others,
      });
    }

    return data;
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = total === 0;
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-1">
            {data.name}
          </p>
          <p className="text-sm text-muted-foreground">Leads: {data.value}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (!filters.dateType) return;

    setLoading(true);

    getStatusData(filters)
      .then(setChartData)
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-col">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Leads by Status
          </h3>
          <p className="text-sm text-muted-foreground">
            Lead distribution across Status
          </p>
        </div>
        <div className="w-full mt-5 scrollbar-hide">
          <div className="flex gap-1 mt-5 w-full">
            <Select
              className="w-full"
              placeholder="Filter by date"
              options={ACTIVITY_DATE_FILTERS}
              value={filters?.dateType || ""}
              onChange={(value) => handleFilterChange("dateType", value)}
            />

            {/* X Days Input */}
            {showXDaysInput && (
              <Input
                type="number"
                placeholder="Enter days"
                value={filters?.xDays || ""}
                onChange={(e) =>
                  handleFilterChange("xDays", e.target.value)
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={isEmpty ? [{ name: "No Data", value: 1 }] : chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              paddingAngle={3}
            >
              {(isEmpty ? [{ name: "No Data" }] : chartData).map(
                (entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={isEmpty ? "#d1d5db" : COLORS[index % COLORS.length]}
                    opacity={isEmpty ? 0.4 : 1}
                  />
                ),
              )}
              <Label
                value={`Total\n${total}`}
                position="center"
                className="text-sm font-semibold"
              />
            </Pie>

            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary */}
      <div className="flex flex-wrap justify-start gap-6 mt-6 pt-4 border-t border-border text-sm">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{item.name}</span>
          </div>
        ))}

        <div className="flex items-center space-x-2 font-semibold">
          <Icon name="Target" size={16} />
          <span>Total: {total}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default StatusChart;

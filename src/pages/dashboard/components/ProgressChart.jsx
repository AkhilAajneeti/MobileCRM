import React, { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import Button from "../../../components/ui/Button";
const data = [
  { date: "Sep 1", leads: 20, visit: 10, closed: 5 },
  { date: "Sep 2", leads: 35, visit: 18, closed: 8 },
  { date: "Sep 3", leads: 28, visit: 15, closed: 7 },
  { date: "Sep 4", leads: 40, visit: 22, closed: 12 },
  { date: "Sep 5", leads: 32, visit: 20, closed: 10 },
  { date: "Sep 6", leads: 45, visit: 28, closed: 15 },
];

const ProgressChart = ({ leads = [] }) => {
  const [viewType, setViewType] = useState("month");
  // 🔥 Filter leads based on view type
  const filteredLeads = useMemo(() => {
    const now = new Date();

    if (viewType === "today") {
      return leads.filter(
        (l) => new Date(l.createdAt).toDateString() === now.toDateString(),
      );
    }

    if (viewType === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      return leads.filter(
        (l) =>
          new Date(l.createdAt).toDateString() === yesterday.toDateString(),
      );
    }

    if (viewType === "week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      return leads.filter((l) => {
        const d = new Date(l.createdAt);
        return d >= startOfWeek && d <= now;
      });
    }

    if (viewType === "month") {
      return leads.filter((l) => {
        const d = new Date(l.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    }

    return leads;
  }, [leads, viewType]);
  const chartData = useMemo(() => {
    const grouped = {};

    filteredLeads.forEach((lead) => {
      const date = new Date(lead.createdAt);
      const label = date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      });

      if (!grouped[label]) {
        grouped[label] = {
          date: label,
          leads: 0,
          visit: 0,
          closed: 0,
        };
      }

      grouped[label].leads += 1;

      if (lead.status === "Site Visit Scheduled") {
        grouped[label].visit += 1;
      }

      if (["Converted", "Deal Closed", "Purchased"].includes(lead.status)) {
        grouped[label].closed += 1;
      }
    });

    return Object.values(grouped);
  }, [filteredLeads]);

  return (
    <div className="w-full h-[280px]">
      <div className="flex items-start justify-between mb-6 flex-col">


        <div className="w-full overflow-x-auto mt-5 scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {["today", "yesterday", "week", "month"].map((type) => (
              <Button
                key={type}
                size="sm"
                variant={viewType === type ? "default" : "outline"}
                onClick={() => setViewType(type)}
                className="capitalize flex-shrink-0"
              >
                {type === "today" && "Today"}
                {type === "yesterday" && "Yesterday"}
                {type === "week" && "This Week"}
                {type === "month" && "This Month"}
              </Button>
            ))}
          </div>
        </div>
      </div>
      <ResponsiveContainer>
        <AreaChart data={chartData}>
          {/* 🔥 Gradients */}
          <defs>
            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>

            <linearGradient id="colorVisit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>

            <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid */}
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.1} />

          {/* Axes */}
          <XAxis dataKey="date" />
          <YAxis axisLine={false} tickLine={false} />

          {/* Tooltip */}
          <Tooltip />

          {/* Legend */}
          <Legend />

          {/* 🔵 Leads */}
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#3b82f6"
            strokeWidth={1}
            fill="url(#colorLeads)"
          />

          {/* 🟡 Visits */}
          <Area
            type="monotone"
            dataKey="visit"
            stroke="#f59e0b"
            strokeWidth={1}
            fill="url(#colorVisit)"
          />

          {/* 🟢 Closed */}
          <Area
            type="monotone"
            dataKey="closed"
            stroke="#22c55e"
            strokeWidth={1}
            fill="url(#colorClosed)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProgressChart;

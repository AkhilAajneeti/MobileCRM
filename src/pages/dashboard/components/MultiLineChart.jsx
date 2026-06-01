import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { fetchLeadsCount } from "services/leads.service";

const MultiLineChart = ({ leads = [] }) => {
  // const [selectedYear, setSelectedYear] = useState(2024);
  const [viewType, setViewType] = useState("monthly");
  const [monthlyData, setMonthlyData] = useState([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const [weeklyData, setWeeklyData] = useState([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const now = new Date();
  const currentYearLeads = leads.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getFullYear() === now.getFullYear();
  }).length;
  const currentYear = new Date().getFullYear();
  const isMobile = window.innerWidth < 640;
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">
            {label} {currentYear}
          </p>

          <div className="space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-popover-foreground capitalize">
                  {entry.dataKey === "ACL" ? "Aajneeti" : entry.dataKey} : {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // get monthly data

  const getMonthlyDataFromAPI = async () => {
    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const months = Array.from({ length: 12 }, (_, i) => {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { i, start, end };
    });

    const results = [];
    const BATCH_SIZE = 2;

    for (let i = 0; i < months.length; i += BATCH_SIZE) {
      const batch = months.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async ({ i, start, end }) => {
          if (i > currentMonth) {
            return {
              label: start.toLocaleString("default", { month: "short" }),
              meta: 0,
              ACL: 0,
              website: 0,
            };
          }

          const [meta, ACL, website] = await Promise.all([
            fetchLeadsCount([
              { type: "between", attribute: "createdAt", value: [start.toISOString(), end.toISOString()] },
              { type: "like", attribute: "cSubSource", value: "%meta%" },
            ]),
            fetchLeadsCount([
              { type: "between", attribute: "createdAt", value: [start.toISOString(), end.toISOString()] },
              { type: "in", attribute: "source", value: ["ACL"] },
            ]),
            fetchLeadsCount([
              { type: "between", attribute: "createdAt", value: [start.toISOString(), end.toISOString()] },
              { type: "in", attribute: "source", value: ["Web Site"] },
            ]),
          ]);

          return {
            label: start.toLocaleString("default", { month: "short" }),
            meta,
            ACL,
            website,
          };
        })
      );

      results.push(...batchResults);
    }

    return results;
  };
  const getWeeklyDataFromAPI = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const weeks = [
      { label: "W1", start: 1, end: 7 },
      { label: "W2", start: 8, end: 14 },
      { label: "W3", start: 15, end: 21 },
      { label: "W4", start: 22, end: 28 },
      { label: "W5", start: 29, end: 31 },
    ];

    const results = [];
    const BATCH_SIZE = 2; // 🔥 same as others

    for (let i = 0; i < weeks.length; i += BATCH_SIZE) {
      const batch = weeks.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (w) => {
          const start = new Date(year, month, w.start);
          start.setHours(0, 0, 0, 0);

          const lastDate = new Date(year, month + 1, 0).getDate();
          const endDay = Math.min(w.end, lastDate);

          const end = new Date(year, month, endDay);
          end.setHours(23, 59, 59, 999);

          const [meta, ACL, website] = await Promise.all([
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [start.toISOString(), end.toISOString()],
              },
              { type: "like", attribute: "cSubSource", value: "%meta%" },
            ]),
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [start.toISOString(), end.toISOString()],
              },
              { type: "in", attribute: "source", value: ["ACL"] },
            ]),
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [start.toISOString(), end.toISOString()],
              },
              { type: "in", attribute: "source", value: ["Web Site"] },
            ]),
          ]);

          return {
            label: w.label,
            meta,
            ACL,
            website,
          };
        })
      );

      results.push(...batchResults);
    }

    return results;
  };
  const getDailyDataFromAPI = async () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));

      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      return { date, start, end };
    });

    const results = [];
    const BATCH_SIZE = 2; // 🔥 tune this (2 or 3 best)

    for (let i = 0; i < days.length; i += BATCH_SIZE) {
      const batch = days.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(
        batch.map(async (d) => {
          const [meta, ACL, website] = await Promise.all([
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [d.start.toISOString(), d.end.toISOString()],
              },
              { type: "like", attribute: "cSubSource", value: "%meta%" },
            ]),
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [d.start.toISOString(), d.end.toISOString()],
              },
              { type: "in", attribute: "source", value: ["ACL"] },
            ]),
            fetchLeadsCount([
              {
                type: "between",
                attribute: "createdAt",
                value: [d.start.toISOString(), d.end.toISOString()],
              },
              { type: "in", attribute: "source", value: ["Web Site"] },
            ]),
          ]);

          return {
            label: d.date.toLocaleDateString("en-IN", { weekday: "short" }),
            meta,
            ACL,
            website,
          };
        })
      );

      results.push(...batchResults);
    }

    return results;
  };
  useEffect(() => {
    if (viewType !== "monthly") return;

    setLoadingMonthly(true);

    getMonthlyDataFromAPI()
      .then(setMonthlyData)
      .finally(() => setLoadingMonthly(false));
  }, [viewType]);
  useEffect(() => {
    if (viewType !== "weekly") return;

    setLoadingWeekly(true);

    getWeeklyDataFromAPI()
      .then(setWeeklyData)
      .finally(() => setLoadingWeekly(false));
  }, [viewType]);
  useEffect(() => {
    if (viewType !== "daily") return;

    setLoadingDaily(true);

    getDailyDataFromAPI()
      .then(setDailyData)
      .finally(() => setLoadingDaily(false));
  }, [viewType]);


  const chartData = (() => {
    switch (viewType) {
      case "weekly":
        return weeklyData;
      case "daily":
        return dailyData;
      default:
        return monthlyData;
    }
  })();

  const metaTotal = chartData.reduce((sum, item) => sum + item.meta, 0);
  const ACLTotal = chartData.reduce((sum, item) => sum + item.ACL, 0);
  const websiteTotal = chartData.reduce((sum, item) => sum + item.website, 0);
  const Total = metaTotal + ACLTotal + websiteTotal;
  const isLoading =
    (viewType === "monthly" && loadingMonthly) ||
    (viewType === "weekly" && loadingWeekly) ||
    (viewType === "daily" && loadingDaily);

  const getCurrentMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };
  const dynamicTitle = `${getCurrentMonthName()} leads generated by Source `;
  return (
    <motion.div
      className="bg-card border border-border rounded-xl p-6 shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Lead Source Performance
          </h3>

          <p className="text-sm text-muted-foreground">
            {viewType === "monthly"
              ? "Monthly leads generated by Source"
              : dynamicTitle}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {["monthly", "weekly", "daily"].map((type) => (
            <Button
              key={type}
              size="sm"
              variant={viewType === type ? "default" : "outline"}
              onClick={() => setViewType(type)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>
      </div>
      <div
        className="h-80"
        aria-label="Monthly Lead Source Performance Bar Chart"
      >
        {
          isLoading ? (
            <div className="w-full h-full relative px-6 pb-6">

              {/* Grid */}
              <div className="absolute inset-0 grid grid-cols-12 grid-rows-4">
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-gray-300/40" />
                ))}
              </div>

              {/* Lines */}
              <div className="absolute inset-0 flex flex-col justify-end pb-6">

                {[
                  [220, 260, 190, 240, 230, 20, 220, 100, 0, 20, 20, 160], // meta
                  [180, 280, 200, 210, 150, 0, 120, 40, 0, 110, 120, 110], // ivr
                  [120, 140, 210, 130, 210, 0, 150, 80, 0, 140, 140, 0], // website
                ].map((heights, lineIndex) => (

                  <div key={lineIndex} className="absolute inset-0 flex items-end justify-between px-2">

                    {heights.map((h, i) => (
                      <div key={i} className="relative flex items-center w-full">

                        {/* Dot */}
                        <motion.div
                          className="w-2 h-2 bg-gray-400/70 rounded-full z-10"
                          style={{ transform: `translateY(-${h}px)` }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 + lineIndex * 0.2 }}
                        />

                        {/* Horizontal line */}
                        {i !== heights.length - 1 && (
                          <motion.div
                            className="flex-1 h-[2px] bg-gray-300/60"
                            style={{
                              transform: `translateY(-${h}px)`
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: 0.4,
                              delay: i * 0.05 + lineIndex * 0.2,
                            }}
                          >
                            {/* shimmer */}
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                              animate={{ x: ["-100%", "100%"] }}
                              transition={{
                                repeat: Infinity,
                                duration: 1.2,
                                ease: "linear",
                              }}
                            />
                          </motion.div>
                        )}

                      </div>
                    ))}

                  </div>
                ))}

              </div>

              {/* X labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-3 w-6 bg-gray-300/60 rounded animate-pulse" />
                ))}
              </div>

              {/* Axis line */}
              <div className="absolute bottom-6 left-0 right-0 h-[1px] bg-gray-300/50" />
            </div>
          ) : (<ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={
                isMobile
                  ? { top: 20, right: 0, left: -20, bottom: 5 }
                  : { top: 20, right: 30, left: 20, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />

              <XAxis dataKey="label" stroke="#888" fontSize={12} />

              <YAxis
                stroke="#888"
                fontSize={12}
                width={35}
                allowDecimals={false}
                domain={[0, "dataMax + 1"]}
              />

              <Tooltip content={<CustomTooltip />} />

              <Legend />

              {/* Main Leads Line */}
              <Line
                type="monotone"
                dataKey="meta"
                stroke="#1877F2"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="ACL"
                name="Aajneeti"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ r: 4 }}
              />

              <Line
                type="monotone"
                dataKey="website"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>)
        }

      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-6 overflow-x-auto no-scrollbar sm:justify-center text-sm px-2">
          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#1877F2]" />
            <span>Meta: {metaTotal}</span>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
            <span>Aajneeti: {ACLTotal}</span>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
            <span>Website: {websiteTotal}</span>
          </div>

          <div className="flex items-center gap-2 font-semibold min-w-max">
            <Icon name="Target" size={16} />
            <span>Total: {Total}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MultiLineChart;

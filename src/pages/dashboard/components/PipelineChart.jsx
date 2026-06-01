import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { fetchLeadsCount } from "services/leads.service";

const PipelineChart = ({ leads = [] }) => {
  // const [selectedYear, setSelectedYear] = useState(2024);
  const [monthlyData, setMonthlyData] = useState({});
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [dailyData, setDailyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [viewType, setViewType] = useState("monthly");
  const now = new Date();
  const currentYearLeads = leads.filter((l) => {
    const d = new Date(l.createdAt);
    return (
      d.getFullYear() === now.getFullYear()
    );
  }).length;

  const currentYear = new Date().getFullYear();
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload?.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-elevation-2">
          <p className="font-medium text-popover-foreground mb-2">
            {label} {currentYear}
          </p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-popover-foreground">
                {payload?.[0]?.value} leads
              </span>
            </div>

          </div>
        </div>
      );
    }
    return null;
  };
  // get monthly data
  useEffect(() => {
    if (viewType !== "monthly") return;

    if (!Object.keys(monthlyData).length) {
      setLoadingMonthly(true);
      getMonthlyDataFromAPI().finally(() => setLoadingMonthly(false));
    }
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
  // const getMonthlyData = () => {
  //   const months = [
  //     "Jan",
  //     "Feb",
  //     "Mar",
  //     "Apr",
  //     "May",
  //     "Jun",
  //     "Jul",
  //     "Aug",
  //     "Sep",
  //     "Oct",
  //     "Nov",
  //     "Dec",
  //   ];
  //   const year = new Date().getFullYear();

  //   return months.map((m, index) => ({
  //     label: m,
  //     value: leads.filter((l) => {
  //       const d = new Date(l.createdAt);
  //       return d.getFullYear() === year && d.getMonth() === index;
  //     }).length,
  //   }));
  // };
  const getMonthlyDataFromAPI = async () => {
    const year = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const newData = { ...monthlyData };
    const calls = [];

    for (let i = 0; i < 12; i++) {
      const start = new Date(year, i, 1);
      const end = new Date(year, i + 1, 0);
      end.setHours(23, 59, 59, 999);

      // 🔥 If future month → just set 0 (NO API CALL)
      if (i > currentMonth) {
        if (!newData[i]) {
          newData[i] = {
            label: start.toLocaleString("default", { month: "short" }),
            value: 0,
          };
        }
        continue;
      }

      // 🔥 Past / current month → fetch if not cached
      if (!newData[i]) {
        calls.push(
          fetchLeadsCount([
            {
              type: "between",
              attribute: "createdAt",
              value: [start.toISOString(), end.toISOString()],
            },
          ]).then((count) => {
            newData[i] = {
              label: start.toLocaleString("default", { month: "short" }),
              value: count,
            };
          })
        );
      }
    }

    await Promise.all(calls);

    setMonthlyData(newData);
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

    const results = await Promise.all(
      weeks.map(async (w) => {
        const start = new Date(year, month, w.start);
        start.setHours(0, 0, 0, 0);

        const end = new Date(year, month, w.end);
        end.setHours(23, 59, 59, 999);

        const count = await fetchLeadsCount([
          {
            type: "between",
            attribute: "createdAt",
            value: [start.toISOString(), end.toISOString()],
          },
        ]);

        return {
          label: w.label,
          value: count,
        };
      })
    );

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

      return {
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        start,
        end,
      };
    });

    const results = await Promise.all(
      days.map(async (d) => {
        const count = await fetchLeadsCount([
          {
            type: "between",
            attribute: "createdAt",
            value: [d.start.toISOString(), d.end.toISOString()],
          },
        ]);

        return {
          label: d.label,
          value: count,
        };
      })
    );

    return results;
  };

  const chartData = (() => {
    switch (viewType) {
      case "weekly":
        return weeklyData;
      case "daily":
        return dailyData;
      default:
        return Object.values(monthlyData); // ✅ API DATA
    }
  })();
  const totalLeads = (chartData || []).reduce(
    (sum, item) => sum + (item?.value || 0),
    0
  );
  const isLoading =
    (viewType === "monthly" &&
      (loadingMonthly || !Object.keys(monthlyData).length)) ||
    (viewType === "weekly" &&
      (loadingWeekly || !weeklyData.length)) ||
    (viewType === "daily" &&
      (loadingDaily || !dailyData.length));
  const skeletonCount =
    viewType === "monthly" ? 12 :
      viewType === "weekly" ? 5 : 7;

  // 
  const getCurrentMonthName = () => {
    return new Date().toLocaleString("default", { month: "long" });
  };
  const dynamicTitle = `${getCurrentMonthName()} leads closed and leads generated`;

  return (
    <motion.div
      className=" bg-card border border-border rounded-xl p-6  shadow-elevation-1"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Leads Performance
          </h3>
          <p className="text-sm text-muted-foreground">
            {viewType === "monthly"
              ? "Monthly leads closed and leads generated"
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
      <div className="h-[220px] sm:h-[300px] p-3 sm:p-5" aria-label="Monthly Leads Performance Bar Chart">
        {isLoading ? (

          // 🔥 Skeleton UI
          <div className="w-full h-full flex items-end justify-between px-2 sm:px-4 pb-4 relative">
            <div className="absolute bottom-4 left-0 right-0 h-[1px] bg-gray-300/60" />

            {Array.from({ length: skeletonCount }).map((_, i) => {
              const heights = [180, 160, 190, 170, 100, 150, 0, 180, 30, 0, 200, 80];

              return (
                <div key={i} className="flex flex-col items-center justify-end flex-1 gap-2">

                  <motion.div
                    className="w-3 sm:w-5 md:w-6 rounded-md bg-gray-300/60 relative overflow-hidden"
                    style={{ height: `${heights[i] || 40}px` }}
                  >
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

                  <div className="h-2 w-4 sm:w-6 bg-gray-300/60 rounded animate-pulse" />
                </div>
              );
            })}
          </div>

        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                dataKey="label"
                stroke="var(--color-muted-foreground)"
                fontSize={12}
              />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex items-center justify-center space-x-6 mt-4 pt-4 border-t border-border">

        <div className="flex items-center space-x-2">
          <Icon name="Target" size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Leads : {loadingMonthly ? "..." : totalLeads} / Leads
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PipelineChart;

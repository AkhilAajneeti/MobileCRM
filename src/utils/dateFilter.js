export const DATE_FILTER_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Last 7 Days", value: "lastSevenDays" },
  { label: "Current Month", value: "currentMonth" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Current Quarter", value: "currentQuarter" },
  { label: "Last Quarter", value: "lastQuarter" },
  { label: "Current Year", value: "currentYear" },
  { label: "Last Year", value: "lastYear" },
  { label: "Past", value: "past" },
  { label: "Future", value: "future" },
  { label: "Ever", value: "ever" },
  { label: "Is Empty", value: "isEmpty" },
  { label: "On", value: "on" },
  { label: "Before", value: "before" },
  { label: "After", value: "after" },
  { label: "Between", value: "between" },
  { label: "Last X Days", value: "lastXDays" },
];

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export const matchesDateFilter = (rawDate, filters) => {
  const type = filters?.dateType;
  if (!type) return true;
  if (type === "ever") return true;
  if (type === "isEmpty") return !rawDate;
  if (!rawDate) return false;

  const date = new Date(rawDate);
  if (isNaN(date.getTime())) return false;

  const now = new Date();

  switch (type) {
    case "today":
      return date >= startOfDay(now) && date <= endOfDay(now);
    case "lastSevenDays": {
      const from = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      return date >= from && date <= endOfDay(now);
    }
    case "currentMonth":
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    case "lastMonth": {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return date.getMonth() === lm.getMonth() && date.getFullYear() === lm.getFullYear();
    }
    case "currentQuarter": {
      const q = Math.floor(now.getMonth() / 3);
      const dq = Math.floor(date.getMonth() / 3);
      return q === dq && date.getFullYear() === now.getFullYear();
    }
    case "lastQuarter": {
      const q = Math.floor(now.getMonth() / 3);
      const dq = Math.floor(date.getMonth() / 3);
      const lqYear = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const lqQ = q === 0 ? 3 : q - 1;
      return dq === lqQ && date.getFullYear() === lqYear;
    }
    case "currentYear":
      return date.getFullYear() === now.getFullYear();
    case "lastYear":
      return date.getFullYear() === now.getFullYear() - 1;
    case "past":
      return date < startOfDay(now);
    case "future":
      return date > endOfDay(now);
    case "on": {
      if (!filters.dateFrom) return true;
      const t = new Date(filters.dateFrom);
      return date >= startOfDay(t) && date <= endOfDay(t);
    }
    case "before":
      if (!filters.dateFrom) return true;
      return date < startOfDay(new Date(filters.dateFrom));
    case "after":
      if (!filters.dateFrom) return true;
      return date > endOfDay(new Date(filters.dateFrom));
    case "between": {
      if (!filters.dateFrom || !filters.dateTo) return true;
      return (
        date >= startOfDay(new Date(filters.dateFrom)) &&
        date <= endOfDay(new Date(filters.dateTo))
      );
    }
    case "lastXDays": {
      const days = parseInt(filters.xDays, 10);
      if (isNaN(days) || days <= 0) return true;
      const from = startOfDay(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
      return date >= from && date <= endOfDay(now);
    }
    default:
      return true;
  }
};

/**
 * Pipeline module constants.
 *
 * Single source of truth for categories, column config, urgency styling,
 * classification thresholds and summary-card config. Keeping every Tailwind
 * class string fully static here ensures the JIT compiler can see them.
 */

// Smart, action-based pipeline categories (kanban columns)
export const PIPELINE_CATEGORIES = {
  OVERDUE: "overdue",
  DUE_TODAY: "due_today",
  UPCOMING: "upcoming",
  ACTIVE: "active",
  BUDGET_ISSUE: "budget_issue",
  STALE: "stale",
};

// Classification thresholds (days)
export const UPCOMING_WINDOW_DAYS = 7; // next contact within 7 days
export const ACTIVE_ACTIVITY_DAYS = 14; // activity within last 14 days
export const STALE_MIN_DAYS = 14; // no activity for 14-30+ days

// Status keywords that flag a budget / payment / document blocker
export const BUDGET_ISSUE_KEYWORDS = [
  "budget",
  "payment",
  "document",
  "finance",
  "pricing",
  "low budget",
];

// Lead statuses that should never appear on the action pipeline
export const EXCLUDED_STATUSES = [
  "converted",
  "dead",
  "recycled",
  "won",
  "lost",
  "closed",
];

// Urgency styling keyed by category. Whole strings only (Tailwind-safe).
export const URGENCY_STYLES = {
  [PIPELINE_CATEGORIES.OVERDUE]: {
    label: "Overdue",
    card: "border-l-4 border-l-red-500 bg-red-50/40",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    text: "text-red-600",
    columnHeader: "bg-red-100 text-red-800 border-red-200",
    iconBg: "bg-red-100 text-red-600",
    cardBg: "bg-red-50",
  },
  [PIPELINE_CATEGORIES.DUE_TODAY]: {
    label: "Due Today",
    card: "border-l-4 border-l-orange-500 bg-orange-50/40",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    text: "text-orange-600",
    columnHeader: "bg-orange-100 text-orange-800 border-orange-200",
    iconBg: "bg-orange-100 text-orange-600",
    cardBg: "bg-orange-50",
  },
  [PIPELINE_CATEGORIES.UPCOMING]: {
    label: "Upcoming",
    card: "border-l-4 border-l-blue-500 bg-blue-50/40",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    text: "text-blue-600",
    columnHeader: "bg-blue-100 text-blue-800 border-blue-200",
    iconBg: "bg-blue-100 text-blue-600",
    cardBg: "bg-blue-50",
  },
  [PIPELINE_CATEGORIES.ACTIVE]: {
    label: "Active",
    card: "border-l-4 border-l-green-500 bg-green-50/40",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    text: "text-green-600",
    columnHeader: "bg-green-100 text-green-800 border-green-200",
    iconBg: "bg-green-100 text-green-600",
    cardBg: "bg-green-50",
  },
  [PIPELINE_CATEGORIES.BUDGET_ISSUE]: {
    label: "Budget Issue",
    card: "border-l-4 border-l-amber-500 bg-amber-50/40",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
    text: "text-amber-600",
    columnHeader: "bg-amber-100 text-amber-800 border-amber-200",
    iconBg: "bg-amber-100 text-amber-600",
    cardBg: "bg-amber-50",
  },
  [PIPELINE_CATEGORIES.STALE]: {
    label: "Stale",
    card: "border-l-4 border-l-gray-400 bg-gray-50/40",
    badge: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
    text: "text-gray-500",
    columnHeader: "bg-gray-100 text-gray-700 border-gray-200",
    iconBg: "bg-gray-100 text-gray-600",
    cardBg: "bg-gray-50",
  },
};

// Kanban column definitions, rendered in this order.
export const PIPELINE_COLUMNS = [
  {
    id: PIPELINE_CATEGORIES.OVERDUE,
    name: "Overdue",
    description: "Follow-up date has passed",
    icon: "AlertCircle",
  },
  {
    id: PIPELINE_CATEGORIES.DUE_TODAY,
    name: "Due Today",
    description: "Follow-up scheduled for today",
    icon: "CalendarClock",
  },
  {
    id: PIPELINE_CATEGORIES.UPCOMING,
    name: "Upcoming",
    description: "Follow-up within the next 7 days",
    icon: "CalendarDays",
  },
  {
    id: PIPELINE_CATEGORIES.ACTIVE,
    name: "Active Leads",
    description: "Activity within the last 14 days",
    icon: "Activity",
  },
  {
    id: PIPELINE_CATEGORIES.BUDGET_ISSUE,
    name: "Budget Issue",
    description: "Budget, payment or document blocker",
    icon: "Wallet",
  },
  {
    id: PIPELINE_CATEGORIES.STALE,
    name: "Stale",
    description: "No activity for 14-30+ days",
    icon: "Archive",
  },
];

// Top summary cards. `category` maps each card to a computed stat count.
export const STAT_CARDS = [
  {
    key: "dueToday",
    title: "Due Today",
    icon: "CalendarClock",
    category: PIPELINE_CATEGORIES.DUE_TODAY,
    color: "bg-orange-100 text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    key: "upcoming",
    title: "Upcoming",
    icon: "CalendarDays",
    category: PIPELINE_CATEGORIES.UPCOMING,
    color: "bg-blue-100 text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    key: "overdue",
    title: "Overdue",
    icon: "AlertCircle",
    category: PIPELINE_CATEGORIES.OVERDUE,
    color: "bg-red-100 text-red-600",
    bgColor: "bg-red-50",
  },
  {
    key: "active",
    title: "Active Leads",
    icon: "Activity",
    category: PIPELINE_CATEGORIES.ACTIVE,
    color: "bg-green-100 text-green-600",
    bgColor: "bg-green-50",
  },
  {
    key: "stale",
    title: "Stale Leads",
    icon: "Archive",
    category: PIPELINE_CATEGORIES.STALE,
    color: "bg-gray-100 text-gray-600",
    bgColor: "bg-gray-50",
  },
  {
    key: "budgetIssue",
    title: "Budget Issue",
    icon: "Wallet",
    category: PIPELINE_CATEGORIES.BUDGET_ISSUE,
    color: "bg-amber-100 text-amber-600",
    bgColor: "bg-amber-50",
  },
];

// Categories that are purely derived from data and cannot be a drop target.
export const DERIVED_CATEGORIES = [
  PIPELINE_CATEGORIES.ACTIVE,
  PIPELINE_CATEGORIES.STALE,
  PIPELINE_CATEGORIES.BUDGET_ISSUE,
];

// Default filter shape used by the store and the filter bar.
export const DEFAULT_FILTERS = {
  search: "",
  owner: "all",
  status: "all",
  source: "all",
  priority: "all",
  category: "all",
};

// Priority options for the filter bar.
export const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

// React Query / service cache tuning.
export const PIPELINE_QUERY_KEY = "pipeline-leads";
export const PIPELINE_STALE_TIME = 1000 * 60 * 2; // 2 min
export const PIPELINE_GC_TIME = 1000 * 60 * 10; // 10 min
export const PIPELINE_CACHE_TTL = 1000 * 60 * 2; // service-level TTL
export const PIPELINE_PAGE_SIZE = 200; // leads fetched per pipeline page

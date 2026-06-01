/**
 * Pure pipeline logic: normalisation, classification, grouping, filtering and
 * stats. Components never run these calculations directly — hooks and the
 * service layer call into this file so everything stays testable and cheap.
 */
import {
  PIPELINE_CATEGORIES,
  PIPELINE_COLUMNS,
  URGENCY_STYLES,
  BUDGET_ISSUE_KEYWORDS,
  EXCLUDED_STATUSES,
  UPCOMING_WINDOW_DAYS,
  ACTIVE_ACTIVITY_DAYS,
  STALE_MIN_DAYS,
  DEFAULT_FILTERS,
} from "./pipelineConstants";
import {
  parseEspoDate,
  daysFromToday,
  daysSince,
  getRelativeDateLabel,
  getLastActivityLabel,
} from "./dateHelpers";

const {
  OVERDUE,
  DUE_TODAY,
  UPCOMING,
  ACTIVE,
  BUDGET_ISSUE,
  STALE,
} = PIPELINE_CATEGORIES;

/** Map a raw EspoCRM lead onto the flat shape the pipeline UI consumes. */
export const normalizeDeal = (lead = {}) => ({
  id: lead.id,
  title: lead.name || lead.firstName || "Untitled Lead",
  company: lead.accountName || lead.cCompany || lead.cProject || "",
  project: lead.cProject || lead.cProjectName || "",
  status: lead.status || "",
  source: lead.source || "",
  value: Number(lead.opportunityAmount || lead.cBudget || 0),
  priority: lead.cPriority || lead.priority || "",
  owner: {
    id: lead.assignedUserId || null,
    name: lead.assignedUserName || "Unassigned",
  },
  createdAt: lead.createdAt || null,
  nextContactDate: lead.cNextContactAt || lead.cNextContact || null,
  lastActivityAt: lead.modifiedAt || lead.createdAt || null,
  siteVisitAt: lead.cSiteVisitAt || null,
  raw: lead,
});

/** True when a lead should be hidden from the action pipeline entirely. */
export const isExcludedDeal = (deal) => {
  const status = (deal?.status || "").toLowerCase();
  if (deal?.isActive === false) return true;
  return EXCLUDED_STATUSES.some((s) => status === s || status.includes(s));
};

/** True when the lead's status flags a budget / payment / document blocker. */
export const isBudgetIssue = (deal) => {
  const status = (deal?.status || "").toLowerCase();
  if (!status) return false;
  return BUDGET_ISSUE_KEYWORDS.some((keyword) => status.includes(keyword));
};

/**
 * Classify a normalized deal into exactly one pipeline category.
 *
 * Priority order is deliberate:
 *  1. Budget Issue  - a status blocker needs its own action regardless of date
 *  2. Overdue       - missed follow-up, most urgent date bucket
 *  3. Due Today     - follow-up scheduled for today
 *  4. Upcoming      - follow-up within the next 7 days
 *  5. Active        - recent activity (<= 14 days) but no near-term follow-up
 *  6. Stale         - everything else (no signal / 14-30+ days quiet)
 */
export const classifyDeal = (deal) => {
  if (isBudgetIssue(deal)) return BUDGET_ISSUE;

  const nextDiff = daysFromToday(deal?.nextContactDate);
  if (nextDiff !== null) {
    if (nextDiff < 0) return OVERDUE;
    if (nextDiff === 0) return DUE_TODAY;
    if (nextDiff <= UPCOMING_WINDOW_DAYS) return UPCOMING;
  }

  const activityAge = daysSince(deal?.lastActivityAt);
  if (activityAge !== null && activityAge <= ACTIVE_ACTIVITY_DAYS) {
    return ACTIVE;
  }
  if (activityAge !== null && activityAge >= STALE_MIN_DAYS) {
    return STALE;
  }

  // No follow-up and no usable activity signal -> needs attention -> stale.
  return STALE;
};

/** Resolve a display priority, falling back to an urgency-derived value. */
export const getDealPriority = (deal) => {
  if (deal?.priority) return deal.priority;
  switch (deal?.category) {
    case OVERDUE:
    case DUE_TODAY:
      return "High";
    case UPCOMING:
    case BUDGET_ISSUE:
      return "Medium";
    default:
      return "Low";
  }
};

/** Attach category, urgency styling and relative labels to a normalized deal. */
export const enrichDeal = (deal) => {
  const category = classifyDeal(deal);
  const enriched = {
    ...deal,
    category,
    urgency: URGENCY_STYLES[category],
    nextContactLabel: getRelativeDateLabel(deal.nextContactDate),
    lastActivityLabel: getLastActivityLabel(deal.lastActivityAt),
    daysUntilContact: daysFromToday(deal.nextContactDate),
    daysSinceActivity: daysSince(deal.lastActivityAt),
  };
  enriched.priority = getDealPriority(enriched);
  return enriched;
};

/** Raw EspoCRM leads -> normalized, enriched, pipeline-eligible deals. */
export const buildPipelineDeals = (rawLeads = []) =>
  rawLeads
    .map(normalizeDeal)
    .filter((deal) => deal.id && !isExcludedDeal(deal))
    .map(enrichDeal);

/** Sort comparator per category so the most actionable deals float to the top. */
const sortDealsForCategory = (deals, categoryId) => {
  const sorted = [...deals];
  switch (categoryId) {
    case OVERDUE:
    case DUE_TODAY:
    case UPCOMING:
      // Soonest / most overdue first.
      sorted.sort(
        (a, b) =>
          (a.daysUntilContact ?? Infinity) - (b.daysUntilContact ?? Infinity),
      );
      break;
    case ACTIVE:
      // Most recently touched first.
      sorted.sort(
        (a, b) => (a.daysSinceActivity ?? Infinity) - (b.daysSinceActivity ?? Infinity),
      );
      break;
    case STALE:
      // Quietest first - they need rescuing.
      sorted.sort(
        (a, b) => (b.daysSinceActivity ?? 0) - (a.daysSinceActivity ?? 0),
      );
      break;
    case BUDGET_ISSUE:
      // Highest value blockers first.
      sorted.sort((a, b) => (b.value || 0) - (a.value || 0));
      break;
    default:
      break;
  }
  return sorted;
};

/** Group enriched deals into the kanban column buckets, each pre-sorted. */
export const groupDealsByCategory = (deals = []) => {
  const groups = {};
  PIPELINE_COLUMNS.forEach((column) => {
    groups[column.id] = [];
  });

  deals.forEach((deal) => {
    const bucket = groups[deal.category] ? deal.category : STALE;
    groups[bucket].push(deal);
  });

  PIPELINE_COLUMNS.forEach((column) => {
    groups[column.id] = sortDealsForCategory(groups[column.id], column.id);
  });

  return groups;
};

/** Apply the in-memory filter bar selections to a list of enriched deals. */
export const applyFilters = (deals = [], filters = DEFAULT_FILTERS) => {
  if (!filters) return deals;
  const search = (filters.search || "").trim().toLowerCase();

  return deals.filter((deal) => {
    if (search) {
      const haystack = `${deal.title} ${deal.company} ${deal.project} ${
        deal.owner?.name || ""
      }`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (
      filters.owner &&
      filters.owner !== "all" &&
      deal.owner?.id !== filters.owner
    ) {
      return false;
    }
    if (
      filters.status &&
      filters.status !== "all" &&
      deal.status !== filters.status
    ) {
      return false;
    }
    if (
      filters.source &&
      filters.source !== "all" &&
      deal.source !== filters.source
    ) {
      return false;
    }
    if (
      filters.priority &&
      filters.priority !== "all" &&
      deal.priority !== filters.priority
    ) {
      return false;
    }
    if (
      filters.category &&
      filters.category !== "all" &&
      deal.category !== filters.category
    ) {
      return false;
    }
    return true;
  });
};

/** Count how many filters differ from their defaults. */
export const countActiveFilters = (filters = DEFAULT_FILTERS) =>
  Object.keys(DEFAULT_FILTERS).reduce((count, key) => {
    const value = filters?.[key];
    const isDefault =
      value === DEFAULT_FILTERS[key] ||
      value === undefined ||
      value === null ||
      value === "";
    return isDefault ? count : count + 1;
  }, 0);

/** Summary counts + totals for the stat cards and the login banner. */
export const computeStats = (deals = []) => {
  const stats = {
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    active: 0,
    stale: 0,
    budgetIssue: 0,
    total: deals.length,
    totalValue: 0,
  };

  const categoryToKey = {
    [OVERDUE]: "overdue",
    [DUE_TODAY]: "dueToday",
    [UPCOMING]: "upcoming",
    [ACTIVE]: "active",
    [STALE]: "stale",
    [BUDGET_ISSUE]: "budgetIssue",
  };

  deals.forEach((deal) => {
    const key = categoryToKey[deal.category];
    if (key) stats[key] += 1;
    stats.totalValue += deal.value || 0;
  });

  return stats;
};

/** Distinct, sorted option list for a given deal field (for the filter bar). */
export const getDistinctOptions = (deals = [], field) => {
  const seen = new Set();
  deals.forEach((deal) => {
    const value = deal?.[field];
    if (value) seen.add(value);
  });
  return Array.from(seen)
    .sort((a, b) => String(a).localeCompare(String(b)))
    .map((value) => ({ value, label: value }));
};

/** Currency formatter shared by cards and columns. */
export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export { parseEspoDate };

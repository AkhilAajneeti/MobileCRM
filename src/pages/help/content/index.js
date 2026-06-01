/**
 * Help Center content registry.
 *
 * Articles are plain JS objects rendered generically by ArticleView. Adding
 * a new article = write a new entry in the relevant category file and it
 * appears in the sidebar, search, and related guides — no UI changes needed.
 *
 * Article shape:
 *   {
 *     id, title, description, tags?: string[],
 *     sections: Array<Section>,
 *     related?: string[]  // ids of related articles
 *   }
 *
 * Section types:
 *   { type: "paragraph", body }
 *   { type: "heading", text }
 *   { type: "bullets", items: [...] }
 *   { type: "steps", items: [...] }
 *   { type: "note", variant: "info"|"success"|"warning"|"tip", title?, body }
 *   { type: "screenshot", label, alt? }
 *   { type: "accordion", items: [{ q, a }] }
 */
import gettingStarted from "./gettingStarted";
import leads from "./leads";
import meetings from "./meetings";
import tasks from "./tasks";
import reports from "./reports";
import permissions from "./permissions";
import faq from "./faq";
import whatsNew from "./whatsNew";

// Categories — order here drives the sidebar order.
export const CATEGORIES = [
  {
    id: "whats-new",
    name: "What's New",
    icon: "Rocket",
    accent: "rose",
    description: "Recent updates, in plain language, with the date they shipped.",
    articles: whatsNew,
  },
  {
    id: "getting-started",
    name: "Getting Started",
    icon: "Sparkles",
    accent: "violet",
    description: "First steps to set yourself up in the CRM.",
    articles: gettingStarted,
  },
  {
    id: "leads",
    name: "Leads",
    icon: "Users",
    accent: "indigo",
    description: "Capture, qualify and move leads through your pipeline.",
    articles: leads,
  },
  {
    id: "meetings",
    name: "Meetings",
    icon: "Calendar",
    accent: "blue",
    description: "Schedule, reschedule and track sales meetings.",
    articles: meetings,
  },
  {
    id: "tasks",
    name: "Tasks",
    icon: "ListChecks",
    accent: "cyan",
    description: "Create follow-ups and reminders that never slip.",
    articles: tasks,
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    icon: "BarChart3",
    accent: "emerald",
    description: "Read your dashboards and understand the numbers.",
    articles: reports,
  },
  {
    id: "permissions",
    name: "Permissions",
    icon: "Shield",
    accent: "amber",
    description: "Who can see and change what — explained simply.",
    articles: permissions,
  },
  {
    id: "faq",
    name: "FAQ",
    icon: "HelpCircle",
    accent: "rose",
    description: "Quick answers to the questions we get the most.",
    articles: faq,
  },
];

export const getCategory = (id) =>
  CATEGORIES.find((c) => c.id === id) || null;

export const getArticle = (categoryId, articleId) => {
  const cat = getCategory(categoryId);
  if (!cat) return null;
  return cat.articles.find((a) => a.id === articleId) || null;
};

// Flat list — useful for search and "related".
export const ALL_ARTICLES = CATEGORIES.flatMap((c) =>
  c.articles.map((a) => ({
    ...a,
    categoryId: c.id,
    categoryName: c.name,
    accent: c.accent,
  })),
);

const haystack = (a) =>
  [
    a.title,
    a.description || "",
    (a.tags || []).join(" "),
    a.categoryName,
  ]
    .join(" ")
    .toLowerCase();

/**
 * Tiny client-side search. Splits the query into tokens and keeps articles
 * that contain every token somewhere in title / description / tags / category.
 */
export const searchArticles = (query) => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  return ALL_ARTICLES.filter((a) => {
    const text = haystack(a);
    return tokens.every((t) => text.includes(t));
  }).slice(0, 12);
};

// Popular guides for the help home — cherry-picked across categories.
export const POPULAR_GUIDES = [
  "getting-started:first-login",
  "leads:creating-a-lead",
  "leads:lead-statuses-explained",
  "meetings:scheduling-a-meeting",
  "reports:reading-the-win-rate",
  "faq:why-cant-i-see-some-leads",
];

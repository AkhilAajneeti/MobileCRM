// "What's New" — short, friendly write-ups of each recent update.
// Each article carries a `lastUpdated` ISO date that the article view renders
// as a small "Updated DD MMM YYYY" badge under the title. Add new articles to
// the top of this array as new features ship.

const articles = [
  {
    id: "dashboard-today-alert",
    title: "Your daily to-do, the moment you log in",
    description:
      "The dashboard now greets you with a list of overdue and follow-up-today leads.",
    tags: ["dashboard", "alert", "notification", "today", "overdue"],
    lastUpdated: "2026-05-17",
    sections: [
      {
        type: "paragraph",
        body:
          "When you open the dashboard after logging in, a soft banner pops up with everything that needs you today. No more digging through filters to find what's urgent.",
      },
      {
        type: "heading",
        text: "What you'll see",
      },
      {
        type: "bullets",
        items: [
          "A count of overdue leads (in red).",
          "A count of follow-ups due today (in orange).",
          "A clickable list of each urgent lead, newest at the top.",
          "A soft chime, just once, so you notice without it being annoying.",
        ],
      },
      {
        type: "heading",
        text: "Using it",
      },
      {
        type: "steps",
        items: [
          "Click any lead in the list to jump straight to it — the lead drawer opens automatically.",
          "Click the small View pipeline pill (top right) to open the full pipeline board.",
          "Click the X (top right) to dismiss the alert for this session.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        title: "Comes back on next login",
        body:
          "Dismissing the alert only hides it for this session. The next time you log in, it appears again if there are still pending overdue or follow-up-today leads.",
      },
      {
        type: "note",
        variant: "info",
        body:
          "Sound only plays once per session — even if you navigate away and come back to the dashboard, the alert stays visible silently.",
      },
    ],
    related: ["notification-panel-update", "filter-leads-by-team"],
  },

  {
    id: "notification-panel-update",
    title: "Notifications: easier to navigate, friendlier on mobile",
    description:
      "The bell icon's panel now paginates 5 at a time and fits properly on phones.",
    tags: ["notifications", "bell", "pagination", "mobile"],
    lastUpdated: "2026-05-17",
    sections: [
      {
        type: "paragraph",
        body:
          "If you have a lot of activity, scrolling through dozens of notifications gets tiring. The panel now shows five at a time with Prev / Next buttons.",
      },
      {
        type: "heading",
        text: "Pagination",
      },
      {
        type: "bullets",
        items: [
          "Each page shows 5 notifications.",
          "A small footer says “Page X of Y”.",
          "Use Prev / Next to flip through. Prev is disabled on page 1, Next on the last page.",
          "Switching between All and Unread tabs jumps you back to page 1.",
        ],
      },
      {
        type: "heading",
        text: "Mobile fixes",
      },
      {
        type: "bullets",
        items: [
          "The panel now resizes to fit any phone screen — no more clipping on the left.",
          "The title and filter buttons stack on narrow screens instead of overlapping.",
          "The Prev / Page X of Y / Next row also fits comfortably on mobile.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "Sound and the 'mark all read' button work exactly like before. Only the layout and paging changed.",
      },
    ],
    related: ["dashboard-today-alert"],
  },

  {
    id: "filter-leads-by-team",
    title: "Filter leads by team",
    description:
      "Pick a team in the Deals filter bar — the table, charts, and project breakdown all narrow at once.",
    tags: ["filter", "team", "leads", "deals"],
    lastUpdated: "2026-05-17",
    sections: [
      {
        type: "paragraph",
        body:
          "A new Team dropdown sits in the leads filter bar, next to Assign User. Choose a team and only that team's leads show.",
      },
      {
        type: "steps",
        items: [
          "Open the Leads page.",
          "Find the new Team dropdown in the filter bar.",
          "Pick a team. The leads table refreshes immediately.",
          "Open the Lead Analytics section — the Project Distribution and Leads-by-User charts now show only that team's data.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        title: "Combine filters freely",
        body:
          "Team works alongside every other filter (status, source, date, assigned user). For example: 'Last 7 days' + 'Team North' + 'Interested' = exactly the slice you want.",
      },
      {
        type: "note",
        variant: "info",
        title: "How team membership works",
        body:
          "The CRM links each lead to its assigned user, and each user to one or more teams. The filter resolves the chain for you — you don't need to manually maintain team-to-lead links.",
      },
    ],
    related: ["project-team-distribution", "leads:filtering-leads"],
  },

  {
    id: "project-team-distribution",
    title: "Project Distribution chart now switches to Teams",
    description:
      "Same donut, two views — split by project or split by team with one click.",
    tags: ["project", "team", "distribution", "chart", "donut"],
    lastUpdated: "2026-05-17",
    sections: [
      {
        type: "paragraph",
        body:
          "The Project Distribution donut on the Leads page got a small but useful tab: Projects or Teams. The data, filters, and look all stay the same — only the way leads are grouped changes.",
      },
      {
        type: "heading",
        text: "How to use it",
      },
      {
        type: "steps",
        items: [
          "Open the Leads page and turn on Analytics.",
          "Find the Project Distribution card.",
          "Click the Teams tab in the top-right of the card.",
          "The donut re-groups by team. The legend, top-N + Others, and tooltip all keep working the same way.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        title: "No extra loading",
        body:
          "Switching between Projects and Teams is instant — no new network call. The chart re-groups the same data on the fly.",
      },
    ],
    related: ["filter-leads-by-team", "reports:reading-the-funnel"],
  },

  {
    id: "sales-funnel-radar",
    title: "Sales Funnel now reads as a radar",
    description:
      "Easier to see where leads concentrate across pipeline stages.",
    tags: ["funnel", "radar", "chart", "reports"],
    lastUpdated: "2026-05-17",
    sections: [
      {
        type: "paragraph",
        body:
          "On the Reports page, the Sales Funnel chart switched from a stacked-bar funnel to a radar (spider) chart. Same data, easier read.",
      },
      {
        type: "bullets",
        items: [
          "Each pipeline stage is a point on the radar.",
          "The shape shows at a glance which stage is fat (lots of leads) and which is thin.",
          "Hover any point to see leads, % of top stage, and drop-off vs the previous stage.",
          "Stage colors are kept consistent with the rest of the app.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "KPI tiles, highlight cards (Best conversion / Highest drop), and the rep insights on the right are unchanged.",
      },
    ],
    related: ["reports:reading-the-funnel"],
  },
];

export default articles;

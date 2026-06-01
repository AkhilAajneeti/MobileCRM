const articles = [
  {
    id: "reading-the-win-rate",
    title: "Reading the Win Rate chart",
    description: "How the % is calculated and what 'best month' really means.",
    tags: ["win rate", "conversion", "report"],
    sections: [
      {
        type: "heading",
        text: "The formula",
      },
      {
        type: "paragraph",
        body:
          "Win rate = Won ÷ (Won + Lost) × 100. Active leads are NOT in the denominator — only closed deals (won or lost) count.",
      },
      {
        type: "bullets",
        items: [
          "Won = leads in status Purchased.",
          "Lost = leads in any of the lost statuses (Dead, Not Interested, Call Not Picked, …).",
          "Active = everything still in play — Follow up, Interested, Site Visit Scheduled, etc. These don't move the rate yet.",
        ],
      },
      {
        type: "note",
        variant: "info",
        title: "Why win rates look low in recent months",
        body:
          "In a recent month, most leads are still in Active. Until they convert or die, they don't affect the rate. Older months show 'matured' rates.",
      },
      {
        type: "heading",
        text: "Best Month",
      },
      {
        type: "paragraph",
        body:
          "Best Month = the month with the highest win rate among months that had at least one closed deal. Months with zero closed deals are skipped.",
      },
    ],
    related: ["reading-the-funnel", "faq:why-cant-i-see-some-leads"],
  },
  {
    id: "reading-the-funnel",
    title: "Reading the Sales Funnel",
    description: "Stages, drop-off and the per-rep cards.",
    tags: ["funnel", "pipeline", "conversion"],
    sections: [
      {
        type: "paragraph",
        body:
          "The funnel shows how many leads currently sit in each pipeline stage — a snapshot, not a flow over time.",
      },
      {
        type: "bullets",
        items: [
          "Stages: New → Follow up → Interested → Site Visit Scheduled → Site Visit Done → Purchased.",
          "Drop-off — how many leads from the previous stage didn't make it here.",
          "Highest drop — biggest leak in your funnel; fix that first.",
        ],
      },
      {
        type: "heading",
        text: "Per-rep cards (right side)",
      },
      {
        type: "bullets",
        items: [
          "Total leads, Purchased and Active — for the selected month.",
          "Tiny chart — last 8 weeks of activity (leads created).",
          "Growth arrow — recent 4 weeks compared to the previous 4 weeks.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        body:
          "Use the This Month / Last Month toggle in the chart header to compare two periods quickly.",
      },
    ],
    related: ["reading-the-win-rate"],
  },
  {
    id: "filtering-reports",
    title: "Filtering reports",
    description: "What filters affect which chart.",
    tags: ["filter", "report"],
    sections: [
      {
        type: "paragraph",
        body:
          "The Reports page has three independent data flows. Knowing which one a filter touches saves confusion:",
      },
      {
        type: "bullets",
        items: [
          "The four KPI cards at the top — react to ALL filters (date, status, source, user).",
          "The deals table — also reacts to every filter.",
          "The two charts (Funnel and Win Rate) — show the full year, independent of filters, so you always see the big picture.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "If a chart looks 'wrong', it's not because of a filter — try a hard refresh to clear stale cache.",
      },
    ],
    related: ["reading-the-win-rate", "reading-the-funnel"],
  },
];

export default articles;

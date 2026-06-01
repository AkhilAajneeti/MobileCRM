const articles = [
  {
    id: "common-questions",
    title: "Frequently asked questions",
    description: "Quick answers to the most common questions.",
    tags: ["faq", "questions"],
    sections: [
      {
        type: "accordion",
        items: [
          {
            q: "Why can't I see some leads my teammate created?",
            a:
              "By default a Sales Rep only sees leads assigned to them. Ask your manager to reassign or grant team visibility if you need to view them.",
          },
          {
            q: "I changed a lead's status — why isn't the chart updating?",
            a:
              "Analytics charts cache data for ~5 minutes and refresh silently in the background. Either wait a moment or reload the page to force a refetch.",
          },
          {
            q: "Can I bulk import leads from a CSV?",
            a:
              "Not from the web UI yet. Send the file to your admin — they can import via the backend tools.",
          },
          {
            q: "What's the difference between Active and Won?",
            a:
              "Active = still working on it (Follow up, Interested, Site Visit Scheduled, etc.). Won = the lead was Purchased. Everything else is Lost.",
          },
          {
            q: "Why does Win Rate look like 0% in May?",
            a:
              "Win Rate counts only closed deals. Most leads created in the current month are still active — they haven't won or lost yet. Older months show the matured rate.",
          },
          {
            q: "How do I export my leads?",
            a:
              "On the Leads page, click 'Export All' at the top to download every lead as a CSV. To export only the ones you've selected, use the bulk action menu.",
          },
        ],
      },
    ],
    related: ["why-cant-i-see-some-leads"],
  },
  {
    id: "why-cant-i-see-some-leads",
    title: "Why can't I see some leads?",
    description: "Visibility rules in one place.",
    tags: ["visibility", "missing", "leads"],
    sections: [
      {
        type: "paragraph",
        body: "If a lead seems missing, walk through this checklist:",
      },
      {
        type: "steps",
        items: [
          "Check the filter bar — a date or status filter might be hiding it.",
          "Clear all filters and search by the lead's name directly.",
          "If still missing, your role might not have access. Sales Reps only see their own leads by default.",
          "Ask your manager to reassign the lead to you, or grant your role 'team' visibility.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        body:
          "The Permissions guide explains which role sees what. It's a 30-second read.",
      },
    ],
    related: ["common-questions", "permissions:what-roles-mean"],
  },
];

export default articles;

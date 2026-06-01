const articles = [
  {
    id: "creating-a-lead",
    title: "How to create a new lead",
    description: "Add a new prospect into the CRM in under a minute.",
    tags: ["create", "new lead", "add"],
    sections: [
      {
        type: "paragraph",
        body:
          "A lead is anyone you want to follow up with — an enquiry, a referral, a walk-in. The faster you log them, the less you'll forget.",
      },
      {
        type: "steps",
        items: [
          "Open the Leads page from the left navigation.",
          "Click the purple New Lead button in the top right.",
          "Fill in at least Name and Phone — both are required.",
          "Pick a Source (where the lead came from).",
          "Pick a Status — start with New if you haven't talked yet.",
          "Click Save. Your new lead appears at the top of the list.",
        ],
      },
      {
        type: "screenshot",
        label: "Leads page — the 'New Lead' button is in the top right.",
      },
      {
        type: "note",
        variant: "tip",
        title: "Pro tip",
        body:
          "Set a Next Contact date right when you create the lead. It'll appear on your Tasks list automatically and won't slip.",
      },
    ],
    related: ["editing-a-lead", "lead-statuses-explained"],
  },
  {
    id: "editing-a-lead",
    title: "Editing a lead",
    description: "Update status, notes, follow-up date or anything else.",
    tags: ["edit", "update", "change"],
    sections: [
      {
        type: "steps",
        items: [
          "Click the lead's name in the leads table — a side panel slides in.",
          "Click the pencil icon at the top of the panel to enter edit mode.",
          "Change any field you need.",
          "Click Save. The list refreshes with the latest values.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "Don't see an Edit button? Your role might not have permission. Ask your manager or check the Permissions guide.",
      },
    ],
    related: ["creating-a-lead", "permissions:what-roles-mean"],
  },
  {
    id: "lead-statuses-explained",
    title: "Lead statuses explained",
    description: "What every status in the dropdown actually means.",
    tags: ["status", "stage", "pipeline"],
    sections: [
      {
        type: "paragraph",
        body:
          "Status tells everyone where the lead is in your sales process. The CRM groups statuses into three big buckets:",
      },
      {
        type: "heading",
        text: "Active (still in play)",
      },
      {
        type: "bullets",
        items: [
          "New — fresh lead, not contacted yet.",
          "Follow up — you've reached out, waiting on them.",
          "Interested — they want to know more.",
          "Site Visit Scheduled — site visit booked.",
          "Site Visit Done — site visit completed.",
          "Call Later — they asked you to call back later.",
          "Broker — being handled through a broker partner.",
        ],
      },
      {
        type: "heading",
        text: "Won",
      },
      {
        type: "bullets",
        items: ["Purchased — deal closed. 🎉"],
      },
      {
        type: "heading",
        text: "Lost / Closed",
      },
      {
        type: "bullets",
        items: [
          "Not Interested, Low Budget, Low Interest, Other Location — deal didn't fit.",
          "Dead, Switch Off, Call Not Picked, Call Not Connecting, Invalid Number — unreachable.",
          "Fake Lead, Irrelevant Lead — bad data.",
        ],
      },
      {
        type: "note",
        variant: "warning",
        title: "Be honest with status",
        body:
          "Don't leave dead leads in Active to make your numbers look bigger. Reports and conversion rates depend on accurate status — be ruthless.",
      },
    ],
    related: ["editing-a-lead", "reports:reading-the-win-rate"],
  },
  {
    id: "filtering-leads",
    title: "Filtering and searching leads",
    description: "Narrow down a long lead list to exactly what you need.",
    tags: ["filter", "search", "find"],
    sections: [
      {
        type: "paragraph",
        body:
          "The filter bar above the leads table lets you combine multiple filters. They all apply together (AND), not separately.",
      },
      {
        type: "bullets",
        items: [
          "Search — types the name field for partial matches.",
          "Status — show only leads in one specific status.",
          "Source — restrict to leads from one source (Website, Walk-in, etc.).",
          "Assigned User — show only leads belonging to one teammate.",
          "Date range — Today, Last 7 Days, Current Month, or a custom date.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        body:
          "Use the small × on the filter bar to clear all filters in one click instead of resetting them one by one.",
      },
    ],
    related: ["lead-statuses-explained"],
  },
];

export default articles;

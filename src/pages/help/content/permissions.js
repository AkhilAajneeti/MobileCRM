const articles = [
  {
    id: "what-roles-mean",
    title: "What every role can do",
    description: "Sales Rep, Manager, Admin — explained without jargon.",
    tags: ["roles", "permissions", "access"],
    sections: [
      {
        type: "heading",
        text: "Sales Rep",
      },
      {
        type: "bullets",
        items: [
          "Sees and edits only leads, tasks, meetings assigned to them.",
          "Cannot see other reps' leads or numbers.",
          "Cannot change user accounts or company settings.",
        ],
      },
      {
        type: "heading",
        text: "Manager",
      },
      {
        type: "bullets",
        items: [
          "Sees everything their team owns.",
          "Can reassign leads between team members.",
          "Sees team-level reports (per-rep charts, funnel, win rate).",
        ],
      },
      {
        type: "heading",
        text: "Admin",
      },
      {
        type: "bullets",
        items: [
          "Sees everything across the entire company.",
          "Manages users, teams, roles and company settings.",
          "Owns the integration credentials.",
        ],
      },
      {
        type: "note",
        variant: "warning",
        title: "Role changes are powerful",
        body:
          "Promoting someone to Admin gives them full delete access. Only the company owner should be Admin in most cases.",
      },
    ],
    related: ["why-some-things-are-disabled"],
  },
  {
    id: "why-some-things-are-disabled",
    title: "Why some buttons are greyed out",
    description: "Permissions decide what you can and can't click.",
    tags: ["disabled", "greyed", "permission"],
    sections: [
      {
        type: "paragraph",
        body:
          "If a button looks faded or a field won't let you type, your role doesn't have permission for that action. The CRM hides nothing — it just blocks the actions you're not allowed to do.",
      },
      {
        type: "bullets",
        items: [
          "Edit / Delete on someone else's lead — blocked unless you're their manager or admin.",
          "Mass update / Mass delete — manager+ only.",
          "Settings → Users & Roles — admin only.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "If you really need an action that's blocked, ask your admin to either grant the permission or do the action on your behalf.",
      },
    ],
    related: ["what-roles-mean"],
  },
];

export default articles;

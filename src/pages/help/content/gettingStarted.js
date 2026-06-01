const articles = [
  {
    id: "first-login",
    title: "Your first login",
    description: "Signing in and finding your way around for the very first time.",
    tags: ["login", "signin", "first time"],
    sections: [
      {
        type: "paragraph",
        body:
          "Welcome! This guide walks you through your very first sign-in and where the most useful things live in the CRM.",
      },
      {
        type: "heading",
        text: "Sign in",
      },
      {
        type: "steps",
        items: [
          "Open the CRM web address shared by your admin.",
          "Enter your email and password on the Login screen.",
          "Click Sign In — you'll land on the Dashboard.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        title: "Lost your password?",
        body:
          "Ask your admin to reset it from Settings → Users & Roles. There's no public password-reset link yet.",
      },
      {
        type: "heading",
        text: "The main navigation",
      },
      {
        type: "bullets",
        items: [
          "Dashboard — your home page with quick stats.",
          "Leads — all the people you're working with.",
          "Pipeline — drag-and-drop view of where leads are stuck.",
          "Meetings / Tasks / Calls — your to-do lists.",
          "Reports — read your team's numbers.",
        ],
      },
      {
        type: "note",
        variant: "info",
        body:
          "Almost every screen has a search bar at the top — use it before scrolling endlessly.",
      },
    ],
    related: ["dashboard-tour", "edit-your-profile"],
  },
  {
    id: "dashboard-tour",
    title: "Tour the Dashboard",
    description: "What every box on the home page means.",
    tags: ["dashboard", "home", "kpi", "stats"],
    sections: [
      {
        type: "paragraph",
        body:
          "Your Dashboard is the at-a-glance view of today. Every block is a shortcut into a deeper screen — click any number to see the underlying leads.",
      },
      {
        type: "bullets",
        items: [
          "Total Leads — every lead assigned to you (or your team if you're a manager).",
          "Today's Tasks — what's due today.",
          "Upcoming Meetings — your next 5 confirmed meetings.",
          "Conversion — % of your closed deals that became Purchased.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        body:
          "Hover any chart for a tooltip — most charts have hidden details you can only see on hover.",
      },
    ],
    related: ["first-login", "reports:reading-the-win-rate"],
  },
  {
    id: "edit-your-profile",
    title: "Edit your profile",
    description: "Update your name, photo, or contact info.",
    tags: ["profile", "account", "settings"],
    sections: [
      {
        type: "steps",
        items: [
          "Click your avatar in the top-right corner of any page.",
          "Choose Profile from the menu.",
          "Edit any field you need — name, phone, photo, signature.",
          "Click Save changes.",
        ],
      },
      {
        type: "note",
        variant: "warning",
        title: "Can't change your role?",
        body:
          "Roles (like Sales Rep, Manager, Admin) are controlled by your admin from Settings → Users & Roles. Ask them for an update.",
      },
    ],
    related: ["first-login", "permissions:what-roles-mean"],
  },
];

export default articles;

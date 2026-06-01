const articles = [
  {
    id: "creating-a-task",
    title: "Creating a task",
    description: "Add a follow-up reminder for yourself or a teammate.",
    tags: ["create", "task", "reminder", "follow up"],
    sections: [
      {
        type: "steps",
        items: [
          "Open the Tasks page from the left navigation.",
          "Click the New Task button.",
          "Pick the lead the task is for (optional but recommended).",
          "Add a title — keep it short and action-oriented (e.g. 'Call Anil about pricing').",
          "Set a due date and time.",
          "Click Save.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        title: "Set due dates seriously",
        body:
          "Tasks with no due date drift forever. Always pick a date — even if you have to push it later.",
      },
    ],
    related: ["finishing-a-task"],
  },
  {
    id: "finishing-a-task",
    title: "Marking a task done",
    description: "Tick off a task or reschedule it for later.",
    tags: ["complete", "done", "finish"],
    sections: [
      {
        type: "steps",
        items: [
          "Open the Tasks page.",
          "Click the round checkbox to the left of the task title.",
          "The task strikes through and moves to your 'Completed today' list.",
        ],
      },
      {
        type: "heading",
        text: "Reschedule instead of marking done",
      },
      {
        type: "paragraph",
        body:
          "If you didn't manage the task today, edit the due date instead of closing it. That way you don't lose the history.",
      },
    ],
    related: ["creating-a-task"],
  },
  {
    id: "overdue-tasks",
    title: "Spotting overdue tasks",
    description: "Find tasks that slipped past their due date.",
    tags: ["overdue", "late", "missed"],
    sections: [
      {
        type: "paragraph",
        body:
          "Overdue tasks are shown in red on the Tasks page and surface in the lead's drawer too. Don't ignore them — overdue follow-ups are the #1 reason deals die.",
      },
      {
        type: "note",
        variant: "warning",
        body:
          "On the Leads analytics chart, overdue follow-ups per rep appear in the tooltip. Managers do check this.",
      },
    ],
    related: ["creating-a-task", "finishing-a-task"],
  },
];

export default articles;

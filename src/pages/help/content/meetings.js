const articles = [
  {
    id: "scheduling-a-meeting",
    title: "Scheduling a meeting",
    description: "Book a meeting with a lead in a few clicks.",
    tags: ["schedule", "book", "calendar", "meeting"],
    sections: [
      {
        type: "steps",
        items: [
          "Open the Meetings page or open a lead from the Leads page.",
          "Click the New Meeting button (top right) or 'Add meeting' inside the lead's panel.",
          "Pick a date and time.",
          "Add a title and optional notes.",
          "Click Save. The lead's status updates to Site Visit Scheduled automatically.",
        ],
      },
      {
        type: "note",
        variant: "tip",
        body:
          "Creating a meeting from inside a lead's drawer auto-fills the lead — saves you typing.",
      },
    ],
    related: ["rescheduling-a-meeting", "meeting-statuses"],
  },
  {
    id: "rescheduling-a-meeting",
    title: "Rescheduling or cancelling",
    description: "Change a meeting's time or call it off.",
    tags: ["reschedule", "cancel", "move"],
    sections: [
      {
        type: "steps",
        items: [
          "Open the Meetings page.",
          "Click the meeting row to open the side panel.",
          "Change the date / time, or click Cancel meeting at the bottom.",
          "Click Save.",
        ],
      },
      {
        type: "note",
        variant: "warning",
        body:
          "Cancelling a meeting does not change the lead's status. Update the lead status manually if the deal is dead.",
      },
    ],
    related: ["scheduling-a-meeting"],
  },
  {
    id: "meeting-statuses",
    title: "Meeting statuses",
    description: "Confirmed, Done, Cancelled — what each one means.",
    tags: ["status", "meeting"],
    sections: [
      {
        type: "bullets",
        items: [
          "Confirmed — meeting is on, both sides agreed.",
          "Done — meeting happened. Update the lead's status next.",
          "Cancelled — meeting was called off. Reach out to reschedule.",
        ],
      },
    ],
    related: ["scheduling-a-meeting"],
  },
];

export default articles;

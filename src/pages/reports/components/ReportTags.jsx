import React from "react";

/**
 * Reports-only tags and avatars (spec 9.2 / 9.3).
 *
 * These are intentionally NOT the app-wide badges from utils/statusTokens:
 * this is a read-only scanning grid, so the tags are chunkier and the avatar
 * palette is deeper. The saturated app palette fought with the zebra
 * striping on the desktop table. If you ever unify avatar palettes across
 * the app, this screen is where that shows up as a visual regression.
 */

/**
 * Status colours. The `border` keyword is deliberately absent from each
 * string — the tag element already declares `border`.
 */
const STATUS_TAGS = {
  New: "bg-blue-50 text-blue-700 border-blue-200",

  "Follow up": "bg-emerald-50 text-emerald-700 border-emerald-200",
  Interested: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Site Visit Scheduled": "bg-emerald-200 text-emerald-800 border-emerald-300",
  "Invitation Sent": "bg-emerald-200 text-emerald-800 border-emerald-300",
  "Site Visit Done": "bg-emerald-300 text-emerald-900 border-emerald-400",
  Purchased: "bg-emerald-600 text-white border-emerald-600",

  "Call Later": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Call Not Connecting": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Call Not Picked": "bg-yellow-200 text-yellow-800 border-yellow-300",
  "Switch Off": "bg-yellow-300 text-yellow-900 border-yellow-400",

  QDTD: "bg-violet-100 text-violet-800 border-violet-300",
  Duplicate: "bg-slate-100 text-slate-600 border-slate-200",

  "Low Budget": "bg-red-50 text-red-700 border-red-200",
  "Low Interest": "bg-red-50 text-red-700 border-red-200",
  "Other Location": "bg-red-50 text-red-700 border-red-200",
  "Irrelevant Lead": "bg-red-50 text-red-700 border-red-200",
  "Not Interested": "bg-red-100 text-red-700 border-red-200",
  Broker: "bg-red-100 text-red-700 border-red-200",
  Dead: "bg-red-200 text-red-800 border-red-300",
  "Fake Lead": "bg-red-300 text-red-900 border-red-400",
  "Invalid Number": "bg-red-600 text-white border-red-600",
};

const STATUS_FALLBACK = "bg-slate-100 text-slate-600 border-slate-200";

export const StatusTag = ({ status }) => {
  if (!status) return <span className="text-muted-foreground">—</span>;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${
        STATUS_TAGS[status] || STATUS_FALLBACK
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};

/**
 * Source colours. Unlike the Leads table, these lookups are title-case and
 * case-sensitive — no lowercasing first.
 */
const SOURCE_TAGS = {
  Call: "bg-emerald-50 text-emerald-700",
  Email: "bg-blue-50 text-blue-700",
  "Existing Customer": "bg-violet-50 text-violet-700",
  Partner: "bg-orange-50 text-orange-700",
  "Public Relations": "bg-pink-50 text-pink-700",
  "Web Site": "bg-cyan-50 text-cyan-700",
  Campaign: "bg-amber-50 text-amber-700",
  facebook: "bg-blue-50 text-blue-700",
  IVR: "bg-slate-100 text-slate-600",
  Other: "bg-slate-100 text-slate-600",
  ACL: "bg-violet-50 text-violet-700",
};

export const SourceTag = ({ source }) => {
  if (!source) return <span className="text-sm text-muted-foreground">—</span>;

  return (
    <span
      className={`inline-flex items-center rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
        SOURCE_TAGS[source] || "bg-slate-100 text-slate-600"
      }`}
    >
      {/* As everywhere else in the app, ACL displays as Aajneeti. */}
      {source === "ACL" ? "Aajneeti" : source}
    </span>
  );
};

/** Deeper than the app-wide palette, to survive the zebra striping. */
const REPORT_AVATAR_PALETTE = [
  "#6E1420",
  "#0F766E",
  "#B45309",
  "#4338CA",
  "#BE123C",
  "#0369A1",
];

const avatarColor = (name) => {
  let hash = 0;
  for (let i = 0; i < String(name).length; i += 1) {
    hash = (hash + String(name).charCodeAt(i)) >>> 0;
  }
  return REPORT_AVATAR_PALETTE[hash % REPORT_AVATAR_PALETTE.length];
};

/** First letter of up to the first two words. */
const initials = (name) => {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return words.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
};

export const Assignee = ({ name }) => {
  if (!name) {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }

  return (
    <span className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white shadow-sm"
        style={{ backgroundColor: avatarColor(name) }}
      >
        {initials(name)}
      </span>
      <span className="truncate text-[14px] font-medium capitalize text-foreground">
        {name}
      </span>
    </span>
  );
};

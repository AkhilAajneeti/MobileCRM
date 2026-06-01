import React from "react";
import Icon from "../../../components/AppIcon";

const VARIANTS = {
  info: {
    icon: "Info",
    iconColor: "text-blue-600",
    bg: "bg-blue-50/80",
    border: "border-blue-200",
    titleColor: "text-blue-900",
    bodyColor: "text-blue-900/80",
  },
  tip: {
    icon: "Lightbulb",
    iconColor: "text-violet-600",
    bg: "bg-violet-50/80",
    border: "border-violet-200",
    titleColor: "text-violet-900",
    bodyColor: "text-violet-900/80",
  },
  success: {
    icon: "CheckCircle2",
    iconColor: "text-emerald-600",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200",
    titleColor: "text-emerald-900",
    bodyColor: "text-emerald-900/80",
  },
  warning: {
    icon: "AlertTriangle",
    iconColor: "text-amber-600",
    bg: "bg-amber-50/80",
    border: "border-amber-200",
    titleColor: "text-amber-900",
    bodyColor: "text-amber-900/80",
  },
};

const NoteCard = ({ variant = "info", title, children, body }) => {
  const v = VARIANTS[variant] || VARIANTS.info;
  return (
    <div
      className={`rounded-xl border ${v.border} ${v.bg} px-4 py-3 flex gap-3 items-start`}
    >
      <Icon name={v.icon} size={18} className={`mt-0.5 ${v.iconColor} shrink-0`} />
      <div className="min-w-0">
        {title && (
          <div className={`font-semibold text-sm mb-0.5 ${v.titleColor}`}>
            {title}
          </div>
        )}
        <div className={`text-sm leading-relaxed ${v.bodyColor}`}>
          {body || children}
        </div>
      </div>
    </div>
  );
};

export default NoteCard;

import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatShortDate } from "../utils/dateHelpers";
import { formatCurrency } from "../utils/pipelineHelpers";
import { useNavigate } from "react-router-dom";


/**
 * DealCard - presentation only.
 *
 * Receives a fully enriched deal (category, urgency styling, relative date
 * labels are all pre-computed in the service/helpers layer). The card just
 * renders them, so there is no business logic here.
 */

const PRIORITY_STYLES = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-gray-100 text-gray-600",
};

const getStatusColor = (status = "") => {
  const value = status.toLowerCase();
  if (!value) return "bg-gray-100 text-gray-700";
  if (value.includes("budget") || value.includes("payment"))
    return "bg-red-100 text-red-700";
  if (value.includes("interested") || value.includes("qualified"))
    return "bg-green-100 text-green-700";
  if (value.includes("follow")) return "bg-yellow-100 text-yellow-700";
  return "bg-blue-100 text-blue-700";
};

const DealCard = ({ deal = {}, onViewHistory }) => {
  const [isHovered, setIsHovered] = useState(false);
  const urgency = deal.urgency || {};
  const navigate = useNavigate();
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-card border border-border rounded-lg p-4 cursor-grab active:cursor-grabbing transition-shadow duration-200 hover:shadow-md ${urgency.card || ""
        }`}
    >
      {/* Hover actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex space-x-1 bg-white border rounded-md shadow p-1 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewHistory?.(deal.id)}
            aria-label="View history"
          >
            <Icon name="History" size={14} />
          </Button>

        </div>
      )}

      <div className="space-y-3">
        {/* Lead / company / project — clicking any of these opens the lead drawer on /leads */}
        <div
          role="button"
          tabIndex={0}
          className="pr-12 cursor-pointer group/link"
          onClick={(e) => {
            // Stop the click from bubbling into the draggable card surface.
            e.stopPropagation();
            if (!deal?.id) return;
            navigate("/leads", { state: { leadId: deal.id } });
          }}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && deal?.id) {
              e.preventDefault();
              navigate("/leads", { state: { leadId: deal.id } });
            }
          }}
        >
          <h3 className="font-semibold text-base text-card-foreground leading-tight group-hover/link:text-primary transition-colors">
            {deal.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate group-hover/link:text-primary/80 transition-colors">
            {deal.company || deal.project || "No Company"}
          </p>
        </div>

        {/* Urgency + status badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${urgency.badge || "bg-gray-100 text-gray-700"
              }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${urgency.dot || "bg-gray-400"}`}
            />
            {deal.nextContactLabel}
          </span>
          {deal.status && (
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                deal.status,
              )}`}
            >
              {deal.status}
            </span>
          )}
        </div>

        {/* Next follow-up */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Icon name="CalendarClock" size={14} />
            Next follow-up
          </span>
          <span className={`font-medium ${urgency.text || "text-foreground"}`}>
            {formatShortDate(deal.nextContactDate)}
          </span>
        </div>

        {/* Deal value + priority */}
        <div className="flex items-center justify-between text-sm">

          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${PRIORITY_STYLES[deal.priority] || PRIORITY_STYLES.Low
              }`}
          >
            {deal.priority} Priority
          </span>
        </div>

        {/* Assigned user + last activity */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-2">
          <span className="flex items-center gap-2 truncate">
            <Icon name="User" size={14} />
            {deal.owner?.name || "Unassigned"}
          </span>
          <span className="flex items-center gap-1 whitespace-nowrap">
            <Icon name="Clock" size={13} />
            {deal.lastActivityLabel}
          </span>
        </div>

        {/* Site visit (when present) */}
        {deal.siteVisitAt && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Icon name="CheckCircle" size={14} />
            <span>Site Visit: {formatShortDate(deal.siteVisitAt)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Memoized: a card only re-renders when its own deal object changes.
export default memo(DealCard);

import React from "react";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import { Checkbox } from "../../../components/ui/Checkbox";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import {
  formatDate,
  formatTime,
  getStageGradient,
  hasTime,
} from "../../../utils/statusTokens";

/**
 * The lead card (spec 5) -- the signature mobile component that replaces
 * the desktop table row.
 *
 * The background wash comes from getStageGradient so the card's own hue
 * family always matches its status badge. Tapping the content column opens
 * the detail view; the three action circles stop propagation so they never
 * do.
 */
const LeadCard = ({
  deal,
  isSelected,
  onSelect,
  onOpen,
  onQuickEdit,
  canEdit = true,
  canWhatsapp = true,
  isDeleting = false,
}) => {
  const phone = deal?.phoneNumber;
  const project = deal?.cProject || deal?.cProjectName;

  // The pencil renders only when the screen actually supplies a
  // quick-update handler AND this user may edit this record (spec 6.1).
  // Lists without a handler -- Calls, Meetings -- simply never get one.
  const showQuickEdit = Boolean(onQuickEdit) && canEdit;

  const stopAnd = (handler) => (event) => {
    event.stopPropagation();
    handler?.(event);
  };

  const handleCall = stopAnd(() => {
    window.location.href = `tel:${phone}`;
  });

  const handleWhatsapp = stopAnd(() => {
    const message =
      `Hello *${deal?.name || "Customer"}*,\n` +
      `Thank you for contacting us for your lead generation requirements.\n\n` +
      `I'm *${deal?.assignedUserName || "AAJneeti Team"}* from *AAJneeti Advertising*.`;

    window.open(
      `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}`,
      "_blank"
    );
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={
        isDeleting
          ? { backgroundColor: "rgba(254,226,226,1)", x: -60, opacity: 0 }
          : { opacity: 1, y: 0 }
      }
      exit={{ backgroundColor: "rgba(254,226,226,1)", x: -60, opacity: 0 }}
      transition={
        isDeleting
          ? { duration: 0.28, ease: "easeIn" }
          : { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }
      }
      className={`
        mx-3 my-2 rounded-2xl border p-4
        transition-all duration-200 active:scale-[0.99]
        ${getStageGradient(deal?.status)}
      `}
    >
      <div className="flex gap-3">
        {/* Selection -- wrapped in a 44px tap target */}
        <label
          className="-m-2 grid h-11 w-11 shrink-0 cursor-pointer place-items-center p-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onChange={(event) => {
              event.stopPropagation();
              onSelect?.(deal?.id, event.target.checked);
            }}
          />
        </label>

        {/* Tappable content column */}
        <div
          role="button"
          tabIndex={0}
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={() => onOpen?.(deal)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen?.(deal);
            }
          }}
        >
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold capitalize text-foreground">
                {deal?.name}
              </h3>
              {project && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {project}
                </p>
              )}
            </div>

            <StatusBadge status={deal?.status} size="card" />
          </div>

          {/* Bottom row */}
          <div className="mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0 space-y-1">
              {deal?.assignedUserName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="User2" size={12} className="shrink-0" />
                  <span className="truncate capitalize">{deal.assignedUserName}</span>
                </div>
              )}

              {project && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon name="Building2" size={12} className="shrink-0" />
                  <span className="truncate">{project}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="Calendar" size={12} className="shrink-0" />
                <span className="tabular-nums">{formatDate(deal?.createdAt)}</span>
              </div>

              {hasTime(deal?.createdAt) && (
                <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="Clock" size={11} className="shrink-0" />
                  <span className="tabular-nums">{formatTime(deal.createdAt)}</span>
                </div>
              )}
            </div>

            {/* Action cluster -- 40x40 circles, never opens the detail view.
                Order is fixed: pencil, call, WhatsApp. When the pencil is
                absent the other two keep their size and gap rather than
                re-centring to fill the space (spec 6.1). */}
            <div className="flex shrink-0 items-center gap-2">
              {showQuickEdit && (
                <button
                  type="button"
                  onClick={stopAnd(() => onQuickEdit?.(deal))}
                  aria-label={`Quick update ${deal?.name}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-primary transition-all duration-150 active:scale-95 active:bg-primary/10"
                >
                  <Icon name="PencilLine" size={19} />
                </button>
              )}

              {phone && (
                <button
                  type="button"
                  onClick={handleCall}
                  aria-label={`Call ${deal?.name}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-blue-600 transition-all duration-150 active:scale-95 active:bg-blue-100"
                >
                  <Icon name="PhoneCall" size={20} />
                </button>
              )}

              {canWhatsapp && phone && (
                <button
                  type="button"
                  onClick={handleWhatsapp}
                  aria-label={`Message ${deal?.name} on WhatsApp`}
                  className="grid h-10 w-10 place-items-center rounded-full transition-all duration-150 active:scale-95 active:bg-[#1fb85557]"
                >
                  <img
                    src="/assets/whatsapp-logo.png"
                    alt="WhatsApp"
                    className="h-8 w-8 object-contain"
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(LeadCard);

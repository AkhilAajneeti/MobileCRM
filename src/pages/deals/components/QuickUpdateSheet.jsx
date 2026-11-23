import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import Icon from "../../../components/AppIcon";
import StatusChipGrid from "../../../components/ui/StatusChipGrid";
import {
  getStatusAccent,
  toDatetimeLocal,
} from "../../../utils/statusTokens";
import {
  fromEspoToLocalInput,
  toEspoDateTime,
} from "../../pipeline/utils/dateHelpers";

/**
 * Quick Update bottom sheet (spec 6) -- a 10-second post-call update.
 *
 * Three fields only: Status, Quick Note, Next Follow-up. Everything else
 * lives in the detail view. Save stays disabled until something actually
 * changed, and on failure the sheet stays open so the note isn't lost.
 */

/** Presets each set 10:00 AM on the target day. */
const buildPreset = (daysAhead) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(10, 0, 0, 0);
  return toDatetimeLocal(date);
};

const FOLLOWUP_PRESETS = [
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
];

const QuickUpdateSheet = ({
  deal,
  isOpen,
  onClose,
  onSave,
  statusOptions,
  canEdit = true,
}) => {
  const initialStatus = deal?.status || "";
  const initialFollowUp = fromEspoToLocalInput(deal?.cNextContactAt);

  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(initialFollowUp);
  const [isSaving, setIsSaving] = useState(false);

  // Re-seed whenever a different lead opens the sheet. The note always
  // starts empty -- it is never pre-filled.
  useEffect(() => {
    if (!isOpen) return;
    setStatus(deal?.status || "");
    setNote("");
    setFollowUp(fromEspoToLocalInput(deal?.cNextContactAt));
    setIsSaving(false);
  }, [isOpen, deal?.id, deal?.status, deal?.cNextContactAt]);

  // Lock background scroll while open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close on hardware back / Escape (blocked while saving).
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, isSaving, onClose]);

  const accent = getStatusAccent(status);

  const isDirty =
    status !== initialStatus ||
    note.trim().length > 0 ||
    followUp !== initialFollowUp;

  /**
   * One save can partially succeed, because the status fields and the
   * activity-stream note are written separately (spec 6.2). Three outcomes
   * get distinct treatment.
   */
  const handleSave = async () => {
    if (!isDirty || isSaving) return;

    // 1. No permission -- never enter the saving state at all.
    if (!canEdit) {
      toast.error("You do not have permission to edit this lead");
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave({
        id: deal?.id,
        status: status !== initialStatus ? status : undefined,
        cNextContactAt:
          followUp !== initialFollowUp ? toEspoDateTime(followUp) : undefined,
        note: note.trim() || undefined,
      });

      // 2. Fields saved but the note never reached the stream -- still a
      //    success, so close, but say what didn't happen.
      if (result?.noteFailed) {
        toast("Saved, but couldn't add the note to activity", { icon: "⚠️" });
      } else {
        toast.success("Lead updated");
      }
      onClose?.();
    } catch (error) {
      console.error("Quick update failed", error);

      if (error?.code === "FORBIDDEN") {
        toast.error("You do not have permission to edit this lead");
      } else {
        // 3. Save failed -- keep everything the rep typed, and return Save
        //    to its enabled, non-spinning state.
        toast.error("Couldn't update lead");
      }
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        // Mobile-only: the quick edit is a phone interaction (spec 6.1).
        <div className="fixed inset-0 z-[70] md:hidden">
          {/* Backdrop -- the list stays visible behind it for context. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !isSaving && onClose?.()}
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Quick update ${deal?.name || "lead"}`}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 340 }}
            drag="y"
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragConstraints={{ top: 0, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (isSaving) return;
              if (info.offset.y > 120 || info.velocity.y > 700) onClose?.();
            }}
            className="absolute inset-x-0 bottom-0 flex max-h-[90vh] flex-col overflow-hidden rounded-t-[28px] border-t border-border bg-background shadow-sheet"
          >
            {/* Status colour bloom, re-keyed so it replays on each change */}
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 0.4, scale: 1 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-0 -mt-20 h-44 w-80 -translate-x-1/2 rounded-full blur-3xl"
              style={{ background: accent }}
            />

            {/* Accent hairline */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px] transition-all duration-300"
              style={{
                background: `linear-gradient(to right, transparent, ${accent}, transparent)`,
              }}
            />

            {/* Grabber */}
            <div className="relative flex shrink-0 justify-center pb-1 pt-3.5">
              <div className="h-1.5 w-11 rounded-full bg-foreground/15" />
            </div>

            {/* Header */}
            <div className="relative flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-1.5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold capitalize tracking-tight text-foreground">
                  {deal?.name}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Quick update
                </div>
              </div>

              <button
                type="button"
                onClick={() => !isSaving && onClose?.()}
                aria-label="Close quick update"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-transform active:scale-95"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="relative flex-1 space-y-6 overflow-y-auto overscroll-touch px-5 pb-4">
              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Status
                </label>
                <StatusChipGrid
                  value={status}
                  onChange={setStatus}
                  options={statusOptions}
                />
              </div>

              {/* Quick note */}
              <div>
                <label
                  htmlFor="quick-note"
                  className="mb-2 block text-sm font-semibold text-foreground"
                >
                  Quick Note
                </label>
                <textarea
                  id="quick-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add conversation notes..."
                  className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground/60 focus:border-transparent focus:ring-2 focus:ring-primary/60"
                />
              </div>

              {/* Next follow-up */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  Next Follow-up
                </label>

                <div className="mb-2 flex flex-wrap gap-2">
                  {FOLLOWUP_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFollowUp(buildPreset(preset.days))}
                      className="inline-flex min-h-[40px] items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium text-muted-foreground transition-transform active:scale-95"
                    >
                      {preset.label}
                    </button>
                  ))}

                  {followUp && (
                    <button
                      type="button"
                      onClick={() => setFollowUp("")}
                      className="inline-flex min-h-[40px] items-center rounded-full px-3.5 text-sm font-medium text-destructive transition-colors active:bg-destructive/10"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  type="datetime-local"
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground focus:border-transparent focus:ring-2 focus:ring-primary/60"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="relative flex shrink-0 items-center gap-3 border-t border-border bg-background px-5 pb-safe pt-3">
              <button
                type="button"
                onClick={() => !isSaving && onClose?.()}
                className="min-h-[52px] flex-1 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground transition-transform active:scale-[0.98]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className={`
                  flex min-h-[52px] flex-[1.5] items-center justify-center gap-2 rounded-2xl
                  bg-primary text-sm font-semibold text-primary-foreground
                  transition-all active:scale-[0.98]
                  ${!isDirty || isSaving ? "opacity-40 shadow-none" : "shadow-cta-glow"}
                `}
              >
                {isSaving ? (
                  <>
                    <Icon name="Loader" size={16} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Update"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickUpdateSheet;

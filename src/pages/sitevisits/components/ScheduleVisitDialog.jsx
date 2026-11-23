import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import LeadCombobox from "./LeadCombobox";
import DateTimePicker from "./DateTimePicker";
import { formatVisitSummary } from "../utils/siteVisitHelpers";

/**
 * Schedule visit dialog (spec 11).
 *
 * Schedules a visit for an EXISTING lead; it never creates a lead.
 * Sits at z-[110] — the picker opens from inside it at z-[120].
 */
const ScheduleVisitDialog = ({ users = [], masked, isSaving, onSubmit, onClose }) => {
  const [lead, setLead] = useState(null);
  const [assignedUserId, setAssignedUserId] = useState("");
  const [visitAt, setVisitAt] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Selecting a lead pre-fills the rep with that lead's current assignee and
   * leaves it editable. Clearing the lead does NOT clear the rep — the one
   * piece of cross-field behaviour here, and easy to miss.
   */
  const handleLeadSelect = (next) => {
    setLead(next);
    if (next?.assignedUserId) setAssignedUserId(next.assignedUserId);
  };

  const canSubmit = Boolean(lead && visitAt) && !isSaving;

  return (
    <>
      <div
        className="fixed inset-0 z-[110] grid place-items-center bg-black/30 p-4"
        onClick={(e) => {
          // Closes only when the click target is the overlay itself.
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">
              Schedule a site visit
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <Icon name="X" size={18} />
            </button>
          </header>

          <div className="space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Lead
              </label>
              <LeadCombobox value={lead} onSelect={handleLeadSelect} masked={masked} />
            </div>

            <div>
              <label
                htmlFor="visit-rep"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Assigned rep
              </label>
              <div className="relative">
                <select
                  id="visit-rep"
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white bg-none pl-3 pr-9 text-sm text-slate-700 focus:border-[#AC2334] focus:outline-none sm:h-10"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                <Icon
                  name="ChevronDown"
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Date &amp; time
              </label>
              {/* A button that opens the picker, not an input. */}
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors hover:border-slate-300 focus:border-[#AC2334] focus:outline-none sm:h-10"
              >
                <span className={visitAt ? "text-slate-800" : "text-slate-400"}>
                  {visitAt ? formatVisitSummary(visitAt) : "Pick a date & time"}
                </span>
                <Icon name="Calendar" size={16} className="text-slate-400" />
              </button>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
            >
              Cancel
            </button>
            {/* Unlike the table rows, this label DOES change while saving:
                the dialog is about to close and the user needs confirmation
                that the tap registered. */}
            <button
              type="button"
              onClick={() => onSubmit({ lead, assignedUserId, visitAt })}
              disabled={!canSubmit}
              className="rounded-lg bg-[#AC2334] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#961e2d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Scheduling…" : "Schedule visit"}
            </button>
          </footer>
        </div>
      </div>

      {isPickerOpen && (
        <DateTimePicker
          title="Pick visit date & time"
          value={visitAt}
          onApply={(date) => {
            setVisitAt(date);
            setIsPickerOpen(false);
          }}
          onClose={() => setIsPickerOpen(false)}
        />
      )}
    </>
  );
};

export default ScheduleVisitDialog;

import React from "react";
import Icon from "../../../components/AppIcon";
import {
  STATUS_VISITED,
  formatVisitDate,
  formatVisitTime,
  getStatusStyle,
  getVisitAt,
  maskPhone,
  repColor,
  repInitials,
  toDisplayStatus,
} from "../utils/siteVisitHelpers";

/** Status pill (spec 1.2). Icons use strokeWidth 3 — a default-weight 12px
    tick looks like dirt on the screen. */
const StatusPill = ({ status }) => {
  const style = getStatusStyle(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.pill}`}
    >
      {style.icon ? (
        <Icon name={style.icon} size={12} strokeWidth={3} />
      ) : (
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      )}
      {status}
    </span>
  );
};

const RepAvatar = ({ name, size = "h-8 w-8" }) => (
  <span
    className={`grid ${size} shrink-0 place-items-center rounded-full text-xs font-semibold text-white ${repColor(name)}`}
  >
    {repInitials(name)}
  </span>
);

/** Icon action (8.1) — 44px on mobile, 32px from md. */
const IconAction = ({ icon, label, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-60 md:h-8 md:w-8"
  >
    <Icon name={icon} size={18} className="md:hidden" />
    <Icon name={icon} size={15} className="hidden md:block" />
  </button>
);

/**
 * Row actions (spec 8).
 *
 * Hierarchy is intentional: one green destination, one neutral alternative,
 * two quiet utilities. Only Mark visited is filled.
 *
 * Masking (8.4) changes the controls, not just the text — a restricted user
 * gets Call as a plain button that sets the location (never an anchor whose
 * href exposes the number) and no WhatsApp at all, because the wa.me URL
 * carries the raw number in the address bar.
 */
const RowActions = ({ visit, masked, isSaving, onReschedule, onMarkVisited }) => {
  const phone = visit?.phoneNumber;
  const digits = String(phone || "").replace(/\D/g, "");

  return (
    <div className="flex flex-wrap items-center gap-2 md:justify-end">
      {phone && (
        <IconAction
          icon="Phone"
          label="Call"
          onClick={() => {
            window.location.href = `tel:${String(phone).replace(/\s/g, "")}`;
          }}
        />
      )}

      {phone && !masked && (
        <IconAction
          icon="MessageCircle"
          label="WhatsApp"
          onClick={() => window.open(`https://wa.me/${digits}`, "_blank")}
        />
      )}

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <button
          type="button"
          onClick={() => onReschedule(visit)}
          disabled={isSaving}
          className="min-h-[44px] rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-60 md:min-h-0 md:px-3.5 md:py-1.5"
        >
          Reschedule
        </button>

        <button
          type="button"
          onClick={() => onMarkVisited(visit)}
          disabled={isSaving}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 md:min-h-0 md:px-3.5 md:py-1.5"
        >
          <Icon name="Check" size={14} strokeWidth={3} />
          Mark visited
        </button>
      </div>
    </div>
  );
};

/** Visited row (8.3): a visual full stop. The arrow points nowhere and is
    deliberately not tappable. */
const VisitDone = () => (
  <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
    <Icon name="ArrowRight" size={14} />
    Site visit done
  </span>
);

const StateLine = ({ children }) => (
  <div className="px-5 py-12 text-center text-sm text-slate-400">{children}</div>
);

const VisitsList = ({
  visits,
  isLoading,
  masked,
  savingId,
  onReschedule,
  onMarkVisited,
}) => {
  if (isLoading) return <StateLine>Loading site visits…</StateLine>;
  if (!visits.length) return <StateLine>No site visits match this view.</StateLine>;

  const leadLine = (visit) => {
    const project = visit.cProject || visit.cProjectName;
    const config = visit.cPreference;
    return [project || "—", config].filter(Boolean).join(" · ");
  };

  return (
    <>
      {/* ---------------- Desktop table ---------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-y border-border text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">Lead</th>
              <th className="px-5 py-3">Assigned Rep</th>
              <th className="px-5 py-3">Visit</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => {
              const status = toDisplayStatus(visit.status);
              const visitAt = getVisitAt(visit);
              const rep = visit.assignedUserName || "Unassigned";

              return (
                <tr
                  key={visit.id}
                  className="border-b border-border/70 transition-colors last:border-0 hover:bg-slate-50/60"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{visit.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{leadLine(visit)}</p>
                    {visit.phoneNumber && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                        <Icon name="Phone" size={11} />
                        {maskPhone(visit.phoneNumber, masked)}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <RepAvatar name={rep} />
                      <span className="text-sm font-medium text-slate-700">{rep}</span>
                    </div>
                  </td>

                  {/* Date is the small uppercase line, time the larger one:
                      the rep already knows roughly which day from the tab
                      and the sort — what they need to read is the hour. */}
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatVisitDate(visitAt)}
                    </p>
                    {visitAt && (
                      <p className="mt-0.5 text-sm text-slate-700">
                        {formatVisitTime(visitAt)}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <StatusPill status={status} />
                  </td>

                  <td className="px-5 py-4 text-right">
                    {status === STATUS_VISITED ? (
                      <VisitDone />
                    ) : (
                      <RowActions
                        visit={visit}
                        masked={masked}
                        isSaving={savingId === visit.id}
                        onReschedule={onReschedule}
                        onMarkVisited={onMarkVisited}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------------- Mobile rows (spec 7.6) ----------------
          A divided list, not a tinted card stack. The leads list tints its
          cards because status is the primary signal there; here the primary
          signal is TIME, and a wash of colour per row fights the date for
          attention. The web table side-scrolls at this width — deliberately
          not reproduced. */}
      <div className="divide-y divide-border/70 md:hidden">
        {visits.map((visit) => {
          const status = toDisplayStatus(visit.status);
          const visitAt = getVisitAt(visit);
          const rep = visit.assignedUserName || "Unassigned";

          return (
            <div key={visit.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatVisitDate(visitAt)}
                  </span>
                  {visitAt && (
                    <span className="text-sm font-semibold text-slate-700">
                      {formatVisitTime(visitAt)}
                    </span>
                  )}
                </div>
                <StatusPill status={status} />
              </div>

              <p className="mt-1.5 truncate text-[15px] font-semibold text-slate-800">
                {visit.name}
              </p>
              <p className="truncate text-[13px] text-slate-500">{leadLine(visit)}</p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  <RepAvatar name={rep} size="h-6 w-6" />
                  <span className="truncate text-[13px] text-slate-600">{rep}</span>
                </span>
                {visit.phoneNumber && (
                  <span className="shrink-0 text-xs text-slate-400">
                    {maskPhone(visit.phoneNumber, masked)}
                  </span>
                )}
              </div>

              <div className="mt-3">
                {status === STATUS_VISITED ? (
                  <VisitDone />
                ) : (
                  <RowActions
                    visit={visit}
                    masked={masked}
                    isSaving={savingId === visit.id}
                    onReschedule={onReschedule}
                    onMarkVisited={onMarkVisited}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default VisitsList;

import React, { useEffect, useMemo, useState } from "react";
import Icon from "../../../components/AppIcon";
import { parseVisitDate } from "../utils/siteVisitHelpers";

/**
 * Date and time picker (spec 10). Used twice — "Reschedule site visit" from
 * a row, and "Pick visit date & time" from the schedule dialog. Same
 * component, the title differs.
 *
 * Sits at z-[120], above the schedule dialog at z-[110], because it is
 * opened from inside that dialog and must cover it.
 *
 * The platform native picker is deliberately NOT substituted: the presets,
 * the 5-minute minute step and the single Apply commit are part of the design.
 */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** All future-facing: this is a scheduling flow, not a history range.
    Day offsets, not calendar arithmetic — "Next month" is 30 days out. */
const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "In 3 days", days: 3 },
  { label: "Next week", days: 7 },
  { label: "In 2 weeks", days: 14 },
  { label: "Next month", days: 30 },
];

const sameDay = (a, b) =>
  a && b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const pad = (n) => String(n).padStart(2, "0");

const Stepper = ({ value, onChange, min, max, step = 1, label }) => {
  const [draft, setDraft] = useState(pad(value));

  useEffect(() => setDraft(pad(value)), [value]);

  // Arrows wrap, so the user never hits a dead end.
  const bump = (dir) => {
    let next = value + dir * step;
    if (next > max) next = min;
    if (next < min) next = max;
    onChange(next);
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => bump(1)}
        className="grid h-6 w-12 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#AC2334]"
      >
        <Icon name="ChevronUp" size={16} />
      </button>

      <input
        inputMode="numeric"
        aria-label={label}
        value={draft}
        onChange={(e) => {
          // At most 2 digits, non-digits stripped.
          const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
          setDraft(digits);
          const parsed = Number(digits);
          if (digits !== "" && parsed >= min && parsed <= max) onChange(parsed);
        }}
        onBlur={() => {
          // Clamp rather than reject — there is no error state.
          const parsed = Number(draft);
          if (draft === "" || Number.isNaN(parsed)) return setDraft(pad(value));
          onChange(Math.min(max, Math.max(min, parsed)));
        }}
        className="w-12 rounded-lg border border-slate-200 py-2 text-center text-base font-semibold tabular-nums text-slate-800 focus:border-[#AC2334] focus:outline-none"
      />

      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => bump(-1)}
        className="grid h-6 w-12 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#AC2334]"
      >
        <Icon name="ChevronDown" size={16} />
      </button>
    </div>
  );
};

const DateTimePicker = ({ title, value, onApply, onClose }) => {
  const initial = parseVisitDate(value);
  const now = new Date();

  const [selected, setSelected] = useState(initial);
  const [view, setView] = useState(initial || now);

  // Initial time comes from the existing visit: hour in 12-hour form (0
  // becomes 12), minutes rounded to the nearest 5. So a 14:33 visit opens
  // showing 02:35 PM.
  const [hour, setHour] = useState(() => {
    const h = initial ? initial.getHours() % 12 : 10;
    return h === 0 ? 12 : h;
  });
  const [minute, setMinute] = useState(() =>
    initial ? Math.round(initial.getMinutes() / 5) * 5 % 60 : 0,
  );
  const [meridiem, setMeridiem] = useState(() =>
    initial && initial.getHours() >= 12 ? "PM" : "AM",
  );

  /** Always 42 cells, so the grid height never changes as months page. */
  const days = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [view]);

  const stepMonth = (dir) => {
    const next = new Date(view.getFullYear(), view.getMonth() + dir, 1);
    setView(next);
  };

  const applyPreset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    setSelected(date);
    // Move the calendar to that month, so a preset never leaves the user
    // looking at a grid that does not contain their selection.
    setView(date);
  };

  const handleApply = () => {
    if (!selected) return;
    const result = new Date(selected);
    const h24 = meridiem === "PM" ? (hour % 12) + 12 : hour % 12;
    result.setHours(h24, minute, 0, 0);
    onApply(result);
  };

  const years = Array.from({ length: 8 }, (_, i) => now.getFullYear() - 1 + i);

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon name="X" size={18} />
          </button>
        </header>

        <div className="flex flex-col sm:flex-row">
          {/* Presets become a wrapping chip row above the calendar on narrow
              screens, and the divider moves from the right edge to the bottom. */}
          <div className="flex flex-row flex-wrap gap-1 border-b border-slate-100 p-3 sm:w-36 sm:flex-col sm:border-b-0 sm:border-r">
            {PRESETS.map((preset) => {
              const target = new Date();
              target.setDate(target.getDate() + preset.days);
              const isActive = sameDay(selected, target);

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset.days)}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    isActive
                      ? "bg-[#AC2334]/10 font-semibold text-[#AC2334]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-4">
            {/* Arrows bracket the selects, so the four controls read as one
                cluster rather than sitting at the panel's outer edges. */}
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => stepMonth(-1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              >
                <Icon name="ChevronLeft" size={16} />
              </button>

              <div className="relative">
                <select
                  aria-label="Month"
                  value={view.getMonth()}
                  onChange={(e) =>
                    setView(new Date(view.getFullYear(), Number(e.target.value), 1))
                  }
                  className="appearance-none rounded-lg border border-slate-200 bg-none py-1.5 pl-3 pr-9 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#AC2334] focus:outline-none"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <Icon
                  name="ChevronDown"
                  size={15}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <div className="relative">
                <select
                  aria-label="Year"
                  value={view.getFullYear()}
                  onChange={(e) =>
                    setView(new Date(Number(e.target.value), view.getMonth(), 1))
                  }
                  className="appearance-none rounded-lg border border-slate-200 bg-none py-1.5 pl-3 pr-9 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 focus:border-[#AC2334] focus:outline-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <Icon
                  name="ChevronDown"
                  size={15}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <button
                type="button"
                aria-label="Next month"
                onClick={() => stepMonth(1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700"
              >
                <Icon name="ChevronRight" size={16} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold text-slate-400">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1">{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {days.map((date) => {
                const isSelected = sameDay(date, selected);
                const isCurrentMonth = date.getMonth() === view.getMonth();
                const isToday = sameDay(date, now);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => setSelected(date)}
                    className={`mx-auto grid h-11 w-11 place-items-center rounded-lg transition-colors sm:h-9 sm:w-9 ${
                      isSelected
                        ? "bg-[#AC2334] font-semibold text-white shadow-sm"
                        : isCurrentMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-50"
                    } ${
                      // Today ring and selected fill are mutually exclusive.
                      isToday && !isSelected
                        ? "ring-1 ring-inset ring-[#AC2334]/50"
                        : ""
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5">
                <Stepper value={hour} onChange={setHour} min={1} max={12} label="Hour" />
                <span className="text-lg font-semibold text-slate-300">:</span>
                <Stepper
                  value={minute}
                  onChange={setMinute}
                  min={0}
                  max={55}
                  step={5}
                  label="Minute"
                />

                <div className="ml-1 inline-flex overflow-hidden rounded-lg border border-slate-200 text-sm font-medium">
                  {["AM", "PM"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMeridiem(m)}
                      className={`px-2.5 py-2 transition-colors ${
                        meridiem === m
                          ? "bg-[#AC2334] text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100"
                >
                  Cancel
                </button>
                {/* Time alone is never enough to apply. */}
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!selected}
                  className="rounded-lg bg-[#AC2334] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#961e2d] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;

import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/AppIcon";
import { fetchNewLeads } from "services/leads.service";
import { maskPhone, repInitials } from "../utils/siteVisitHelpers";

/**
 * Searchable, paginated lead picker (spec 12).
 *
 * Opens on FOCUS, not just on typing, and shows recent leads immediately —
 * so the control is useful before the user types anything.
 */
const PAGE_SIZE = 15;

const LeadCombobox = ({ value, onSelect, masked }) => {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | more | error
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef(null);
  const listRef = useRef(null);
  // Stale responses are discarded by request id, so the list never flickers
  // back to an older result.
  const requestRef = useRef(0);

  // Debounced 300ms: the spinner appears a beat after typing stops, not on
  // every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const load = async (targetPage, replace) => {
    const requestId = (requestRef.current += 1);
    setStatus(replace ? "loading" : "more");

    try {
      const data = await fetchNewLeads({
        limit: PAGE_SIZE,
        page: targetPage,
        filters: debounced ? { search: debounced } : {},
      });
      if (requestId !== requestRef.current) return; // stale

      const list = data?.list || [];
      setLeads((prev) => (replace ? list : [...prev, ...list]));
      setHasMore(targetPage * PAGE_SIZE < (data?.total || 0));
      setPage(targetPage);
      setStatus("idle");
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error("Lead search failed", error);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, isOpen]);

  // Close on outside click.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [isOpen]);

  const choose = (lead) => {
    onSelect(lead);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) return setIsOpen(true);
      setActiveIndex((i) => Math.min(i + 1, leads.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(leads[activeIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Keep the active option scrolled into view.
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    listRef.current
      .querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onScroll = (event) => {
    const el = event.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
    if (nearBottom && hasMore && status === "idle") load(page + 1, false);
  };

  /* ---------------- Selected state (12.1) ----------------
     The grey fill is what signals "committed"; the search state is white. */
  if (value) {
    const project = value.cProject || value.cProjectName || "—";
    const phone = maskPhone(value.phoneNumber, masked);

    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {value.name || "Unnamed lead"}
          </p>
          <p className="truncate text-xs text-slate-500">
            {[project, phone].filter(Boolean).join(" · ")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="ml-2 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-[#AC2334] transition-colors hover:bg-[#AC2334]/10"
        >
          Change
        </button>
      </div>
    );
  }

  /* ---------------- Search state (12.2) ---------------- */
  return (
    <div className="relative" ref={containerRef}>
      <Icon
        name="Search"
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="lead-combobox-list"
        aria-activedescendant={activeIndex >= 0 ? `lead-option-${activeIndex}` : undefined}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search by name, phone, email or project…"
        className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#AC2334] focus:outline-none focus:ring-2 focus:ring-[#AC2334]/10 sm:h-10"
      />

      {isOpen && (
        <div
          id="lead-combobox-list"
          role="listbox"
          ref={listRef}
          onScroll={onScroll}
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {status === "loading" ? (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
              <Icon name="Loader2" size={15} className="animate-spin" />
              Searching…
            </div>
          ) : status === "error" ? (
            <div className="flex items-center justify-between px-3 py-3 text-sm">
              <span className="text-red-600">Couldn't load leads.</span>
              <button
                type="button"
                onClick={() => load(1, true)}
                className="font-medium text-[#AC2334] hover:underline"
              >
                Retry
              </button>
            </div>
          ) : !leads.length ? (
            // Two different empty messages for two different reasons.
            <div className="px-3 py-3 text-sm text-slate-400">
              {debounced ? "No leads match your search." : "No leads found."}
            </div>
          ) : (
            <>
              {leads.map((lead, index) => (
                <button
                  key={lead.id}
                  id={`lead-option-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === activeIndex}
                  type="button"
                  onClick={() => choose(lead)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex w-full items-start justify-between gap-3 border-b border-slate-50 px-3 py-3 text-left last:border-0 sm:py-2.5 ${
                    index === activeIndex ? "bg-[#AC2334]/5" : "hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {lead.name || "Unnamed lead"}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {[
                        maskPhone(lead.phoneNumber, masked) || "No phone",
                        lead.cProject || lead.cProjectName,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>

                  {/* Grey, not the hashed palette: inside a dense picker the
                      eight-colour palette would be noise. The chip is there
                      for shape, not identity. */}
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600">
                      {repInitials(lead.assignedUserName)}
                    </span>
                    <span className="max-w-[90px] truncate text-xs text-slate-500">
                      {lead.assignedUserName || "Unassigned"}
                    </span>
                  </span>
                </button>
              ))}

              {status === "more" && (
                <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-400">
                  <Icon name="Loader2" size={14} className="animate-spin" />
                  Loading more…
                </div>
              )}

              {/* Load more exists alongside infinite scroll, as a fallback
                  for when the scroll trigger does not fire. */}
              {hasMore && status === "idle" && (
                <button
                  type="button"
                  onClick={() => load(page + 1, false)}
                  className="w-full px-3 py-2 text-center text-xs font-medium text-[#AC2334] hover:bg-slate-50"
                >
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadCombobox;

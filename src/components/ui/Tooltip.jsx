import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Icon from "../AppIcon";

/**
 * Explanation panel for a label that needs a sentence behind it.
 *
 * Rendered through a PORTAL. The obvious implementation -- an absolutely
 * positioned child of the trigger -- is clipped the moment any ancestor
 * scrolls, and the tables here sit inside `overflow-x-auto`. The symptom is a
 * panel that looks half-drawn near the right-hand columns and reads as a CSS
 * bug, so the position is measured from the trigger and the panel is drawn at
 * the top of the document instead.
 *
 * TAP, not just hover. The web build opens this on mouseenter only, which on
 * a phone means the hint never appears at all -- there is no hover on touch,
 * and these hints are the only place the page explains what "Team comparison"
 * or "Contacted" actually counts. So a tap toggles it, a tap anywhere else
 * closes it, and scrolling closes it too (the position is captured once, so a
 * panel left open would drift away from the word it describes).
 */
const WIDTH = 288; // w-72
const MARGIN = 12; // keep this clear of the viewport edge

const Tooltip = ({ title, text, children, className = "" }) => {
  const triggerRef = useRef(null);
  const [pos, setPos] = useState(null);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el || !text) return;

    const r = el.getBoundingClientRect();

    // Left-align under the trigger, but pull back inside the viewport when
    // that would overflow -- on a 360px screen almost everything would.
    let left = r.left;
    if (left + WIDTH > window.innerWidth - MARGIN) {
      left = window.innerWidth - MARGIN - WIDTH;
    }
    left = Math.max(MARGIN, left);

    // Flip above the trigger when there is not enough room below it.
    const below = window.innerHeight - r.bottom;
    const placeAbove = below < 160;

    setPos({
      left,
      top: placeAbove ? null : r.bottom + 10,
      bottom: placeAbove ? window.innerHeight - r.top + 10 : null,
      // The arrow follows the trigger even after the panel has been pulled
      // back from the edge, so it still points at what it describes.
      arrow: Math.min(Math.max(r.left + r.width / 2 - left, 16), WIDTH - 16),
      above: placeAbove,
    });
  }, [text]);

  const hide = useCallback(() => setPos(null), []);

  const toggle = useCallback(() => {
    if (pos) hide();
    else show();
  }, [pos, show, hide]);

  // Hover is bound only on devices that HAVE hover. On touch, a tap emits
  // mouseenter and THEN click, so binding both would open the panel on the
  // enter and immediately close it again on the click -- a tooltip that
  // flickers and never stays.
  const hoverCapable =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover)").matches;

  // Close on any outside tap, on scroll, and on Escape. Without the scroll
  // handler the panel stays pinned to a coordinate the trigger has left.
  useEffect(() => {
    if (!pos) return undefined;

    const onPointerDown = (event) => {
      if (!triggerRef.current?.contains(event.target)) hide();
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") hide();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", hide, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", hide, true);
    };
  }, [pos, hide]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={hoverCapable ? show : undefined}
        onMouseLeave={hoverCapable ? hide : undefined}
        onClick={toggle}
        className={`inline-flex items-center gap-1 ${text ? "cursor-help" : ""} ${className}`}
      >
        {children}
      </span>

      {pos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top ?? undefined,
              bottom: pos.bottom ?? undefined,
              width: WIDTH,
            }}
            className="pointer-events-none z-[9999] animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <div className="relative rounded-2xl border border-white/10 bg-neutral-900 p-4 shadow-2xl shadow-black/40">
              <span
                style={{ left: pos.arrow }}
                className={`absolute h-2.5 w-2.5 -translate-x-1/2 rotate-45 border-white/10 bg-neutral-900 ${
                  pos.above
                    ? "-bottom-[5px] border-b border-r"
                    : "-top-[5px] border-l border-t"
                }`}
              />

              {title && (
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Icon name="Sparkles" size={14} className="text-emerald-400" />
                  <span className="text-[13px] font-semibold normal-case tracking-normal text-emerald-400">
                    {title}
                  </span>
                </div>
              )}

              <p className="text-[13px] font-normal normal-case leading-relaxed tracking-normal text-neutral-300">
                {text}
              </p>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Tooltip;

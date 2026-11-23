import React from "react";
import { useTheme } from "../../ThemeContext";

/**
 * Sun / moon theme switch -- the control immediately left of the
 * notification bell in the header.
 *
 * ONE SVG, not two icons swapped. A swap cuts between two shapes and reads as
 * a flicker; here the sun's core shrinks away while the crescent grows out of
 * the same centre, so the two states are visibly the same object turning
 * over. The rays rotate as they retract, which is what sells it as motion
 * rather than a fade.
 *
 * The crescent is cut with a MASK rather than drawn as a path: a masked
 * circle keeps its edge perfectly round at any size, and the bite can be
 * animated by moving the masking circle, which a hand-drawn path cannot do.
 *
 * Every transition is gated behind `motion-safe:`, and the resting state is
 * the finished state -- so with reduced motion on, the control still shows
 * the correct icon, it simply arrives there without the travel.
 *
 * Sized and spaced to match the bell button beside it: 40px box, 10px icon
 * padding, so the two read as a pair rather than two unrelated controls.
 */
const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      // The label states what the tap DOES, not what the current theme is --
      // a screen reader user needs the action, and `aria-pressed` already
      // carries the state.
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={
        theme === "system"
          ? `Following system (${isDark ? "dark" : "light"})`
          : isDark
            ? "Dark theme"
            : "Light theme"
      }
      className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-full transition-all duration-300 ease-premium active:scale-95 ${
        isDark
          ? "bg-[radial-gradient(circle,#2B3350_0%,#1B2135_46%,#121725_100%)] active:shadow-[0_0_14px_4px_rgba(129,140,248,0.35)]"
          : "bg-[radial-gradient(circle,#FFFDF5_0%,#FFF4DA_46%,#FFE2A8_100%)] active:shadow-[0_0_14px_4px_rgba(251,191,36,0.40)]"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        aria-hidden="true"
        className="overflow-visible"
      >
        <defs>
          {/* Moving this circle out of the way is what opens the crescent. */}
          <mask id="theme-toggle-crescent">
            <rect x="0" y="0" width="24" height="24" fill="black" />
            <circle cx="12" cy="12" r="9" fill="white" />
            <circle
              cx={isDark ? 17.5 : 24}
              cy={isDark ? 7 : 2}
              r="8.5"
              fill="black"
              className="motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-premium"
            />
          </mask>

          <linearGradient id="theme-toggle-sun" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <linearGradient id="theme-toggle-moon" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#A5B4FC" />
          </linearGradient>
        </defs>

        {/* Rays. They rotate a sixth of a turn as they retract, so the
            collapse looks like the sun turning rather than the spokes simply
            disappearing. */}
        <g
          stroke="url(#theme-toggle-sun)"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ transformOrigin: "12px 12px" }}
          className={`motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-premium ${
            isDark ? "scale-50 opacity-0 rotate-[60deg]" : "scale-100 opacity-100 rotate-0"
          }`}
        >
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
          <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
          <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
          <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
        </g>

        {/* The body. One circle for both states: masked into a crescent in
            dark, whole in light. */}
        <circle
          cx="12"
          cy="12"
          r={isDark ? 9 : 5.5}
          fill={isDark ? "url(#theme-toggle-moon)" : "url(#theme-toggle-sun)"}
          mask="url(#theme-toggle-crescent)"
          className="motion-safe:transition-all motion-safe:duration-500 motion-safe:ease-premium"
        />

        {/* Two stars, which only exist at night. Staggered so they do not
            pulse in unison -- one blink in sync reads as a rendering glitch,
            two offset read as sky. */}
        <g
          fill="#E0E7FF"
          className={`motion-safe:transition-opacity motion-safe:duration-500 ${
            isDark ? "opacity-100 delay-200" : "opacity-0"
          }`}
        >
          <circle cx="5" cy="5.5" r="1" className="motion-safe:animate-twinkle" />
          <circle
            cx="19"
            cy="18.5"
            r="0.8"
            className="motion-safe:animate-twinkle"
            style={{ animationDelay: "900ms" }}
          />
        </g>
      </svg>
    </button>
  );
};

export default ThemeToggle;

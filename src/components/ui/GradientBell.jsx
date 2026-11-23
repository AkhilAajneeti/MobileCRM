import React from "react";

/**
 * The notification bell glyph (spec 3.1).
 *
 * Lucide renders with `currentColor`, which cannot carry a gradient, so the
 * bell is drawn inline here and stroked with the brand's three-stop
 * gradient: #F4C72B -> #34A853 (45%) -> #4295FC, strokeWidth 2, round caps.
 * The gradient id is suffixed so several bells on one page stay independent.
 */
let instance = 0;

const GradientBell = ({ size = 19, className = "" }) => {
  const gradientId = React.useMemo(() => `bell-stroke-${(instance += 1)}`, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F4C72B" />
          <stop offset="45%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#4295FC" />
        </linearGradient>
      </defs>
      <g
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.268 21a2 2 0 0 0 3.464 0" />
        <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
      </g>
    </svg>
  );
};

export default GradientBell;

import React from "react";

/**
 * The little robot on the error screen.
 *
 * Inline SVG rather than an image asset: it stays crisp at any size, costs
 * no extra request (which matters on a screen that appears when something
 * has already gone wrong), and the animation is plain CSS so the global
 * prefers-reduced-motion rule flattens it automatically.
 */
const ErrorCharacter = ({ className = "" }) => (
  <svg
    viewBox="0 0 160 176"
    role="img"
    aria-label="A friendly robot waving"
    className={className}
  >
    {/* Ground shadow — shrinks as the robot rises, to sell the float */}
    <ellipse
      cx="80"
      cy="166"
      rx="40"
      ry="7"
      fill="#0F1419"
      className="eb-shadow motion-reduce:!animate-none"
    />

    <g className="eb-float motion-reduce:!animate-none">
      {/* Antenna */}
      <line x1="80" y1="34" x2="80" y2="20" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx="80"
        cy="15"
        r="6"
        fill="#AC2334"
        className="eb-antenna motion-reduce:!animate-none"
        style={{ transformOrigin: "80px 15px" }}
      />

      {/* Head */}
      <rect x="34" y="34" width="92" height="66" rx="24" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />

      {/* Visor */}
      <rect x="46" y="48" width="68" height="38" rx="19" fill="#0F1419" />

      {/* Eyes */}
      <g className="eb-blink motion-reduce:!animate-none" style={{ transformOrigin: "80px 67px" }}>
        <circle cx="67" cy="67" r="6" fill="#7DD3FC" />
        <circle cx="93" cy="67" r="6" fill="#7DD3FC" />
      </g>

      {/* Cheeks */}
      <circle cx="44" cy="80" r="4.5" fill="#FBCFE8" opacity="0.9" />
      <circle cx="116" cy="80" r="4.5" fill="#FBCFE8" opacity="0.9" />

      {/* Body */}
      <rect x="48" y="104" width="64" height="44" rx="18" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2.5" />
      <rect x="66" y="118" width="28" height="7" rx="3.5" fill="#E2E8F0" />

      {/* Left arm */}
      <rect x="30" y="110" width="14" height="30" rx="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />

      {/* Right arm — waves */}
      <g className="eb-wave motion-reduce:!animate-none">
        <rect x="116" y="104" width="14" height="30" rx="7" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2.5" />
      </g>

      {/* Feet */}
      <rect x="58" y="146" width="18" height="9" rx="4.5" fill="#E2E8F0" />
      <rect x="84" y="146" width="18" height="9" rx="4.5" fill="#E2E8F0" />
    </g>
  </svg>
);

export default ErrorCharacter;

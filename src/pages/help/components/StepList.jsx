import React from "react";
import { brandBg } from "../theme";

const StepList = ({ items = [] }) => (
  <ol className="space-y-3 list-none">
    {items.map((step, i) => (
      <li key={i} className="flex gap-3 items-start">
        <span
          className="shrink-0 mt-0.5 w-6 h-6 rounded-full text-white text-xs font-semibold flex items-center justify-center shadow-sm"
          style={brandBg}
        >
          {i + 1}
        </span>
        <span className="text-slate-700 leading-relaxed text-[15px]">
          {step}
        </span>
      </li>
    ))}
  </ol>
);

export default StepList;

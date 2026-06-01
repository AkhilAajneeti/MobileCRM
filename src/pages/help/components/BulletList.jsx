import React from "react";
import Icon from "../../../components/AppIcon";
import { BRAND } from "../theme";

const BulletList = ({ items = [] }) => (
  <ul className="space-y-2 list-none">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2 items-start">
        <Icon
          name="Check"
          size={16}
          className="mt-1 shrink-0"
          style={{ color: BRAND }}
        />
        <span className="text-slate-700 leading-relaxed text-[15px]">
          {item}
        </span>
      </li>
    ))}
  </ul>
);

export default BulletList;

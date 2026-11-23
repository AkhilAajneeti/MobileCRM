import React from "react";
import Icon from "../AppIcon";
import { cn } from "../../utils/cn";
import { FIELD_ICON_GRADIENTS } from "../../utils/statusTokens";

/**
 * The "3D" gradient icon tile used beside every field in the lead detail
 * view (spec 2.7): h-7 w-7, rounded-[9px], inset white ring, and a white
 * 13px glyph with a soft drop shadow.
 */
const FieldIcon = ({ name, tone = "slate", className = "" }) => (
  <div
    className={cn(
      "grid h-7 w-7 shrink-0 place-items-center rounded-[9px] shadow-sm ring-1 ring-inset ring-white/25",
      FIELD_ICON_GRADIENTS[tone] || FIELD_ICON_GRADIENTS.slate,
      className
    )}
  >
    <Icon name={name} size={13} className="text-white drop-shadow-sm" />
  </div>
);

export default FieldIcon;

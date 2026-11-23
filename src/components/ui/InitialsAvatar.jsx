import React from "react";
import { cn } from "../../utils/cn";
import { getAvatarColor, getInitials } from "../../utils/statusTokens";

/**
 * Deterministic initials avatar (spec 2.5). A person's colour is derived
 * from their name hash, so it is identical on the list, the detail header
 * and any chart -- never random, never per-mount.
 */
const InitialsAvatar = ({ name, size = 40, className = "", style }) => {
  const initials = getInitials(name);
  const background = getAvatarColor(name);

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-sm",
        className
      )}
      style={{
        width: size,
        height: size,
        background,
        fontSize: Math.max(8, Math.round(size * 0.36)),
        ...style,
      }}
      aria-hidden="true"
      title={name || undefined}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar;

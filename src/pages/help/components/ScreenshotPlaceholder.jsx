import React from "react";
import Icon from "../../../components/AppIcon";
import { BRAND_SOFT } from "../theme";

/**
 * Visual placeholder for documentation screenshots. The label appears below the
 * frame so authors can ship articles before assets are produced; real images
 * can replace the gradient block later by adding a `src` prop.
 */
const ScreenshotPlaceholder = ({ label, src, alt }) => (
  <figure className="my-2">
    <div
      className="aspect-[16/9] rounded-xl border border-border flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #fafafa 0%, ${BRAND_SOFT} 100%)`,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={alt || label}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center text-slate-400">
          <Icon name="Image" size={28} className="mb-1.5" />
          <span className="text-xs font-medium">Screenshot</span>
        </div>
      )}
    </div>
    {label && (
      <figcaption className="text-xs text-slate-500 mt-2 text-center italic">
        {label}
      </figcaption>
    )}
  </figure>
);

export default ScreenshotPlaceholder;

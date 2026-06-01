/**
 * Help Center brand theme.
 *
 * The Help Center uses ONE brand gradient (black → crimson) everywhere a
 * "brand" moment belongs: hero text, primary CTAs, active-state accents,
 * step-number bubbles, etc.
 *
 * Semantic colors (info / tip / success / warning in NoteCard) are NOT
 * branded — they communicate meaning, not affiliation.
 */

// Hex of the deep-crimson end-stop. Use it directly for borders, text
// accents, icons, and rgba shadows.
export const BRAND = "#AC2334";

// Soft tint of the brand for card backgrounds and subtle highlights.
// Roughly matches Tailwind rose-50 with a hint more saturation.
export const BRAND_SOFT = "#FBE9EC";

// Inline-style strings for the brand gradient.
export const BRAND_GRADIENT = "linear-gradient(52deg, #000000, #AC2334)";

export const brandBg = { background: BRAND_GRADIENT };

export const brandTextGradient = {
  background: BRAND_GRADIENT,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

// rgba shadow that matches the brand crimson — used on hover lifts.
export const BRAND_SHADOW = "0 8px 24px -12px rgba(172, 35, 52, 0.35)";

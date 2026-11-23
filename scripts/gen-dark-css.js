/**
 * Generates src/styles/dark.css -- the dark-mode compatibility layer.
 *
 * Run from the project root:  node scripts/gen-dark-css.js
 *
 * Reason it exists: most of the app is built on the design tokens, which the
 * `.dark` block in tailwind.css flips on its own. But a few hundred utilities
 * across the pages name a literal palette colour (bg-white, text-slate-500,
 * bg-emerald-50 …). Those do not flip, and in dark mode they are bright
 * rectangles on a near-black page.
 *
 * Rather than hand-editing several hundred call sites, the neutral scale and
 * the pale tint steps are remapped once, under `.dark`, for exactly the
 * classes the source actually uses. Scanning first keeps the sheet small and
 * means nothing unused ships.
 *
 * Specificity: `.dark .bg-white` (0,2,0) beats `.bg-white` (0,1,0), so source
 * order does not matter.
 */
const fs = require("fs");
const path = require("path");
const colors = require("tailwindcss/colors");

const SRC = path.join(process.cwd(), "src");
const OUT = path.join(SRC, "styles", "dark.css");

const NEUTRALS = ["slate", "gray", "zinc", "neutral", "stone"];
const HUES = [
  "red", "rose", "orange", "amber", "yellow", "lime", "green", "emerald",
  "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia",
  "pink",
];

// ---------------------------------------------------------------------------
// Collect every palette utility actually present in the source.
// ---------------------------------------------------------------------------
const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const source = walk(SRC).map((f) => fs.readFileSync(f, "utf8")).join("\n");

const ALL = [...NEUTRALS, ...HUES].join("|");
const RE = new RegExp(
  `\\b(bg|text|border|ring|divide|from|via|to)-(${ALL})-(50|100|200|300|400|500|600|700|800|900)(\\/(?:\\d{1,3}))?\\b`,
  "g",
);

const used = new Map(); // class string -> {prop, hue, step, alpha}
let m;
while ((m = RE.exec(source))) {
  const [cls, prop, hue, step, alphaRaw] = m;
  used.set(cls, { prop, hue, step: Number(step), alpha: alphaRaw ? alphaRaw.slice(1) : null });
}

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------
const rgb = (hex) => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(" ");
};

const esc = (cls) => cls.replace("/", "\\/");

// Pale tint backgrounds become a translucent wash of the SAME hue over the
// dark surface, so a green badge is still green and still legibly a badge.
const TINT_ALPHA = { 50: 0.14, 100: 0.18, 200: 0.24, 300: 0.3 };

// Dark-surface steps for the neutral scale, matching the token ladder in
// tailwind.css (card #171C23, muted #1E242D, one step up, two steps up).
const NEUTRAL_BG = {
  50: "23 28 35",
  100: "30 36 45",
  200: "38 45 56",
  300: "47 55 67",
  400: "61 70 84",
};

const rules = [];
const add = (selector, body) => rules.push(`${selector} {\n${body}\n}`);

for (const [cls, { prop, hue, step, alpha }] of [...used.entries()].sort()) {
  const isNeutral = NEUTRALS.includes(hue);
  const sel = `.dark .${esc(cls)}`;
  const a = alpha ? Number(alpha) / 100 : null;

  if (prop === "bg" || prop === "divide") {
    const property = prop === "bg" ? "background-color" : "border-color";
    if (isNeutral) {
      if (step > 400) continue; // 500+ neutrals are already dark enough
      const channels = NEUTRAL_BG[step];
      add(sel, `  ${property}: rgb(${channels}${a != null ? ` / ${a}` : ""});`);
    } else {
      if (step > 300) continue; // saturated fills read fine on dark
      const base = rgb(colors[hue][400]);
      const tint = TINT_ALPHA[step] * (a != null ? a : 1);
      add(sel, `  ${property}: rgb(${base} / ${tint.toFixed(3)});`);
    }
    continue;
  }

  if (prop === "text") {
    if (isNeutral) {
      // Dark greys are body text in the light theme; they have to come back
      // up above the surface rather than down into it.
      if (step >= 600) add(sel, `  color: rgb(var(--color-foreground-rgb)${a != null ? ` / ${a}` : ""});`);
      else if (step >= 400) add(sel, `  color: rgb(var(--color-muted-foreground-rgb)${a != null ? ` / ${a}` : ""});`);
      // 50–300 are light text, usually ON a coloured fill — leave them.
      continue;
    }
    // Coloured text: 500 and darker are set against white in the light theme
    // and vanish on dark, so they move up the ramp instead.
    if (step >= 600) add(sel, `  color: ${colors[hue][300]};`);
    else if (step === 500) add(sel, `  color: ${colors[hue][400]};`);
    continue;
  }

  if (prop === "border" || prop === "ring") {
    const property = prop === "border" ? "border-color" : "--tw-ring-color";
    if (isNeutral) {
      if (step > 400) continue;
      add(sel, `  ${property}: rgb(var(--color-border-rgb)${a != null ? ` / ${a}` : ""});`);
    } else {
      if (step > 300) continue;
      const base = rgb(colors[hue][400]);
      const borderAlpha = 0.3 * (a != null ? a : 1);
      add(sel, `  ${property}: rgb(${base} / ${borderAlpha.toFixed(3)});`);
    }
    continue;
  }

  // Gradient stops. Only the pale end needs help; 400+ stops are saturated
  // and read correctly on a dark surface. Each stop sets its own custom
  // property, which is why the alpha variants need their own rules.
  if (prop === "from" || prop === "via" || prop === "to") {
    if (step > 200) continue;
    const base = isNeutral ? NEUTRAL_BG[step] : rgb(colors[hue][400]);
    const stopAlpha = (isNeutral ? 1 : TINT_ALPHA[step]) * (a != null ? a : 1);
    const value = `rgb(${base} / ${stopAlpha.toFixed(3)})`;
    // ONLY the one custom property each utility owns.
    //
    // Tailwind's `from-*` also resets `--tw-gradient-to` to a transparent
    // copy of itself, so a from-only gradient fades out. Repeating that here
    // would break every `from-<tint> to-background` pair in the app: this
    // rule is `.dark .from-x` (0,2,0) while `to-background` is only (0,1,0),
    // so the reset would win and the gradient would fade to transparent
    // instead of to the page colour. Leaving it out keeps Tailwind's own
    // lower-specificity declaration, which is what should apply when there
    // is no `to-*` to override it.
    if (prop === "from") {
      add(sel, `  --tw-gradient-from: ${value} var(--tw-gradient-from-position);`);
    } else if (prop === "to") {
      add(sel, `  --tw-gradient-to: ${value} var(--tw-gradient-to-position);`);
    } else {
      add(
        sel,
        `  --tw-gradient-stops: var(--tw-gradient-from), ${value} var(--tw-gradient-via-position), var(--tw-gradient-to);`,
      );
    }
  }
}

const header = `/*
 * GENERATED by scripts/gen-dark-css.js -- do not hand-edit; regenerate.
 *
 * Dark-mode compatibility layer for utilities that name a literal palette
 * colour instead of a design token. The tokens themselves flip in
 * tailwind.css; this sheet covers bg-white, the neutral greys and the pale
 * tint steps that would otherwise stay bright on a near-black page.
 *
 * Only classes found in src/ are emitted, so this file tracks what the app
 * actually uses.
 *
 * ${rules.length} rules.
 */

/* Plain white surfaces become the card surface. The ALPHA variants
   (bg-white/10 and friends) are deliberately untouched: those are highlight
   overlays on coloured fills, and they do the same job in either theme. */
.dark .bg-white {
  background-color: rgb(var(--color-card-rgb));
}

.dark .border-white {
  border-color: rgb(var(--color-border-rgb));
}

/* Shadows are nearly invisible on a dark surface, so elevation comes from a
   hairline instead. Applied to the shadow utilities the app uses most. */
.dark .shadow-sm,
.dark .shadow,
.dark .shadow-md,
.dark .shadow-lg {
  box-shadow: 0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 2px 8px rgb(0 0 0 / 0.45);
}

`;

fs.writeFileSync(OUT, header + rules.join("\n\n") + "\n", "utf8");
console.log(`wrote ${OUT} — ${rules.length} rules from ${used.size} classes found`);

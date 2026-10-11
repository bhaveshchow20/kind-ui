import { extendTailwindMerge } from "tailwind-merge";

// These two arbitrary properties preserve token fallbacks and gradient backgrounds.
// Resolve them against their familiar utilities so the later consumer class wins.
const mergeClasses = extendTailwindMerge<"arbitrary..background" | "arbitrary..font-family">({
  extend: {
    conflictingClassGroups: {
      "arbitrary..background": ["bg-color", "bg-image"],
      "bg-color": ["arbitrary..background"],
      "bg-image": ["arbitrary..background"],
      "arbitrary..font-family": ["font-family"],
      "font-family": ["arbitrary..font-family"],
    },
  },
});

/** Consumer utilities win their Tailwind groups; custom classes remain intact. */
export function chartClasses(...values: (string | undefined | false)[]) {
  return mergeClasses(values.filter(Boolean).join(" "));
}

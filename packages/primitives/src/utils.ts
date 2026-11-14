import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const mergeClasses = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "ai-meta",
        "ai-description",
        "ai-label",
        "ai-title",
        "ai-body",
        "ai-prose",
        "kind-meta",
        "kind-description",
        "kind-label",
        "kind-title",
        "kind-body",
        "kind-prose",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return mergeClasses(clsx(inputs));
}

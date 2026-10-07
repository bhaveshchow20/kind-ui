"use client";
import { useEffect } from "react";
import { publicPath } from "@/lib/routing.mjs";

const customizationSections: Record<string, string> = {
  loading: "/docs/chart-components/root/#loading",
  "labels-theme-colors-and-diagnostics":
    "/docs/chart-components/series-config/#labels-theme-colors-and-diagnostics",
  "series-patterns-and-projected-bars": "/docs/components/bar/#series-patterns-and-projected-bars",
  "percentage-stacks": "/docs/components/combo/#percentage-stacks",
  "point-markers-dashed-lines-and-reveal-direction":
    "/docs/components/line/#point-markers-dashed-lines-and-reveal-direction",
  "decorative-backgrounds": "/docs/components/line/#decorative-backgrounds",
  "pie-initial-inspection-and-selective-glow": "/docs/components/pie/#initial-tooltip",
  "sankey-labels-and-icons": "/docs/components/sankey/#sankey-labels-and-icons",
  "shared-legend-and-mark-interactions": "/docs/chart-components/root/#interaction-and-eligibility",
  materials: "/docs/guides/materials/",
};
export function LegacyDocRedirect({ guide }: { guide: string }) {
  useEffect(() => {
    const section = window.location.hash.slice(1);
    const target =
      guide === "customization"
        ? (customizationSections[section] ?? "/docs/components/line/")
        : "/docs/concepts/identity/";
    window.location.replace(publicPath(target));
  }, [guide]);
  return null;
}

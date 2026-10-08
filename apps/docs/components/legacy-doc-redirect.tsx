"use client";
import { useEffect } from "react";
import { publicPath } from "@/lib/routing.mjs";

const customizationSections: Record<string, string> = {
  loading: "/docs/chart-components/root/#loading",
  "labels-theme-colors-and-diagnostics":
    "/docs/chart-components/series-config/#labels-theme-colors-and-diagnostics",
  "series-patterns-and-projected-bars": "/docs/components/bar/#series-patterns",
  "percentage-stacks": "/docs/components/combo/#percentage-stacks",
  "point-markers-dashed-lines-and-reveal-direction":
    "/docs/components/line/#point-markers-dashed-lines-and-reveal-direction",
  "decorative-backgrounds": "/docs/components/line/#decorative-backgrounds",
  "pie-initial-inspection-and-selective-glow": "/docs/components/pie/#initial-tooltip",
  "sankey-labels-and-icons": "/docs/components/sankey/#sankey-labels-and-icons",
  "shared-legend-and-mark-interactions": "/docs/chart-components/root/#interaction-and-eligibility",
  materials: "/docs/guides/materials/",
};
const quickstartSections: Record<string, string> = {
  "install-charts": "install-the-package",
  "copy-the-complete-component": "build-your-first-chart",
  "render-the-chart": "render-the-chart",
  "use-your-own-data": "use-your-own-data",
  composition: "composition",
  "trends-with-line": "build-your-first-chart",
  "comparisons-with-bar": "composition",
  "pick-the-family-composition": "composition",
};
export function LegacyDocRedirect({ guide }: { guide: string }) {
  useEffect(() => {
    const section = window.location.hash.slice(1);
    const target =
      guide === "customization"
        ? (customizationSections[section] ?? "/docs/components/line/")
        : guide === "quickstart"
          ? `/docs/installation/#${quickstartSections[section] ?? (section || "build-your-first-chart")}`
          : guide === "composition"
            ? "/docs/installation/#composition"
            : guide === "release"
              ? "/docs/installation/#upgrading"
              : "/docs/concepts/identity/";
    window.location.replace(publicPath(target));
  }, [guide]);
  return null;
}

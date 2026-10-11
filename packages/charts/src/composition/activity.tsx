"use client";

import {
  ActivityLabels,
  ActivitySeries,
  ActivityTooltip,
  ActivityRings as NativeActivityRings,
} from "../activity-rings.js";

import { FamilyLegend, OutsidePlot } from "../family-root.js";

export const ActivityRings = /* @__PURE__ */ Object.assign(NativeActivityRings, {
  Content: OutsidePlot,
  Series: ActivitySeries,
  Labels: ActivityLabels,
  Tooltip: ActivityTooltip,
  Legend: FamilyLegend,
});

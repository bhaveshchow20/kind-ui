"use client";

import {
  ActivityLabels,
  ActivitySeries,
  ActivityTooltip,
  ActivityRings as NativeActivityRings,
} from "../activity-rings.js";

import { FamilyLegend } from "../family-root.js";

export const ActivityRings = /* @__PURE__ */ Object.assign(NativeActivityRings, {
  Series: ActivitySeries,
  Labels: ActivityLabels,
  Tooltip: ActivityTooltip,
  Legend: FamilyLegend,
});

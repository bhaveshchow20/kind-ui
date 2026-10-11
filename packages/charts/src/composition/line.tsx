"use client";

import { LineSeries } from "../animation.js";
import { LineChart as ConfiguredLineChart } from "../configured-line-chart.js";
import { cartesian } from "./parts.js";

export const LineChart = /* @__PURE__ */ Object.assign(ConfiguredLineChart, {
  ...cartesian,
  Series: LineSeries,
});

"use client";

import {
  CompoundSankeyLegend,
  CompoundSankeyTable,
  SankeyChart as NativeSankeyChart,
  SankeyComposition,
  SankeyLinks,
  SankeyNodes,
} from "../sankey-composition.js";
import { SankeyLink, SankeyNode } from "../sankey-marks.js";
import { SankeyNodeLabel } from "../sankey-node-label.js";

export const SankeyChart = /* @__PURE__ */ Object.assign(NativeSankeyChart, {
  Nodes: SankeyNodes,
  Links: SankeyLinks,
  Legend: CompoundSankeyLegend,
  Table: CompoundSankeyTable,
  Node: SankeyNode,
  Link: SankeyLink,
  NodeLabel: SankeyNodeLabel,
  Tooltip: SankeyComposition.Tooltip,
});

import * as Kind from "@kind-ui/charts";
import { createRoot } from "react-dom/client";
import * as Native from "recharts";
import { Compositions, NamespaceCompositions } from "./host.js";

// Independent native supporting-part oracle; never expose competing roots publicly.
const baseline = {
  ...Kind,
  Brush: Native.Brush,
  CartesianGrid: Native.CartesianGrid,
  Cell: Native.Cell,
  ErrorBar: Native.ErrorBar,
  Label: Native.Label,
  LabelList: Native.LabelList,
  PolarAngleAxis: Native.PolarAngleAxis,
  PolarGrid: Native.PolarGrid,
  PolarRadiusAxis: Native.PolarRadiusAxis,
  ReferenceArea: Native.ReferenceArea,
  ReferenceDot: Native.ReferenceDot,
  ReferenceLine: Native.ReferenceLine,
  ResponsiveContainer: Native.ResponsiveContainer,
  Symbols: Native.Symbols,
  XAxis: Native.XAxis,
  YAxis: Native.YAxis,
  ZAxis: Native.ZAxis,
};
const root = document.getElementById("root");
if (!root) throw new Error("Missing root container");
createRoot(root).render(
  <>
    <div data-import="named">
      <Compositions />
    </div>
    <div data-import="namespace">
      <NamespaceCompositions />
    </div>
    <div data-import="native">
      <Compositions api={baseline} />
    </div>
  </>,
);

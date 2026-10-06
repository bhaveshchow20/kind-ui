"use client";

import * as Chart from "@kind-ui/charts";
import {
  Brush,
  CartesianGrid,
  Cell,
  ErrorBar,
  Label,
  LabelList,
  Legend,
  LineChart,
  LineSeries,
  PieChart,
  PieSeries,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadarChart,
  RadarSeries,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Root,
  ScatterChart,
  ScatterSeries,
  Symbols,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "@kind-ui/charts";
import { useState } from "react";

const rows = [
  { category: "A", value: 20, x: 1, y: 4, z: 10, error: 1 },
  { category: "B", value: 40, x: 2, y: 8, z: 30, error: 2 },
  { category: "C", value: 30, x: 3, y: 6, z: 20, error: 1 },
];
const config = { value: { label: "Value", color: "#4055ee" } };
const parts = {
  Brush,
  CartesianGrid,
  Cell,
  ErrorBar,
  Label,
  LabelList,
  Legend,
  LineChart,
  LineSeries,
  PieChart,
  PieSeries,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadarChart,
  RadarSeries,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Root,
  ScatterChart,
  ScatterSeries,
  Symbols,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
};

// This host only composes public Components. The baseline swaps supporting parts
// for their engine identities; chart roots/series and props remain identical.
export function Compositions({ api = parts }: { api?: typeof parts }) {
  const C = api;
  const [clicks, setClicks] = useState(0);
  const [range, setRange] = useState("");
  const [width, setWidth] = useState(460);
  return (
    <section style={{ width }}>
      <button type="button" onClick={() => setWidth(width === 460 ? 360 : 460)}>
        Resize
      </button>
      <output data-clicks>{clicks}</output>
      <output data-range>{range}</output>
      <C.Root config={config}>
        <div data-family="line">
          <C.ResponsiveContainer width="100%" height={280}>
            <C.LineChart
              data={rows}
              animate={false}
              accessibilityLayer
              aria-label="Line composition"
              ref={(node) => {
                if (node) node.dataset.compositionRef = "attached";
              }}
            >
              <C.CartesianGrid />
              <C.XAxis dataKey="category" onClick={() => setClicks((count) => count + 1)}>
                <C.Label value="Category" position="insideBottom" />
              </C.XAxis>
              <C.YAxis />
              <C.ReferenceArea y1={10} y2={15} />
              <C.ReferenceDot x="B" y={40} r={4} />
              <C.ReferenceLine y={25} />
              <C.LineSeries dataKey="value">
                <C.LabelList dataKey="value" />
                <C.ErrorBar dataKey="error" />
              </C.LineSeries>
              <C.Brush
                dataKey="category"
                height={30}
                onChange={(next) => setRange(`${next.startIndex}:${next.endIndex}`)}
              />
              <C.Tooltip />
            </C.LineChart>
          </C.ResponsiveContainer>
        </div>
        <div data-family="radar">
          <C.RadarChart
            data={rows}
            width={340}
            height={280}
            animate={false}
            accessibilityLayer
            aria-label="Radar composition"
          >
            <C.PolarGrid />
            <C.PolarAngleAxis dataKey="category" />
            <C.PolarRadiusAxis domain={[0, 50]} />
            <C.RadarSeries dataKey="value" />
            <C.Tooltip />
          </C.RadarChart>
        </div>
        <div data-family="scatter">
          <C.ScatterChart
            width={340}
            height={280}
            animate={false}
            accessibilityLayer
            aria-label="Scatter composition"
          >
            <C.CartesianGrid />
            <C.XAxis type="number" dataKey="x" />
            <C.YAxis type="number" dataKey="y" />
            <C.ZAxis dataKey="z" range={[30, 150]} />
            <C.ScatterSeries
              data={rows}
              seriesKey="value"
              shape={<C.Symbols type="diamond" />}
              onClick={() => setClicks((count) => count + 1)}
            >
              <C.Cell fill="#123456" />
              <C.Cell fill="#234567" />
              <C.Cell fill="#345678" />
              <C.LabelList dataKey="y" position="top" />
            </C.ScatterSeries>
            <C.Tooltip />
          </C.ScatterChart>
        </div>
        <div data-family="pie">
          <C.PieChart
            width={340}
            height={280}
            animate={false}
            accessibilityLayer
            aria-label="Pie composition"
          >
            <C.PieSeries
              data={rows}
              dataKey="value"
              nameKey="category"
              innerRadius={30}
              onClick={() => setClicks((count) => count + 1)}
            >
              <C.Cell fill="#123456" />
              <C.Cell fill="#234567" />
              <C.Cell fill="#345678" />
              <C.Label value="Total" position="center" />
              <C.LabelList dataKey="category" position="outside" />
            </C.PieSeries>
            <C.Tooltip />
          </C.PieChart>
        </div>
        <C.Legend />
      </C.Root>
    </section>
  );
}

export function NamespaceCompositions() {
  return <Compositions api={Chart} />;
}

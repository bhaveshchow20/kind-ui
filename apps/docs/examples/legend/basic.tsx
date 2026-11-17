"use client";

import { LineChart, type SeriesConfig } from "@kind-ui/charts";

const data = [
  { month: "Jan", web: 420, ios: 310, android: 260 },
  { month: "Feb", web: 470, ios: 340, android: 300 },
  { month: "Mar", web: 450, ios: 390, android: 330 },
  { month: "Apr", web: 530, ios: 420, android: 380 },
  { month: "May", web: 580, ios: 470, android: 400 },
  { month: "Jun", web: 640, ios: 510, android: 450 },
];

const config = {
  web: { label: "Web", color: "#733bff" },
  ios: { label: "iOS", color: "#0f8b8d" },
  android: { label: "Android", color: "#e07a2f" },
} satisfies SeriesConfig;

export default function SignupsChart() {
  return (
    <LineChart
      data={data}
      config={config}
      interaction={{ kind: "series", mode: "visibility", eligibleKeys: Object.keys(config) }}
      defaultVisibleSeries={["web", "ios", "android"]}
      margin={{ right: 16 }}
      aria-label="Monthly sign-ups by platform"
    >
      <LineChart.Grid />
      <LineChart.XAxis dataKey="month" />
      <LineChart.YAxis width={40} />
      <LineChart.Series dataKey="web" />
      <LineChart.Series dataKey="ios" />
      <LineChart.Series dataKey="android" />
      <LineChart.Tooltip />
      <LineChart.Legend />
    </LineChart>
  );
}

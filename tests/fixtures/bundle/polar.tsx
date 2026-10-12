import { RadarChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

const rows = [
  { subject: "Math", score: 12 },
  { subject: "Science", score: 30 },
];
createRoot(document.createElement("div")).render(
  <RadarChart
    data={rows}
    config={{ score: { label: "Score", color: "#537f76" } }}
    width={600}
    height={260}
    aria-label="Subject scores"
  >
    <RadarChart.Grid />
    <RadarChart.AngleAxis dataKey="subject" />
    <RadarChart.RadiusAxis />
    <RadarChart.Series dataKey="score" />
    <RadarChart.Tooltip />
    <RadarChart.Legend />
  </RadarChart>,
);

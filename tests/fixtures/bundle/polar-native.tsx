import { createRoot } from "react-dom/client";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip,
} from "recharts";

const rows = [
  { subject: "Math", score: 12 },
  { subject: "Science", score: 30 },
];
createRoot(document.createElement("div")).render(
  <RadarChart data={rows} width={600} height={260} aria-label="Subject scores">
    <PolarGrid />
    <PolarAngleAxis dataKey="subject" />
    <PolarRadiusAxis />
    <Radar dataKey="score" name="Score" stroke="#537f76" />
    <Tooltip />
    <Legend />
  </RadarChart>,
);

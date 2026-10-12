import { LineChart } from "@kind-ui/charts";
import { createRoot } from "react-dom/client";

const rows = [
  { month: "Jan", sales: 12 },
  { month: "Feb", sales: 30 },
];
createRoot(document.createElement("div")).render(
  <LineChart
    data={rows}
    config={{ sales: { label: "Sales", color: "#537f76" } }}
    width={600}
    height={260}
    aria-label="Monthly sales"
  >
    <LineChart.Grid />
    <LineChart.XAxis dataKey="month" />
    <LineChart.YAxis />
    <LineChart.Series dataKey="sales" />
    <LineChart.Tooltip />
    <LineChart.Legend />
  </LineChart>,
);

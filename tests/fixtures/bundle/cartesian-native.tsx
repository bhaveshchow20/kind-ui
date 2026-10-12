import { createRoot } from "react-dom/client";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

const rows = [
  { month: "Jan", sales: 12 },
  { month: "Feb", sales: 30 },
];
createRoot(document.createElement("div")).render(
  <LineChart data={rows} width={600} height={260} aria-label="Monthly sales">
    <CartesianGrid />
    <XAxis dataKey="month" />
    <YAxis />
    <Line dataKey="sales" name="Sales" stroke="#537f76" />
    <Tooltip />
    <Legend />
  </LineChart>,
);

import { createRoot } from "react-dom/client";
import { Sankey } from "recharts";

createRoot(document.createElement("div")).render(
  <Sankey
    data={{
      nodes: [{ name: "Input" }, { name: "Output" }],
      links: [{ source: 0, target: 1, value: 12 }],
    }}
    width={600}
    height={260}
    aria-label="Resource flow"
  />,
);

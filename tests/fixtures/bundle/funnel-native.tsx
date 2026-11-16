import { createRoot } from "react-dom/client";
import { Funnel, FunnelChart } from "recharts";

createRoot(document.createElement("div")).render(
  <FunnelChart width={600} height={260} aria-label="Ordered stages">
    <Funnel
      data={[
        { name: "Started", value: 100 },
        { name: "Finished", value: 40 },
      ]}
      dataKey="value"
      isAnimationActive={false}
      lastShapeType="rectangle"
    />
  </FunnelChart>,
);

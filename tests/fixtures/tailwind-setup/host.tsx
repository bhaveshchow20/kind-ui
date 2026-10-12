import * as Chart from "@kind-ui/charts";
import { useEffect } from "react";

export function TailwindHost() {
  useEffect(() => {
    document.body.dataset.hydrated = "true";
  }, []);
  return (
    <Chart.HeatmapChart
      rows={[]}
      columns={[]}
      data={[]}
      scale={Chart.createHeatmapScale({ domain: [0, 1], colors: ["#ffffff", "#000000"] })}
      aria-label="Metadata chart"
      config={{}}
    >
      Chart
    </Chart.HeatmapChart>
  );
}

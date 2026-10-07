// Unrun consumer entry: copy to an isolated packed-package Remotion consumer.
import { LineChart, type SeriesConfig } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";
import { Composition, registerRoot, useCurrentFrame } from "remotion";

const before = [
  { day: "Mon", tasks: 4 },
  { day: "Tue", tasks: 12 },
  { day: "Wed", tasks: 8 },
];
const after = [
  { day: "Mon", tasks: 8 },
  { day: "Tue", tasks: 6 },
  { day: "Wed", tasks: 16 },
];
const config = { tasks: { label: "Tasks", color: "#3659b8" } } satisfies SeriesConfig;

// Consumer choreography only. No chart progress prop, geometry morph or wall clock.
export function FrameCharts({
  frame,
  reducedMotion = false,
}: {
  frame: number;
  reducedMotion?: boolean;
}) {
  const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, frame / 60));
  return (
    <div style={{ width: 640, height: 360, background: "white", position: "relative" }}>
      <div aria-hidden="true" style={{ pointerEvents: "none" }}>
        {[before, after].map((data, index) => (
          <div
            key={index === 0 ? "before" : "after"}
            style={{
              position: "absolute",
              inset: 0,
              opacity: index === 0 ? 1 - progress : progress,
            }}
          >
            <LineChart
              config={config}
              data={data}
              xDataKey="day"
              aria-label={index === 0 ? "Before" : "After"}
              animate={false}
              tooltip={false}
              legend={false}
              responsive={false}
              accessibilityLayer={false}
              width={640}
              height={300}
              curve="linear"
              material="plain"
              yAxis={{ domain: [0, 20], ticks: [0, 5, 10, 15, 20], width: 40 }}
            />
          </div>
        ))}
      </div>
      <p style={{ position: "absolute", bottom: 0, margin: 12 }}>
        Final tasks: Monday 8, Tuesday 6, Wednesday 16.
      </p>
    </div>
  );
}

function Video() {
  return <FrameCharts frame={useCurrentFrame()} />;
}

function RemotionRoot() {
  return (
    <Composition
      id="ExternalProgress"
      component={Video}
      durationInFrames={90}
      fps={30}
      width={640}
      height={360}
    />
  );
}

registerRoot(RemotionRoot);

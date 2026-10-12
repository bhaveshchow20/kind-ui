import {
  createFunnelModel,
  type FunnelAccessors,
  FunnelChart,
  type FunnelDatum,
} from "@kind-ui/charts";

interface Application {
  key: string;
  title: string;
  candidates: number | null;
  medianDays: number;
}
const applications: readonly Application[] = [
  { key: "review", title: "Review", candidates: 12, medianDays: 3 },
];
const accessors = {
  id: (row: Application) => row.key,
  label: (row: Application) => row.title,
  value: (row: Application) => row.candidates,
} satisfies FunnelAccessors<Application>;
const model = createFunnelModel({ data: applications, accessors, denominator: "first" });
const original: Application | undefined = model.stages[0]?.datum;
void original;
void (
  <FunnelChart
    data={applications}
    accessors={accessors}
    config={{ review: { color: "red" } }}
    aria-label="Application inventory"
    denominator={24}
    ratioLabel="Share of capacity"
    activeId="review"
    onActiveIdChange={(id) => {
      const key: string | null = id;
      void key;
    }}
  >
    <FunnelChart.Stages<Application>
      Shape={({ stage, geometry, fill, active, selected }) => (
        <polygon
          points={geometry.points.map(([x, y]) => `${x},${y}`).join(" ")}
          fill={fill}
          data-days={stage.datum.medianDays}
          data-state={`${active}/${selected}`}
        />
      )}
    />
    <FunnelChart.Labels<Application> render={(stage) => stage.datum.medianDays} />
    <FunnelChart.Tooltip<Application> />
    <FunnelChart.DataTable<Application>
      caption="Application inventory"
      columns={[{ id: "days", header: "Median days", render: (stage) => stage.datum.medianDays }]}
    />
  </FunnelChart>
);
const standard: readonly FunnelDatum[] = [
  { id: "zero", label: "Zero", value: 0 },
  { id: "unknown", label: "Unknown", value: null },
];
void (
  <FunnelChart
    data={standard}
    config={{ zero: { color: "red" }, unknown: { color: "blue" } }}
    aria-label="Stages"
  >
    <FunnelChart.Stages geometry="trapezoid" />
  </FunnelChart>
);
void (
  (
    // @ts-expect-error Generic records require accessors.
    <FunnelChart data={applications} config={{}} aria-label="Applications">
      {null}
    </FunnelChart>
  )
);
// @ts-expect-error Values remain numeric, never numeric strings.
createFunnelModel({ data: [{ id: "a", label: "A", value: "12" }] });
// @ts-expect-error Stage identity is a stable string.
createFunnelModel({ data: [{ id: 1, label: "A", value: 12 }] });
// @ts-expect-error Callback retains original typed record.
const lost: string | undefined = model.stages[0]?.datum;
void lost;
// @ts-expect-error The chart has no additional frame root.
void FunnelChart.Root;
void (
  (
    // @ts-expect-error A neck cannot silently distort numeric proportions.
    <FunnelChart data={standard} config={{}} aria-label="Stages" neckWidth={20}>
      {null}
    </FunnelChart>
  )
);
void (
  (
    // @ts-expect-error Sorting is consumer-owned.
    <FunnelChart data={standard} config={{}} aria-label="Stages" sort="descending">
      {null}
    </FunnelChart>
  )
);
// @ts-expect-error Only boundary-width taper and rectangles are promised.
void (<FunnelChart.Stages geometry="area" />);

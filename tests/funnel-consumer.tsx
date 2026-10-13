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

// Empty data is a valid supplied dataset without generic accessors.
void (
  <FunnelChart data={[]} config={{}} aria-label="Empty stages">
    <FunnelChart.Stages />
    <FunnelChart.DataTable caption="Empty stages" />
  </FunnelChart>
);

// @ts-expect-error The Tooltip owns its ID and stage description linkage.
void (<FunnelChart.Tooltip id="consumer-tooltip" />);
// @ts-expect-error The Tooltip owns its semantic role.
void (<FunnelChart.Tooltip role="status" />);

const ownedRole = { className: "consumer", role: "status" };
const ownedChildren = { className: "consumer", children: "Ignored markup" };
const ownedTabIndex = { className: "consumer", tabIndex: -1 };
const ownedName = { className: "consumer", "aria-label": "Ignored name" };
const ownedPressed = { className: "consumer", "aria-pressed": true };
const ownedDisabled = { className: "consumer", "aria-disabled": true };
const ownedDescription = { className: "consumer", "aria-describedby": "Ignored description" };
// @ts-expect-error Stage role is owned, including structurally inferred callback objects.
void (<FunnelChart.Stages stageProps={() => ownedRole} />);
// @ts-expect-error Shape owns stage children; custom markup belongs in Shape.
void (<FunnelChart.Stages stageProps={() => ownedChildren} />);
// @ts-expect-error Keyboard stage tabindex is chart-owned.
void (<FunnelChart.Stages stageProps={() => ownedTabIndex} />);
// @ts-expect-error Accessible name is derived from the typed stage.
void (<FunnelChart.Stages stageProps={() => ownedName} />);
// @ts-expect-error Pressed semantics follow the chart selection contract.
void (<FunnelChart.Stages stageProps={() => ownedPressed} />);
// @ts-expect-error Disabled semantics follow loading state.
void (<FunnelChart.Stages stageProps={() => ownedDisabled} />);
void (<FunnelChart.Stages stageProps={() => ownedDescription} />);

const ownedKind = { className: "consumer", "data-kind-ui": "replaced" };
const ownedStageId = { className: "consumer", "data-stage-id": "replaced" };
const ownedStageIndex = { className: "consumer", "data-stage-index": 42 };
const ownedValueState = { className: "consumer", "data-value-state": "replaced" };
const ownedFocusKey = { className: "consumer", "data-interaction-focus-key": "replaced" };
// @ts-expect-error Structural return objects cannot replace chart-owned DOM identifiers.
void (<FunnelChart.Stages stageProps={() => ownedKind} />);
// @ts-expect-error Stage DOM identity remains the modeled identity.
void (<FunnelChart.Stages stageProps={() => ownedStageId} />);
// @ts-expect-error Stage index remains supplied ordered position.
void (<FunnelChart.Stages stageProps={() => ownedStageIndex} />);
// @ts-expect-error Value state reflects zero/unknown/known data.
void (<FunnelChart.Stages stageProps={() => ownedValueState} />);
// @ts-expect-error Interaction focus keys remain chart-owned.
void (<FunnelChart.Stages stageProps={() => ownedFocusKey} />);

// @ts-expect-error Funnel legend order and stage membership remain data-owned.
void (<FunnelChart.Legend itemKeys={["stale"]} />);

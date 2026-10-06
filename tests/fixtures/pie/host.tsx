// Host composition only; the installed tarball owns all chart behavior.
import * as Chart from "@kind-ui/charts";
import { Cell, Label, LabelList, type PieSectorShapeProps, Sector } from "@kind-ui/charts";
import { useCallback, useMemo, useState } from "react";
import { PieChart as NativePieChart, Tooltip as NativeTooltip, Pie } from "recharts";

const config = {
  alpha: { label: "Alpha", color: "#4f46e5", formatValue: (v: unknown) => `${v} seats` },
  beta: { label: "Beta", color: "#0891b2", formatValue: (v: unknown) => `${v} seats` },
  zero: { label: "Zero", color: "#db2777" },
  missing: { label: "Missing", color: "#d97706" },
} satisfies Chart.SeriesConfig;
const original = [
  { id: "alpha", value: 60 },
  { id: "beta", value: 40 },
  { id: "zero", value: 0 },
  { id: "missing", value: null },
];
const identity: NonNullable<Chart.TooltipProps["itemKey"]> = (entry) => String(entry.payload.id);
export function PinnedPieHost({
  category = "beta",
  accessor = false,
}: {
  category?: string;
  accessor?: boolean;
}) {
  const [data, setData] = useState(original);
  const [generation, setGeneration] = useState(0);
  const [override, setOverride] = useState(false);
  const [nativeIndex, setNativeIndex] = useState(false);
  const [visible, setVisible] = useState<string[] | undefined>(undefined);
  return (
    <main>
      <button type="button" onClick={() => setData((rows) => [...rows].reverse())}>
        Reorder pin
      </button>
      <button
        type="button"
        onClick={() => setData((rows) => rows.filter((row) => row.id !== "beta"))}
      >
        Remove pin
      </button>
      <button type="button" onClick={() => setData(original)}>
        Restore pin
      </button>
      <button type="button" onClick={() => setGeneration((value) => value + 1)}>
        Remount pin
      </button>
      <button type="button" onClick={() => setOverride((value) => !value)}>
        Native override
      </button>
      <button type="button" onClick={() => setNativeIndex((value) => !value)}>
        Native index
      </button>
      <button type="button" onClick={() => setVisible(["alpha"])}>
        Filter pin
      </button>
      <button type="button" onClick={() => setVisible(undefined)}>
        Show pin
      </button>
      <button type="button" onClick={() => setData([...original, { id: "beta", value: 5 }])}>
        Duplicate pin
      </button>
      <Chart.Root config={config} {...(visible ? { visibleSeries: visible } : {})}>
        <Chart.PieChart
          key={generation}
          width={320}
          height={300}
          defaultPinnedCategory={category}
          aria-label="Initial pinned pie"
          accessibilityLayer
        >
          <Chart.PieSeries
            data={data}
            categoryKey={accessor ? (row) => row.id : "id"}
            dataKey="value"
            nameKey="id"
          />
          <Chart.Tooltip
            itemKey={identity}
            {...(override ? { active: false } : {})}
            {...(nativeIndex ? { defaultIndex: 0 } : {})}
          />
        </Chart.PieChart>
      </Chart.Root>
      <table>
        <caption>Pinned allocation</caption>
        <tbody>
          {data.map((row) => (
            <tr key={`${row.id}-${row.value}`}>
              <th scope="row">{row.id}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button">After chart</button>
    </main>
  );
}
function CustomShape(props: PieSectorShapeProps) {
  const {
    className,
    cornerRadius,
    onClick,
    onMouseDown,
    onMouseUp,
    onMouseMove,
    onMouseOver,
    onMouseOut,
    onMouseEnter,
    onMouseLeave,
    ...sector
  } = props;
  return (
    <Sector
      {...sector}
      {...(onClick ? { onClick } : {})}
      {...(onMouseDown ? { onMouseDown } : {})}
      {...(onMouseUp ? { onMouseUp } : {})}
      {...(onMouseMove ? { onMouseMove } : {})}
      {...(onMouseOver ? { onMouseOver } : {})}
      {...(onMouseOut ? { onMouseOut } : {})}
      {...(onMouseEnter ? { onMouseEnter } : {})}
      {...(onMouseLeave ? { onMouseLeave } : {})}
      {...(className ? { className } : {})}
      {...(cornerRadius !== undefined ? { cornerRadius } : {})}
      data-host-shape=""
      data-click-x={props.tooltipPosition?.x}
      data-click-y={props.tooltipPosition?.y}
    />
  );
}
function CustomContent({ payload }: { payload?: readonly { name?: string | number }[] }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setCount(count + 1)}>
        Content count {count}
      </button>
      Native {payload?.[0]?.name}
    </div>
  );
}
export function PieHost() {
  const [animate, setAnimate] = useState<boolean | Chart.PieAnimation>(
    new URLSearchParams(window.location.search).has("motion"),
  );
  const [direction, setDirection] = useState<"clockwise" | "anticlockwise">(
    new URLSearchParams(location.search).has("anticlockwise") ? "anticlockwise" : "clockwise",
  );
  const [material, setMaterial] = useState<Chart.PieMaterial>(
    (new URLSearchParams(location.search).get("material") as Chart.PieMaterial) ?? "plain",
  );
  const [visible, setVisible] = useState(Object.keys(config));
  const [donut, setDonut] = useState(true);
  const [updated, setUpdated] = useState(false);
  const [reverse, setReverse] = useState(false);
  const [small, setSmall] = useState(false);
  const [custom, setCustom] = useState(false);
  const [customContent, setCustomContent] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [allZero, setAllZero] = useState(false);
  const [angles, setAngles] = useState(new URLSearchParams(location.search).has("partial"));
  const [hidden, setHidden] = useState(false);
  const [clicked, setClicked] = useState("none");
  const [moved, setMoved] = useState(0);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.refTag = node.tagName;
  }, []);
  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (node) node.dataset.refTag = node.tagName;
  }, []);
  const data = useMemo(() => {
    const next = (empty ? [] : original)
      .filter((row) => visible.includes(row.id))
      .map((row) => ({
        ...row,
        value: allZero ? 0 : updated && row.id === "alpha" ? 20 : row.value,
      }));
    return reverse ? next.reverse() : next;
  }, [empty, visible, allZero, updated, reverse]);
  return (
    <section aria-label="Packed pies" style={{ width: small ? 220 : 480, background: "white" }}>
      <label>
        Finish
        <select
          aria-label="Finish"
          value={material}
          onChange={(e) => setMaterial(e.target.value as Chart.PieMaterial)}
        >
          {["plain", "paper", "clay", "glow"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() =>
          setAnimate(
            animate === false
              ? { revealDurationMs: 2000, hoverTransition: { duration: 0.1 } }
              : false,
          )
        }
      >
        Animate
      </button>
      <button type="button" onClick={() => setAnimate(true)}>
        Default animation
      </button>
      <button type="button" onClick={() => setDonut(!donut)}>
        Donut
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update
      </button>
      <button type="button" onClick={() => setReverse(!reverse)}>
        Reorder
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom shape
      </button>
      <button type="button" onClick={() => setCustomContent(!customContent)}>
        Custom content
      </button>
      <button type="button" onClick={() => setEmpty(!empty)}>
        Empty
      </button>
      <button type="button" onClick={() => setAllZero(!allZero)}>
        All zero
      </button>
      <button type="button" onClick={() => setAngles(!angles)}>
        Angles
      </button>
      <button type="button" onClick={() => setHidden(!hidden)}>
        Native hide
      </button>
      <output aria-label="Events">
        {clicked}/{moved}
      </output>
      <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
        <Chart.Legend />
        <button
          type="button"
          onClick={() => setDirection(direction === "clockwise" ? "anticlockwise" : "clockwise")}
        >
          Direction
        </button>
        <style>{".owned-pie-transform { transform: translate(8px, 4px); }"}</style>
        <Chart.PieChart
          animate={animate}
          animationDirection={direction}
          width={small ? 220 : 480}
          height={300}
          ref={ref}
          aria-label="Packed pie chart"
          layout="centric"
          onMouseMove={() => setMoved((v) => v + 1)}
        >
          <Chart.PieSeries
            material={material}
            data={data}
            dataKey="value"
            nameKey="id"
            innerRadius={donut ? "45%" : 0}
            outerRadius="75%"
            startAngle={
              new URLSearchParams(location.search).has("positive") ? 0 : angles ? 180 : 90
            }
            endAngle={
              new URLSearchParams(location.search).has("positive")
                ? angles
                  ? 180
                  : 360
                : angles
                  ? 0
                  : -270
            }
            paddingAngle={0}
            cornerRadius={3}
            hide={hidden}
            {...(custom ? { shape: CustomShape } : {})}
            onClick={(row) => setClicked(String(row.payload.id))}
          >
            {data.map((row) => (
              <Cell
                key={row.id}
                className={
                  new URLSearchParams(location.search).has("css-transform")
                    ? "owned-pie-transform"
                    : undefined
                }
                fill={`var(--color-${row.id})`}
              />
            ))}
            <LabelList dataKey="id" position="outside" />
            {donut && <Label position="center" value="Seats" />}
          </Chart.PieSeries>
          <Chart.Tooltip
            itemKey={identity}
            ref={tooltipRef}
            {...(customContent ? { content: <CustomContent /> } : {})}
          />
        </Chart.PieChart>
        <table>
          <caption>Category values</caption>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <th>{row.id}</th>
                <td>{row.value === null ? "No data" : row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Chart.Root>
      {new URLSearchParams(window.location.search).has("multi") && nativeComposition}
      {new URLSearchParams(window.location.search).has("cells") && <CellHost />}
      {new URLSearchParams(window.location.search).has("oracle") && <ContinuityHost />}
    </section>
  );
}
export const rejectedEngineTween: Chart.PieSeriesProps = {
  dataKey: "value",
  // @ts-expect-error Motion owns animation for the maintained component.
  isAnimationActive: true,
};

// Native extensions typecheck against the installed declarations, not a workspace source link.
export const nativeComposition = (
  <Chart.Root config={config}>
    <Chart.PieChart
      data={original}
      width={360}
      height={300}
      layout="radial"
      aria-label="Native rings"
    >
      <Chart.PieSeries dataKey="value" nameKey="id" outerRadius={70}>
        {original.map((row) => (
          <Cell key={row.id} fill={`var(--color-${row.id})`} data-ring="inner" />
        ))}
      </Chart.PieSeries>
      <Chart.PieSeries<AllocationRow, string | number | null>
        dataKey={(row: AllocationRow) => row.value}
        nameKey={(row: AllocationRow) => row.id}
        innerRadius={85}
        outerRadius={(row: { id: string }) => (row.id === "alpha" ? 120 : 110)}
        startAngle={90}
        endAngle={-270}
      >
        {original.map((row) => (
          <Cell key={row.id} fill={`var(--color-${row.id})`} data-ring="outer" />
        ))}
      </Chart.PieSeries>
      <Chart.Tooltip itemKey={identity} trigger="click" />
    </Chart.PieChart>
  </Chart.Root>
);
type AllocationRow = { id: string; value: number | null };
export const typedPie: Chart.PieSeriesProps<AllocationRow, number | null> = {
  data: original,
  dataKey: (row) => row.value,
};
export const rejectedField: Chart.PieSeriesProps<AllocationRow, number> = {
  // @ts-expect-error A typed category row does not contain typoValue.
  dataKey: (row) => row.typoValue,
};
function CellHost() {
  const [updated, setUpdated] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <section aria-label="Cell data proof">
      <button type="button" onClick={() => setUpdated(!updated)}>
        Cell update
      </button>
      <button type="button" onClick={() => setCount(count + 1)}>
        Unchanged Cells {count}
      </button>
      <Chart.Root config={config}>
        <Chart.PieChart
          width={360}
          height={280}
          animate={{ revealDurationMs: 2000 }}
          aria-label="Cell data chart"
        >
          <Chart.PieSeries dataKey="value" nameKey="id" outerRadius={100}>
            {/* biome-ignore lint/complexity/noUselessFragments: Preserve fragment-wrapped Cell discovery regression coverage. */}
            <>
              <Cell {...{ id: "alpha", value: updated ? 20 : 60 }} fill="var(--color-alpha)" />
              <Cell {...{ id: "beta", value: 40 }} fill="var(--color-beta)" />
            </>
          </Chart.PieSeries>
          <Chart.Tooltip itemKey={identity} />
        </Chart.PieChart>
      </Chart.Root>
    </section>
  );
}

const cases = {
  single: [
    { id: "alpha", value: 0 },
    { id: "beta", value: 16 },
  ],
  normal: [
    { id: "alpha", value: 60 },
    { id: "beta", value: 40 },
  ],
  zero: [
    { id: "alpha", value: 60 },
    { id: "zero", value: 0 },
    { id: "beta", value: 40 },
  ],
  tiny: [
    { id: "alpha", value: 0.000001 },
    { id: "zero", value: 0 },
    { id: "beta", value: 1 },
  ],
  empty: [],
  allZero: [
    { id: "alpha", value: 0 },
    { id: "beta", value: 0 },
  ],
};
function ContinuityHost() {
  const query = new URLSearchParams(location.search);
  const [material, setMaterial] = useState<Chart.PieMaterial>(
    (query.get("material") as Chart.PieMaterial) ?? "plain",
  );
  const opacity = query.has("transparent") ? 0 : query.has("alpha") ? 0.35 : 1;
  const [scenario, setScenario] = useState<keyof typeof cases>("normal");
  const [included, setIncluded] = useState(true);
  const [donut, setDonut] = useState(false);
  const [gaps, setGaps] = useState(false);
  const [rings, setRings] = useState(false);
  const [ownership, setOwnership] = useState("none");
  const [radius, setRadius] = useState(110);
  const data = useMemo(
    () => cases[scenario].filter((row) => included || row.id !== "beta"),
    [scenario, included],
  );
  const props = {
    data,
    dataKey: "value" as const,
    nameKey: "id" as const,
    innerRadius: donut ? 65 : 0,
    outerRadius: radius,
    startAngle: 90,
    endAngle: -270,
    ...(query.has("css-filter") ? { className: "host-owned-filter" } : {}),
    ...(query.has("css-stroke") ? { className: "host-thick-stroke" } : {}),
    ...(query.has("thick") ? { stroke: "#db6baa", strokeWidth: 60 } : {}),
    ...(gaps ? { paddingAngle: 4, cornerRadius: 8, stroke: "#fff", strokeWidth: 2 } : {}),
  };
  const cells = data.map((row) => (
    <Cell
      key={row.id}
      fillOpacity={opacity}
      {...(query.has("clip") ? { clipPath: "url(#host-clip)" } : {})}
      {...(query.has("css-transform") ? { className: "host-transformed" } : {})}
      {...(query.has("transform") ? { transform: "translate(40 0) scale(.85)" } : {})}
      {...(query.has("rotate-transform") ? { transform: "rotate(12 150 140) skewX(5)" } : {})}
      {...(query.has("harmless-css")
        ? { className: "host-harmless", style: { color: "#333", transform: "none" } }
        : {})}
      {...(query.has("style-transform")
        ? { style: { transform: "translate(40px, 0px) scale(.85)" } }
        : {})}
      {...(query.has("individual-translate") ? { style: { translate: "40px 0" } } : {})}
      {...(query.has("individual-rotate") ? { style: { rotate: "12deg" } } : {})}
      {...(query.has("individual-scale") ? { style: { scale: ".85" } } : {})}
      {...(query.has("css-3d") ? { className: "host-3d" } : {})}
      {...(query.has("ownership-updates")
        ? {
            className: ownership === "class" ? "host-lifecycle-class" : "host-lifecycle",
            id: ownership === "id" ? `host-owned-${row.id}` : undefined,
            style: ownership === "style" ? { transform: "translateX(40px)" } : undefined,
          }
        : {})}
      {...(query.has("filter") ? { filter: "url(#host-filter)" } : {})}
      {...(query.has("style-filter") ? { style: { filter: "url(#host-filter)" } } : {})}
      fill={
        query.has("gradient")
          ? "url(#host-gradient)"
          : row.id === "alpha"
            ? "#4f46e5"
            : row.id === "beta"
              ? "#0891b2"
              : "#db2777"
      }
    />
  ));
  return (
    <section aria-label="Continuity proof">
      {query.has("css-3d") && <style>{".host-3d {transform: translateZ(1px);}"}</style>}
      {query.has("ownership-updates") && (
        <>
          <style>
            {
              ".host-lifecycle-class, #host-owned-alpha, #host-owned-beta {transform: translateX(40px);}"
            }
          </style>
          {["style", "class", "id", "none"].map((owner) => (
            <button key={owner} type="button" onClick={() => setOwnership(owner)}>
              Ownership {owner}
            </button>
          ))}
          <button type="button" onClick={() => setRadius((value) => (value === 110 ? 100 : 110))}>
            Ownership geometry
          </button>
        </>
      )}
      {query.has("harmless-css") && <style>{".host-harmless {color: #333;}"}</style>}
      {query.has("css-filter") && <style>{".host-owned-filter {filter: grayscale(1);}"}</style>}
      {query.has("css-transform") && (
        <style>{".host-transformed {transform: translateX(50px);}"}</style>
      )}
      {query.has("css-stroke") && (
        <style>{".host-thick-stroke {stroke: #db6baa; stroke-width: 60px;}"}</style>
      )}
      <label>
        Oracle finish
        <select
          aria-label="Oracle finish"
          value={material}
          onChange={(e) => setMaterial(e.target.value as Chart.PieMaterial)}
        >
          {["plain", "paper", "clay", "glow"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      {Object.keys(cases).map((key) => (
        <button type="button" key={key} onClick={() => setScenario(key as keyof typeof cases)}>
          Scenario {key}
        </button>
      ))}
      <button type="button" onClick={() => setIncluded(!included)}>
        Oracle visibility
      </button>
      <button type="button" onClick={() => setDonut(!donut)}>
        Oracle donut
      </button>
      <button type="button" onClick={() => setGaps(!gaps)}>
        Explicit gaps
      </button>
      <button type="button" onClick={() => setRings(!rings)}>
        Oracle rings
      </button>
      <output aria-label="Oracle state">
        {scenario}/{String(included)}/{String(donut)}/{String(gaps)}/{String(rings)}
      </output>
      <Chart.Root config={config} style={{ position: "relative", width: 300, background: "white" }}>
        <Chart.PieChart width={300} height={280} aria-label="Kind continuity">
          <defs>
            <clipPath id="host-clip">
              <rect x={120} y={0} width={30} height={1000} />
            </clipPath>
            <filter id="host-filter">
              <feGaussianBlur stdDeviation={0.2} />
            </filter>
            <linearGradient id="host-gradient">
              <stop stopColor="#db6baa" stopOpacity={0.2} />
              <stop offset="1" stopColor="#eb9cc7" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <Chart.PieSeries {...props} material={material}>
            {cells}
          </Chart.PieSeries>
          {rings && (
            <Chart.PieSeries {...props} material={material} innerRadius={115} outerRadius={130}>
              {cells}
            </Chart.PieSeries>
          )}
          <Chart.Tooltip itemKey={identity} />
        </Chart.PieChart>
        <NativePieChart
          width={300}
          height={280}
          aria-label="Native oracle"
          style={{ position: "absolute", top: 0, left: 0, visibility: "hidden" }}
        >
          <Pie
            {...props}
            stroke={gaps ? "#fff" : query.has("thick") ? "#db6baa" : "none"}
            isAnimationActive={false}
          >
            {cells}
          </Pie>
          {rings && (
            <Pie
              {...props}
              innerRadius={115}
              outerRadius={130}
              stroke={gaps ? "#fff" : query.has("thick") ? "#db6baa" : "none"}
              isAnimationActive={false}
            >
              {cells}
            </Pie>
          )}
          <NativeTooltip isAnimationActive={false} />
        </NativePieChart>
      </Chart.Root>
    </section>
  );
}

export function MaterialGallery() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, background: "#f6f4f6" }}>
      <h1>Pie / donut finishes</h1>
      <p>Native continuous sectors • pink and monochrome • normal and narrow</p>
      {(["plain", "paper", "clay", "glow"] as const).map((material) => (
        <section key={material}>
          <h2>{material}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            {[false, true].flatMap((mono) =>
              [false, true].map((donut) => (
                <article
                  key={`${mono}/${donut}`}
                  style={{ background: "white", borderRadius: 18, padding: 12 }}
                >
                  <h3>
                    {mono ? "Mono" : "Pink"} {donut ? "donut" : "pie"}
                  </h3>
                  {[300, 180].map((width) => (
                    <Chart.Root key={width} config={{}}>
                      <Chart.PieChart
                        width={width}
                        height={width}
                        animate={false}
                        aria-label={`${material} ${mono ? "mono" : "pink"} ${donut ? "donut" : "pie"} ${width}`}
                      >
                        <Chart.PieSeries
                          data={[{ v: 60 }, { v: 28 }, { v: 12 }]}
                          dataKey="v"
                          material={material}
                          innerRadius={donut ? "52%" : 0}
                          outerRadius="85%"
                        >
                          {(mono
                            ? ["#55545c", "#929099", "#d2cfd6"]
                            : ["#db6baa", "#eb9cc7", "#f3c4df"]
                          ).map((color) => (
                            <Cell key={color} fill={color} />
                          ))}
                        </Chart.PieSeries>
                      </Chart.PieChart>
                    </Chart.Root>
                  ))}
                </article>
              )),
            )}
          </div>
        </section>
      ))}
    </main>
  );
}

const selectiveConfig = {
  alpha: { label: "Alpha", color: "#4f46e5" },
  beta: { label: "Beta", color: "#0891b2" },
} satisfies Chart.SeriesConfig;
const selectiveRows = [
  { id: "alpha", category: "alpha", value: 60, fill: "#c026d3" },
  { id: "beta", category: "beta", value: 40 },
];
const betaGlow = ["beta", "unknown", "beta"] as const;
const alphaGlow = ["alpha"] as const;
const noGlow = [] as const;
const categoryAccessor = (row: (typeof selectiveRows)[number]) => row.category;

// Also rendered to the native SSR shell before hydration in main.tsx.
export function SelectiveGlowHost({ accessor = false }: { accessor?: boolean }) {
  const [reverse, setReverse] = useState(false);
  const [included, setIncluded] = useState(true);
  const [selected, setSelected] = useState(true);
  const [material, setMaterial] = useState<Chart.PieMaterial>("plain");
  const [owner, setOwner] = useState("none");
  const [clicked, setClicked] = useState("none");
  const [dark, setDark] = useState(false);
  const data = selectiveRows.filter((row) => included || row.id !== "beta");
  if (reverse) data.reverse();
  return (
    <main className={dark ? "dark" : undefined}>
      <button type="button" onClick={() => setReverse(!reverse)}>
        Reorder glow
      </button>
      <button type="button" onClick={() => setIncluded(!included)}>
        Filter beta
      </button>
      <button type="button" onClick={() => setSelected(!selected)}>
        Toggle glow
      </button>
      <button type="button" onClick={() => setDark(!dark)}>
        Theme
      </button>
      <label>
        Base finish
        <select value={material} onChange={(e) => setMaterial(e.target.value as Chart.PieMaterial)}>
          {["plain", "paper", "clay", "glow"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Paint owner
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {["none", "filter", "shape", "active"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <output aria-label="Glow event">{clicked}</output>
      {[0, 1].map((chart) => (
        <Chart.Root
          key={chart}
          config={selectiveConfig}
          style={{ background: dark ? "#111827" : "white" }}
        >
          <Chart.PieChart
            width={320}
            height={300}
            animate={false}
            accessibilityLayer
            aria-label={`Selective glow ${chart}`}
          >
            {[0, 1].map((ring) => (
              <Chart.PieSeries
                key={ring}
                data={data}
                dataKey="value"
                nameKey="id"
                categoryKey={accessor ? categoryAccessor : "category"}
                glowCategories={selected ? (ring === 0 ? betaGlow : alphaGlow) : noGlow}
                material={material}
                innerRadius={ring === 0 ? 40 : 105}
                outerRadius={ring === 0 ? 95 : 125}
                {...(owner === "shape" ? { shape: CustomShape } : {})}
                {...(owner === "active" ? { activeShape: CustomShape } : {})}
                {...(owner === "filter" ? { filter: "grayscale(1)" } : {})}
                onClick={(row) => setClicked(String(row.name))}
              >
                {data.map((row) => (
                  <Cell
                    key={row.id}
                    {...{ category: "alpha" }}
                    data-category={row.id}
                    {...(row.id === "beta" ? { fill: "#0e7490" } : {})}
                  />
                ))}
              </Chart.PieSeries>
            ))}
            <Chart.Tooltip itemKey={identity} />
          </Chart.PieChart>
        </Chart.Root>
      ))}
      <table>
        <caption>Glow allocation</caption>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.id}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

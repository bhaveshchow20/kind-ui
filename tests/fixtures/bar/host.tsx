// Host composition only: the tarball supplies the entire bar implementation.
import * as Chart from "@kind-ui/charts";
import {
  type BarShapeProps,
  BarStack,
  Brush,
  CartesianGrid,
  Cell,
  LabelList,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
} from "@kind-ui/charts";
import { useCallback, useState } from "react";

const data = [
  { category: "A", value: 8, other: 60 },
  { category: "B", value: -5, other: 70 },
  { category: "C", value: null, other: 80 },
  { category: "D", value: 0, other: 90 },
];
const otherValue = (row: unknown) =>
  typeof row === "object" && row !== null && "other" in row && typeof row.other === "number"
    ? row.other
    : undefined;
function Shape({ x, y, width, height, fill, filter, index }: BarShapeProps) {
  return (
    <Rectangle
      filter={filter}
      data-host-shape=""
      data-highlighted={index === 0}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      radius={3}
    />
  );
}
function Content({ label }: { label?: string | number }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ height: 260 }}>
      <button type="button" onClick={() => setCount(count + 1)}>
        Content count {count}
      </button>
      Custom {label}
    </div>
  );
}
export function BarHost() {
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [nativeShape, setNativeShape] = useState(
    !new URLSearchParams(window.location.search).has("materials"),
  );
  const [pink, setPink] = useState(false);
  const [gradient, setGradient] = useState(false);
  const [customActive, setCustomActive] = useState(false);
  const [background, setBackground] = useState(false);
  const [cellFilter, setCellFilter] = useState(false);
  const [nativeFilter, setNativeFilter] = useState(false);
  const [animate, setAnimate] = useState<boolean | Chart.BarAnimation>(false);
  const [horizontal, setHorizontal] = useState(
    new URLSearchParams(window.location.search).has("horizontal"),
  );
  const [categoryPadding, setCategoryPadding] = useState(false);
  const [sqrtScale, setSqrtScale] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [visible, setVisible] = useState(["value", "other", "alias"]);
  const [hide, setHide] = useState(false);
  const [renamed, setRenamed] = useState(false);
  const [small, setSmall] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [custom, setCustom] = useState(false);
  const [domain, setDomain] = useState(100);
  const [key, setKey] = useState("value");
  const [clicked, setClicked] = useState(0);
  const [moved, setMoved] = useState(0);
  const [left, setLeft] = useState(0);
  const ref = useCallback((node: SVGSVGElement | null) => {
    if (node) node.dataset.refTag = node.tagName;
    return () => {
      document.body.dataset.chartRefCleanup = "yes";
    };
  }, []);
  const tooltipRef = useCallback((node: HTMLDivElement | null) => {
    if (node) node.dataset.refTag = node.tagName;
    return () => {
      document.body.dataset.tooltipRefCleanup = "yes";
    };
  }, []);
  return (
    <section aria-label="Packed bars" style={{ width: small ? 180 : 480, background: "white" }}>
      <fieldset aria-label="Material">
        {(["plain", "paper", "clay", "glow"] as const).map((value) => (
          <button type="button" key={value} onClick={() => setMaterial(value)}>
            {value}
          </button>
        ))}
      </fieldset>
      <button type="button" onClick={() => setNativeShape(!nativeShape)}>
        Native shape
      </button>
      <button type="button" onClick={() => setNativeFilter(!nativeFilter)}>
        Native filter
      </button>
      <button type="button" onClick={() => setCustomActive(!customActive)}>
        Custom active
      </button>
      <button type="button" onClick={() => setBackground(!background)}>
        Background
      </button>
      <button type="button" onClick={() => setCellFilter(!cellFilter)}>
        Cell filter
      </button>
      <button type="button" onClick={() => setPink(!pink)}>
        Pink
      </button>
      <button type="button" onClick={() => setGradient(!gradient)}>
        Gradient
      </button>
      <button
        type="button"
        onClick={() =>
          setAnimate(
            animate === false
              ? { revealDurationMs: 1000, hoverTransition: { duration: 0.4 } }
              : false,
          )
        }
      >
        Animate
      </button>
      <button type="button" onClick={() => setAnimate(true)}>
        Default animation
      </button>
      <button type="button" onClick={() => setHorizontal(!horizontal)}>
        Orientation
      </button>
      <button type="button" onClick={() => setStacked(!stacked)}>
        Stack
      </button>
      <button type="button" onClick={() => setHide(!hide)}>
        Native hide
      </button>
      <button type="button" onClick={() => setRenamed(!renamed)}>
        Rename
      </button>
      <button type="button" onClick={() => setSmall(!small)}>
        Resize
      </button>
      <button type="button" onClick={() => setUpdated(!updated)}>
        Update
      </button>
      <button type="button" onClick={() => setCustom(!custom)}>
        Custom content
      </button>
      <button type="button" onClick={() => setCategoryPadding(!categoryPadding)}>
        Category padding
      </button>
      <button type="button" onClick={() => setSqrtScale((value) => !value)}>
        Numeric scale
      </button>
      <button type="button" onClick={() => setDomain(domain === 100 ? 200 : 100)}>
        Domain
      </button>
      <button type="button" onClick={() => setKey(key === "value" ? "other" : "value")}>
        Data key
      </button>
      <div role="note" aria-label="Events">
        {clicked}/{moved}/{left}
      </div>
      <Chart.Root
        config={{
          value: { label: "Value", color: "#246", formatValue: (v) => `${v} units` },
          other: { label: "Other", color: "#682" },
          alias: { label: "Alias", color: "#682" },
        }}
        visibleSeries={visible}
        onVisibleSeriesChange={setVisible}
      >
        <Chart.Legend />
        <Chart.BarChart
          animate={animate}
          width={small ? 180 : 480}
          height={240}
          data={updated ? data.map((row) => ({ ...row, other: row.other + 50 })) : data}
          layout={horizontal ? "vertical" : "horizontal"}
          barGap={5}
          barCategoryGap="20%"
          stackOffset="sign"
          aria-label="Packed bar chart"
          ref={ref}
          onMouseMove={() => setMoved((v) => v + 1)}
          onMouseLeave={() => setLeft((v) => v + 1)}
        >
          <defs>
            <linearGradient id="bar-proof-gradient">
              <stop
                stopColor="#ff80bf"
                stopOpacity={
                  new URLSearchParams(window.location.search).has("gradient-alpha") ? 0.2 : 1
                }
              />
              <stop offset="1" stopColor="#6b45b3" />
            </linearGradient>
            <filter id="bar-host-filter">
              <feOffset dx="1" dy="1" />
            </filter>
          </defs>
          <CartesianGrid />
          <XAxis
            {...(horizontal
              ? {
                  domain: [
                    new URLSearchParams(window.location.search).has("fixed-zero") ? 0 : -10,
                    domain,
                  ],
                  allowDataOverflow: true,
                  scale: sqrtScale ? "sqrt" : "linear",
                }
              : { padding: { left: categoryPadding ? 60 : 0, right: categoryPadding ? 60 : 0 } })}
            xAxisId="category-axis"
            dataKey={horizontal ? undefined : "category"}
            type={horizontal ? "number" : "category"}
          />
          <YAxis
            {...(!horizontal
              ? {
                  domain: new URLSearchParams(window.location.search).has("exclude-zero")
                    ? [50, domain]
                    : [
                        new URLSearchParams(window.location.search).has("fixed-zero") ? 0 : -10,
                        domain,
                      ],
                  allowDataOverflow: true,
                  scale: sqrtScale ? "sqrt" : "linear",
                }
              : { padding: { top: categoryPadding ? 40 : 0, bottom: categoryPadding ? 40 : 0 } })}
            {...(new URLSearchParams(window.location.search).has("exclude-zero")
              ? {
                  padding: { bottom: 20, top: 20 },
                  reversed: new URLSearchParams(window.location.search).has("reversed"),
                }
              : {})}
            yAxisId="value-axis"
            dataKey={horizontal ? "category" : undefined}
            type={horizontal ? "category" : "number"}
            width={40}
          />
          <ReferenceLine
            xAxisId="category-axis"
            yAxisId="value-axis"
            {...(horizontal ? { x: 0 } : { y: 0 })}
          />
          <Chart.Tooltip
            axisId={horizontal ? "value-axis" : "category-axis"}
            ref={tooltipRef}
            {...(custom ? { content: <Content /> } : {})}
            frameProps={{
              "aria-label": "Bounded bar tooltip",
              onMouseDown: () => setClicked((v) => v + 1),
            }}
          />
          <Chart.BarSeries
            xAxisId="category-axis"
            yAxisId="value-axis"
            dataKey={key}
            seriesKey="value"
            material={material}
            background={background}
            activeBar={customActive ? Shape : false}
            radius={new URLSearchParams(window.location.search).has("round") ? 8 : [3, 3, 0, 0]}
            fillOpacity={
              new URLSearchParams(window.location.search).has("zero-opacity")
                ? 0
                : new URLSearchParams(window.location.search).has("translucent")
                  ? 0.35
                  : 1
            }
            {...(nativeShape ? { shape: Shape } : {})}
            {...(nativeFilter ? { filter: "url(#bar-host-filter)" } : {})}
            onClick={() => setClicked((v) => v + 1)}
            {...(stacked ? { stackId: "total" } : {})}
          >
            <LabelList dataKey="value" position="top" />
            {data.map((row, i) => (
              <Cell
                key={row.category}
                {...(cellFilter && i === 1 ? { filter: "url(#bar-host-filter)" } : {})}
                fill={
                  gradient
                    ? "url(#bar-proof-gradient)"
                    : pink
                      ? "#ed79ae"
                      : i === 1
                        ? "#b40"
                        : "#246"
                }
              />
            ))}
          </Chart.BarSeries>
          <Chart.BarSeries
            xAxisId="category-axis"
            yAxisId="value-axis"
            dataKey={otherValue}
            seriesKey={
              new URLSearchParams(window.location.search).has("missing-key")
                ? undefined
                : renamed
                  ? "alias"
                  : "other"
            }
            hide={hide}
            name="Native other"
            fill={pink ? "#ed79ae" : "#682"}
            radius={new URLSearchParams(window.location.search).has("round") ? 8 : 0}
            material={material}
            {...(stacked ? { stackId: "total" } : {})}
          />
        </Chart.BarChart>
      </Chart.Root>
      {new URLSearchParams(window.location.search).has("envelopes") && <StackProof />}
    </section>
  );
}

// Compile-time public contract: engine tweens must not compete with Motion.
export const rejectedEngineTween: Chart.BarSeriesProps = {
  dataKey: "value",
  // @ts-expect-error Kind reserves native engine animation.
  isAnimationActive: true,
};

function StackProof() {
  return (
    <div data-proof-stack="">
      {[260, 140].map((width) => (
        <Chart.Root
          key={width}
          config={{
            value: { label: "Value", color: "#ed79ae" },
            other: { label: "Other", color: "#682" },
          }}
        >
          <Chart.BarChart
            width={width}
            height={120}
            data={[
              { category: "A", value: 8, other: 12 },
              { category: "B", value: 20, other: 0 },
            ]}
            aria-label={`Native stack ${width}`}
          >
            <XAxis dataKey="category" hide />
            <YAxis hide />
            <BarStack radius={8}>
              <Chart.BarSeries dataKey="value" material="clay" radius={0} />
              <Chart.BarSeries dataKey="other" material="clay" radius={0} />
            </BarStack>
          </Chart.BarChart>
        </Chart.Root>
      ))}
    </div>
  );
}

const patternRows = [
  { category: "A", first: 8, second: 4 },
  { category: "B", first: -5, second: -2 },
];

export function PatternHost({ horizontal = false }: { horizontal?: boolean }) {
  const [kind, setKind] = useState<Chart.FillPattern["kind"]>("hatch");
  const [stacked, setStacked] = useState(false);
  const [override, setOverride] = useState("none");
  const [material, setMaterial] = useState<Chart.BarMaterial>("plain");
  const [dark, setDark] = useState(false);
  const [visible, setVisible] = useState(["first", "second"]);
  return (
    <section
      style={{ colorScheme: dark ? "dark" : "light", background: "Canvas", color: "CanvasText" }}
    >
      {(["hatch", "stripe", "duotone"] as const).map((value) => (
        <button type="button" key={value} onClick={() => setKind(value)}>
          {value}
        </button>
      ))}
      <button type="button" onClick={() => setStacked(!stacked)}>
        Stack
      </button>
      <button type="button" onClick={() => setDark(!dark)}>
        Theme
      </button>
      <button type="button" onClick={() => setMaterial(material === "plain" ? "clay" : "plain")}>
        Material
      </button>
      <label>
        Override
        <select value={override} onChange={(event) => setOverride(event.target.value)}>
          {["none", "fill", "style", "cell", "shape", "active", "off"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      {[0, 1].map((chart) => (
        <Chart.Root
          key={chart}
          config={{
            first: { color: "#789abc", pattern: { kind } },
            second: { color: "#ed79ae", pattern: { kind: "stripe" } },
          }}
          visibleSeries={visible}
          onVisibleSeriesChange={setVisible}
        >
          <Chart.Legend>
            {chart === 1
              ? (item) => (
                  <>
                    {item.key === "second" ? (
                      <Chart.FillPatternSwatch
                        pattern={{ kind: "duotone", color: "CanvasText" }}
                        color="var(--color-second)"
                      />
                    ) : (
                      item.marker
                    )}
                    {item.label}
                  </>
                )
              : undefined}
          </Chart.Legend>
          <Chart.BarChart
            width={360}
            height={220}
            data={patternRows}
            layout={horizontal ? "vertical" : "horizontal"}
          >
            <defs>
              <linearGradient id={`host-gradient-${chart}`}>
                <stop stopColor="red" />
                <stop offset="1" stopColor="blue" />
              </linearGradient>
            </defs>
            <Chart.XAxis
              dataKey={horizontal ? undefined : "category"}
              type={horizontal ? "number" : "category"}
            />
            <Chart.YAxis
              dataKey={horizontal ? "category" : undefined}
              type={horizontal ? "category" : "number"}
            />
            <Chart.BarSeries
              dataKey="first"
              stackId={stacked ? "total" : undefined}
              material={material}
              fill={override === "fill" ? `url(#host-gradient-${chart})` : undefined}
              style={override === "style" ? { fill: "#123456" } : undefined}
              shape={override === "shape" ? <Chart.Rectangle data-host-shape="" /> : undefined}
              activeBar={
                override === "active" ? <Chart.Rectangle data-host-active="" /> : undefined
              }
              pattern={override === "off" ? "none" : undefined}
            >
              {override === "cell" && <Chart.Cell fill="#123456" />}
            </Chart.BarSeries>
            <Chart.BarSeries
              dataKey="second"
              pattern={{ kind: "duotone", color: "CanvasText" }}
              stackId={stacked ? "total" : undefined}
            />
          </Chart.BarChart>
        </Chart.Root>
      ))}
    </section>
  );
}

const projectionData = [
  { category: "Observed", value: 8, other: 4 },
  { category: "Missing", value: null, other: null },
  { category: "Projected", value: 6, other: 3 },
];
const projection: Chart.BarProjection<(typeof projectionData)[number]> = {
  isProjected: (row) => row.category === "Projected",
  pattern: { kind: "hatch" },
};
/** Public consumer example: filtering/reorder never infer a new projected identity. */
export function ProjectionHost({ horizontal = false }: { horizontal?: boolean }) {
  const [reverse, setReverse] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const [stacked, setStacked] = useState(false);
  const [cells, setCells] = useState(false);
  const [explicit, setExplicit] = useState(false);
  const [none, setNone] = useState(false);
  const [shape, setShape] = useState(false);
  const [activeShape, setActiveShape] = useState(false);
  const [brush, setBrush] = useState(false);
  const [emptyOverride, setEmptyOverride] = useState(false);
  const [datumStyle, setDatumStyle] = useState(false);
  const [datumFill, setDatumFill] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [independent, setIndependent] = useState(false);
  const rows = projectionData
    .filter((row) => !empty && (!filtered || !projection.isProjected(row)))
    .map((row) => ({
      ...row,
      ...(datumFill && projection.isProjected(row) ? { fill: "cyan" } : {}),
      ...(datumStyle && projection.isProjected(row) ? { style: { fill: "cyan" } } : {}),
    }));
  if (reverse) rows.reverse();
  return (
    <>
      <button type="button" onClick={() => setReverse(!reverse)}>
        Reverse projection rows
      </button>
      <button type="button" onClick={() => setFiltered(!filtered)}>
        Filter projected row
      </button>
      <button type="button" onClick={() => setStacked(!stacked)}>
        Stack projection bars
      </button>
      <button type="button" onClick={() => setCells(!cells)}>
        Custom projection cells
      </button>
      <button type="button" onClick={() => setExplicit(!explicit)}>
        Explicit projection fill
      </button>
      <button type="button" onClick={() => setNone(!none)}>
        Disable projection pattern
      </button>
      <button type="button" onClick={() => setShape(!shape)}>
        Native projection shape
      </button>
      <button type="button" onClick={() => setDatumFill(!datumFill)}>
        Datum projection fill
      </button>
      <button type="button" onClick={() => setEmpty(!empty)}>
        Empty projection rows
      </button>
      <button type="button" onClick={() => setIndependent(!independent)}>
        Independent projection rows
      </button>
      <button type="button" onClick={() => setActiveShape(!activeShape)}>
        Active projection shape
      </button>
      <button type="button" onClick={() => setBrush(!brush)}>
        Brush projection rows
      </button>
      <button type="button" onClick={() => setEmptyOverride(!emptyOverride)}>
        Empty series override
      </button>
      <button type="button" onClick={() => setDatumStyle(!datumStyle)}>
        Datum projection style
      </button>
      <Chart.Root
        config={{
          value: { label: "Value", color: ["red", "blue"] },
          other: { label: "Other", color: "green", pattern: { kind: "lines" } },
        }}
      >
        <Chart.BarChart
          width={600}
          height={300}
          data={rows}
          layout={horizontal ? "vertical" : "horizontal"}
        >
          <XAxis
            type={horizontal ? "number" : "category"}
            dataKey={horizontal ? undefined : "category"}
          />
          <YAxis
            type={horizontal ? "category" : "number"}
            dataKey={horizontal ? "category" : undefined}
          />
          {(["value", "other"] as const).map((key) => (
            <Chart.BarSeries<(typeof projectionData)[number], number>
              key={key}
              dataKey={key}
              projection={projection}
              {...(emptyOverride ? { data: [] } : independent ? { data: rows } : {})}
              activeBar={activeShape ? { fill: "pink" } : undefined}
              shape={shape ? <Rectangle fill="pink" /> : undefined}
              stackId={stacked ? "stack" : undefined}
              fill={explicit ? "purple" : undefined}
              pattern={none ? "none" : undefined}
            >
              {cells && rows.map((row) => <Cell key={row.category} fill="orange" />)}
            </Chart.BarSeries>
          ))}
          {brush && <Brush dataKey="category" startIndex={1} endIndex={2} />}
          <Chart.Tooltip
            content={(tooltip) => (
              <Chart.TooltipContent
                tooltip={tooltip}
                isProjected={(entry) => projection.isProjected(entry.payload)}
              />
            )}
          />
        </Chart.BarChart>
      </Chart.Root>
      <table>
        <caption>Observed and projected values</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Value</th>
            <th>Other</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.category}>
              <th>{row.category}</th>
              <td>{row.value ?? "No data"}</td>
              <td>{row.other ?? "No data"}</td>
              <td>{projection.isProjected(row) ? "Projected" : "Observed"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

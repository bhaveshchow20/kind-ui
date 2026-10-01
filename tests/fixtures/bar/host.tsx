// Host composition only: the tarball supplies the entire bar implementation.
import * as Chart from "@kind-ui/charts";
import { useCallback, useState } from "react";
import type { BarShapeProps } from "recharts";
import { CartesianGrid, Cell, LabelList, Rectangle, ReferenceLine, XAxis, YAxis } from "recharts";

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
function Shape({ x, y, width, height, fill, index }: BarShapeProps) {
  return (
    <Rectangle
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
            shape={Shape}
            onClick={() => setClicked((v) => v + 1)}
            {...(stacked ? { stackId: "total" } : {})}
          >
            <LabelList dataKey="value" position="top" />
            {data.map((row, i) => (
              <Cell key={row.category} fill={i === 1 ? "#b40" : "#246"} />
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
            fill="#682"
            {...(stacked ? { stackId: "total" } : {})}
          />
        </Chart.BarChart>
      </Chart.Root>
    </section>
  );
}

// Compile-time public contract: engine tweens must not compete with Motion.
export const rejectedEngineTween: Chart.BarSeriesProps = {
  dataKey: "value",
  // @ts-expect-error Kind reserves native engine animation.
  isAnimationActive: true,
};

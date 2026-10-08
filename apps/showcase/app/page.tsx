"use client";

import * as Chart from "@kind-ui/charts";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  Maximize2,
  Monitor,
  Moon,
  Search,
  Smartphone,
  Sun,
} from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ActivityDemo } from "@/components/activity-demo";
import { AdvancedChartCard, advancedRecipes } from "@/components/advanced-chart-card";
import { CodeBlock } from "@/components/code-block";
import { DemoControls } from "@/components/demo-controls";
import { HeroHeadline } from "@/components/framework-pill";
import { KindLogo } from "@/components/kind-logo";
import { NewChartCard } from "@/components/new-chart-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { activityCode } from "@/lib/activity-recipe";
import { advancedCode } from "@/lib/advanced-chart-recipes";
import { type DemoOptions, demoDefaults } from "@/lib/demo-options";
import { newCode, newRecipes } from "@/lib/new-chart-recipes";
import { docsAccessNote, documentationCharts, showcaseAsset, siteLinks } from "@/lib/site-links";
import { useCopyCode } from "@/lib/use-copy-code";
import { chartSourceData } from "../../seo.mjs";

type Material = "plain" | "clay" | "glow";
const families = [
  "Bar",
  "Line",
  "Area",
  "Combo",
  "Pie",
  "Radar",
  "Radial",
  "Scatter",
  "Heatmap",
  "Waterfall",
  "Sankey",
  "Histogram",
  "Box Plot",
] as const;
type Family = (typeof families)[number];
const repo = siteLinks.repository;
const recipes = [
  {
    id: "line",
    family: "Line",
    title: "Weekly revenue",
    subtitle: "Weekly revenue",
    tag: "Weekly revenue",
    keys: ["a"],
    context: "Weekly revenue across eight weeks, increasing from $3,200 to $5,120.",
  },
  {
    id: "multi",
    family: "Line",
    title: "Traffic by channel",
    subtitle: "Traffic by channel",
    tag: "Traffic by channel",
    keys: ["a", "b", "c"],
    context:
      "Website acquisition, Jan–Aug. Direct, organic search, and social traffic all grew through the summer.",
  },
  {
    id: "area",
    family: "Area",
    title: "Monthly recurring revenue",
    subtitle: "Monthly recurring revenue",
    tag: "Recurring revenue",
    keys: ["a"],
    context:
      "Subscription revenue, Jan–Aug. Monthly recurring revenue increased from $42k to $96k.",
  },
  {
    id: "bars",
    family: "Bar",
    title: "Orders fulfilled",
    subtitle: "Orders fulfilled",
    tag: "Orders fulfilled",
    keys: ["a"],
    context: "Store orders, Jan–Aug. Fulfilment reached 980 orders in August after a softer March.",
  },
  {
    id: "stacked",
    family: "Area",
    title: "Sessions by device",
    subtitle: "Sessions by device",
    tag: "Sessions by device",
    keys: ["a", "b", "c"],
    context:
      "Product sessions, Jan–Aug. See how desktop, mobile, and tablet contribute to total usage.",
  },
  {
    id: "grouped",
    family: "Bar",
    title: "New vs. returning customers",
    subtitle: "New vs. returning customers",
    tag: "New & returning customers",
    keys: ["a", "b"],
    context: "New and returning customers, Jan–Aug. Hover a month to focus both customer groups.",
  },
  {
    id: "steps",
    family: "Line",
    title: "Capacity added",
    subtitle: "Capacity added",
    tag: "Team capacity",
    keys: ["a"],
    context:
      "Available team seats, Jan–Aug. Capacity grows in discrete batches as new seats are purchased.",
  },
  {
    id: "horizontal",
    family: "Bar",
    title: "Campaign conversions",
    subtitle: "Campaign conversions",
    tag: "Campaign leads",
    keys: ["a"],
    context: "June campaign leads. Compare six channels; email generated the most qualified leads.",
  },
  {
    id: "signed",
    family: "Bar",
    title: "Net subscriber change",
    subtitle: "Net subscriber change",
    tag: "Subscriber growth",
    keys: ["a"],
    context:
      "Net subscriber changes, Jan–Aug. Gains and cancellations add up to 170 net new subscribers.",
  },
] as const;
type Recipe = (typeof recipes)[number];
function recipeData(id: string) {
  const values: Record<string, { a: number[]; b?: number[]; c?: number[]; periods?: string[] }> = {
    line: {
      a: [3200, 3450, 3380, 3920, 4160, 4380, 4760, 5120],
      periods: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
    },
    multi: {
      a: [4200, 4800, 4550, 5600, 5900, 6200, 6800, 7400],
      b: [2800, 3200, 3150, 3650, 4100, 4600, 4900, 5300],
      c: [900, 1200, 1100, 1400, 1600, 1850, 2100, 2350],
    },
    area: { a: [42000, 48000, 46000, 59000, 67000, 76000, 84000, 96000] },
    bars: { a: [480, 620, 550, 710, 690, 820, 890, 980] },
    stacked: {
      a: [820, 910, 880, 1050, 1120, 1210, 1300, 1420],
      b: [540, 630, 590, 760, 820, 900, 970, 1080],
      c: [120, 140, 130, 170, 190, 210, 235, 260],
    },
    grouped: {
      a: [46, 52, 49, 61, 65, 73, 79, 83],
      b: [28, 34, 31, 42, 50, 59, 68, 76],
    },
    steps: { a: [20, 20, 35, 35, 50, 50, 75, 96] },
    horizontal: {
      a: [96, 82, 61, 48, 35, 29],
      periods: ["Email", "Search", "Social", "Events", "Partners", "Referral"],
    },
    signed: { a: [18, 32, -12, 43, -19, 54, -8, 62] },
  };
  const v = values[id];
  return v.a.map((a, i) => ({
    month: v.periods?.[i] ?? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"][i],
    a,
    b: v.b?.[i] ?? 0,
    c: v.c?.[i] ?? 0,
  }));
}
function recipeLabels(id: string): Record<string, string> {
  return id === "multi"
    ? { a: "Direct", b: "Organic", c: "Social" }
    : id === "grouped"
      ? { a: "New", b: "Returning", c: "Other" }
      : { a: "Desktop", b: "Mobile", c: "Tablet" };
}

function snippet(
  r: Recipe,
  material: Material,
  colors: string[],
  animate: boolean,
  options: DemoOptions = {},
) {
  const family = r.family;
  const horizontal = r.id === "horizontal";
  const series = r.keys
    .map(
      (k, i) =>
        `          <Chart.${family}Series dataKey="${k}" material="${material}"${family === "Line" ? ` type="${options.curve ?? (r.id === "steps" ? "stepAfter" : "monotone")}" dot={${options.dots ?? false}} strokeWidth={${options.strokeWidth ?? (material === "clay" ? 5 : 3)}}` : family === "Area" ? ` type="${options.curve ?? "monotone"}" fill="${colors[i]}" fillOpacity={${options.fillOpacity ?? (r.id === "area" ? 0.16 : 0.5)}} strokeWidth={${options.strokeWidth ?? 2.5}}${r.id === "stacked" ? ' stackId="devices"' : ""}` : ` radius={${options.radius ?? 5}} maxBarSize={${options.width ?? (horizontal ? 18 : 35)}}${options.stacked ? ' stackId="customers"' : ""}`} />`,
    )
    .join("\n");
  const chartData = recipeData(r.id);
  const config = Object.fromEntries(
    r.keys.map((k, i) => [
      k,
      {
        label: r.keys.length === 1 ? r.subtitle : recipeLabels(r.id)[k],
        color: colors[i],
      },
    ]),
  );
  return `"use client";

import * as Chart from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const data = [
${chartData.map((d) => `  ${JSON.stringify(d)},`).join("\n")}
];

const config: Chart.SeriesConfig = Object.fromEntries(\n  Object.entries(${JSON.stringify(config, null, 2)}).map(([key, value]) => [key, {\n    ...value, formatValue: (v: unknown) => typeof v === "number" ? ${r.id === "area" || r.id === "line" ? '"$" + ' : ""}v.toLocaleString("en-US") : String(v)\n  }])\n);

export function Example() {
  const animate = ${animate};
  return (
    <Chart.Root emphasis="auto" config={config} interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
      style={{ border: 0, padding: 0, background: "transparent" }}>
      <div style={{ height: 240, width: "100%" }}>
        <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <Chart.${family}Chart data={data} animate={${animate}} layout="${horizontal ? "vertical" : "horizontal"}"${r.id === "grouped" ? ' emphasis="category"' : ""}
            accessibilityLayer aria-label="${r.subtitle}"
            margin={{ top: 20, right: 18, left: 0, bottom: 0 }}>
            <Chart.CartesianGrid horizontal={${options.showGrid ?? true}} vertical={false} stroke="var(--chart-grid, #e4e5eb)" strokeDasharray="3 5" />
            <Chart.XAxis ${horizontal ? 'type="number"' : 'dataKey="month" type="category"'} tickLine={false} axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-axis, #767782)" }} tickMargin={10} />
            <Chart.YAxis ${horizontal ? 'dataKey="month" type="category"' : 'type="number"'} tickLine={false} axisLine={false}
              tick={{ fontSize: 12, fill: "var(--chart-axis, #767782)" }} width="auto"${r.id === "area" || r.id === "line" ? ' tickFormatter={value => "$" + Number(value) / 1000 + "k"}' : ""} />${r.id === "signed" ? '\n            <Chart.ReferenceLine y={0} stroke="var(--chart-axis, #767782)" />' : ""}
${series}
            <Chart.Tooltip cursor={${family === "Bar" ? '{ fill: "#a4a8be", fillOpacity: .09 }' : '{ stroke: "#8d8e9b", strokeDasharray: "3 4" }'}} valueAnimation={animate ? "shuffle" : undefined} />
          </Chart.${family}Chart>
        </Chart.ResponsiveContainer>
      </div>
      ${(options.showLegend ?? true) ? `<Chart.Legend aria-label="Focus series for ${r.tag}" />` : ""}
    </Chart.Root>
  );
}`;
}

function ChartCard({
  r,
  material,
  colors,
  animate,
  replay,
  options = {},
}: {
  r: Recipe;
  options?: DemoOptions;
  material: Material;
  colors: string[];
  animate: boolean;
  replay: number;
}) {
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLElement>(null);
  const entered = useInView(cardRef, { once: true, amount: 0.3 });
  const chartAnimate = animate && entered && !reduceMotion;
  const chartData = useMemo(() => recipeData(r.id), [r.id]);
  const config = useMemo(
    () =>
      Object.fromEntries(
        r.keys.map((k, i) => [
          k,
          {
            label: r.keys.length === 1 ? r.subtitle : recipeLabels(r.id)[k],
            color: colors[i],
            formatValue: (v: unknown) =>
              typeof v === "number"
                ? `${r.id === "area" || r.id === "line" ? "$" : ""}${v.toLocaleString("en-US")}`
                : String(v),
          },
        ]),
      ),
    [r, colors],
  );
  const ChartComponent =
    r.family === "Line" ? Chart.LineChart : r.family === "Area" ? Chart.AreaChart : Chart.BarChart;
  const horizontal = r.id === "horizontal";
  const chartChildren = (
    <>
      <Chart.CartesianGrid
        horizontal={options.showGrid ?? true}
        vertical={false}
        stroke="var(--chart-grid)"
        strokeDasharray="3 5"
      />
      <Chart.XAxis
        dataKey={horizontal ? undefined : "month"}
        type={horizontal ? "number" : "category"}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
        tickMargin={10}
      />
      <Chart.YAxis
        dataKey={horizontal ? "month" : undefined}
        type={horizontal ? "category" : "number"}
        tickLine={false}
        axisLine={false}
        tick={{ fontSize: 12, fill: "var(--chart-axis)" }}
        width="auto"
        tickFormatter={
          r.id === "area" || r.id === "line" ? (value) => `$${Number(value) / 1000}k` : undefined
        }
      />
      {r.id === "signed" && <Chart.ReferenceLine y={0} stroke="var(--chart-axis)" />}
      {r.keys.map((k, i) =>
        r.family === "Line" ? (
          <Chart.LineSeries
            key={k}
            dataKey={k}
            type={options.curve ?? (r.id === "steps" ? "stepAfter" : "monotone")}
            dot={options.dots ?? false}
            strokeWidth={options.strokeWidth ?? (material === "clay" ? 5 : 3)}
            material={material}
          />
        ) : r.family === "Area" ? (
          <Chart.AreaSeries
            key={k}
            dataKey={k}
            type={options.curve ?? "monotone"}
            material={material}
            stackId={r.id === "stacked" ? "devices" : undefined}
            fill={colors[i]}
            fillOpacity={options.fillOpacity ?? (r.id === "area" ? 0.16 : 0.5)}
            strokeWidth={options.strokeWidth ?? 2.5}
          />
        ) : (
          <Chart.BarSeries
            key={k}
            dataKey={k}
            material={material}
            radius={options.radius ?? 5}
            maxBarSize={options.width ?? (horizontal ? 18 : 35)}
            stackId={options.stacked ? "customers" : undefined}
          />
        ),
      )}
      <Chart.Tooltip
        cursor={
          r.family === "Bar"
            ? { fill: "#a4a8be", fillOpacity: 0.09 }
            : { stroke: "#8d8e9b", strokeDasharray: "3 4" }
        }
        valueAnimation={chartAnimate ? "shuffle" : undefined}
      />
    </>
  );
  return (
    <motion.article
      ref={cardRef}
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`chart-card ${r.id === "multi" ? "tinted" : ""}`}
    >
      <div className="card-top">
        <h3 className="chart-tag">{r.tag}</h3>
      </div>
      <div className="chart-summary">
        <strong>
          {(r.id === "area" || r.id === "line" ? "$" : "") +
            (r.id === "horizontal"
              ? chartData.reduce((total, row) => total + row.a, 0)
              : r.keys.reduce(
                  (total, key) => total + Number(chartData.at(-1)?.[key as "a" | "b" | "c"] ?? 0),
                  0,
                )
            ).toLocaleString("en-US")}
        </strong>
        <span>{r.id === "line" ? "This week" : r.id === "horizontal" ? "June" : "August"}</span>
      </div>
      <Chart.Root
        className="chart-root"
        emphasis="auto"
        config={config}
        interaction={{ kind: "series", mode: "focus", eligibleKeys: Object.keys(config) }}
      >
        <div className="chart-canvas">
          <Chart.ResponsiveContainer width="100%" height="100%" minWidth={0}>
            {r.family === "Bar" ? (
              <Chart.BarChart
                key={`${replay}-${entered}`}
                data={chartData}
                emphasis={r.id === "grouped" ? "category" : "none"}
                animate={chartAnimate}
                layout={horizontal ? "vertical" : "horizontal"}
                accessibilityLayer
                aria-label={r.subtitle}
                margin={{ top: 20, right: 18, left: 0, bottom: 0 }}
              >
                {chartChildren}
              </Chart.BarChart>
            ) : (
              <ChartComponent
                key={`${replay}-${entered}`}
                data={chartData}
                animate={chartAnimate}
                layout="horizontal"
                accessibilityLayer
                aria-label={r.subtitle}
                margin={{ top: 20, right: 18, left: 0, bottom: 0 }}
              >
                {chartChildren}
              </ChartComponent>
            )}
          </Chart.ResponsiveContainer>
        </div>
        {options.showLegend !== false && <Chart.Legend aria-label={`Focus series for ${r.tag}`} />}
      </Chart.Root>

      <p className="chart-context">{r.context}</p>
    </motion.article>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" width={17} height={17} aria-hidden="true">
      <path
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        fill="currentColor"
      />
    </svg>
  );
}

const appearanceOptions = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
] as const;

const mobileAppearanceOptions = appearanceOptions.map((option) => ({
  ...option,
  Icon: option.value === "system" ? Smartphone : option.Icon,
}));

function MobileThemeSwitcher({ enabled }: { enabled: boolean }) {
  const { theme, setTheme } = useTheme();
  const selected = enabled ? (theme ?? "system") : "system";
  const index = mobileAppearanceOptions.findIndex((option) => option.value === selected);
  const current = mobileAppearanceOptions[index < 0 ? 2 : index];
  const next = mobileAppearanceOptions[(index + 1) % mobileAppearanceOptions.length];
  const Icon = current.Icon;
  return (
    <button
      className="mobile-theme"
      type="button"
      disabled={!enabled}
      onClick={() => setTheme(next.value)}
      aria-label={`Appearance: ${current.label}. Switch to ${next.label}`}
      title={`Appearance: ${current.label}. Switch to ${next.label}`}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}

function ThemeSwitcher({ enabled }: { enabled: boolean }) {
  const { theme, setTheme } = useTheme();
  const id = useId();
  const reduced = useReducedMotion();
  return (
    <RadioGroup
      className="nav-theme-switcher"
      aria-label="Appearance"
      value={enabled ? (theme ?? "system") : "system"}
      onValueChange={setTheme}
      disabled={!enabled}
    >
      {appearanceOptions.map(({ value, label, Icon }) => (
        <RadioGroupItem asChild key={value} value={value} aria-label={label}>
          <button type="button" className="nav-theme-option" title={label}>
            {(enabled ? (theme ?? "system") : "system") === value && (
              <motion.span
                className="nav-theme-selection"
                aria-hidden="true"
                layoutId={reduced ? undefined : `${id}-theme`}
                transition={{ type: "spring", stiffness: 430, damping: 36 }}
              />
            )}
            <Icon size={17} aria-hidden="true" />
          </button>
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}

function DocumentationSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && !event.repeat) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const filtered = documentationCharts.filter(({ name }) =>
    name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) setQuery("");
      }}
    >
      <DialogTrigger asChild>
        <Button
          className="nav-search"
          variant="ghost"
          size="icon-sm"
          aria-label="Search documentation"
          title="Search documentation (⌘K / Ctrl+K)"
        >
          <Search size={17} />
        </Button>
      </DialogTrigger>
      <DialogContent className="documentation-search" showCloseButton={false}>
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Search chart components in Kind UI Charts.
        </DialogDescription>
        <div className="documentation-search-input">
          <Search size={19} aria-hidden="true" />
          <input
            aria-label="Search components"
            placeholder="Search components…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="button" onClick={() => setOpen(false)} aria-label="Close search">
            Close
          </button>
        </div>
        {/* Keyboard focus enables scrolling this results panel. */}
        {/* biome-ignore lint/a11y/noNoninteractiveTabindex: Scrollable content needs keyboard access. */}
        <section className="documentation-search-results" tabIndex={0} aria-label="Results">
          <h2>Components</h2>
          <p className="docs-access-note">{docsAccessNote}</p>
          <span className="sr-only" role="status">
            {filtered.length} components found
          </span>
          <ul>
            {filtered.map(({ name, href }) => (
              <li key={name}>
                <a href={href} target="_blank" rel="noreferrer" title={docsAccessNote}>
                  <span className="documentation-chart-dot" aria-hidden="true" />
                  {name} Chart
                </a>
              </li>
            ))}
          </ul>
          {!filtered.length && <p>No components found.</p>}
        </section>
      </DialogContent>
    </Dialog>
  );
}

const installCommands = {
  npm: "npm install @kind-ui/charts",
  pnpm: "pnpm add @kind-ui/charts",
  yarn: "yarn add @kind-ui/charts",
  bun: "bun add @kind-ui/charts",
};
type PackageManager = keyof typeof installCommands;

function InstallSection() {
  const [manager, setManager] = useState<PackageManager>("npm");
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const copyRequest = useRef(0);
  useEffect(
    () => () => {
      copyRequest.current += 1;
      clearTimeout(copyTimer.current);
    },
    [],
  );
  async function copyCommand() {
    const request = ++copyRequest.current;
    try {
      await navigator.clipboard.writeText(installCommands[manager]);
      if (request !== copyRequest.current) return;
      setCopied(true);
      setCopyFailed(false);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      if (request === copyRequest.current) setCopyFailed(true);
    }
  }
  return (
    <section className="install-section" aria-label="Install Kind UI Charts">
      <Tabs
        className="install-panel"
        value={manager}
        onValueChange={(value) => {
          copyRequest.current += 1;
          clearTimeout(copyTimer.current);
          setManager(value as PackageManager);
          setCopied(false);
          setCopyFailed(false);
        }}
      >
        <div className="install-panel-header">
          <TabsList className="install-manager-tabs" aria-label="Package manager">
            {(Object.keys(installCommands) as PackageManager[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {key}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="ghost"
            size="icon-sm"
            className="install-copy"
            onClick={copyCommand}
            aria-label={copied ? "Install command copied" : "Copy install command"}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        {(Object.keys(installCommands) as PackageManager[]).map((key) => (
          <TabsContent key={key} value={key} className="install-panel-content">
            <code>
              <span className="install-prompt" aria-hidden="true">
                ${" "}
              </span>
              <span className="install-tool">{key}</span>
              {key === "npm" ? " install " : " add "}
              <span className="install-package">@kind-ui/charts</span>
            </code>
          </TabsContent>
        ))}
      </Tabs>
      <span className="sr-only" role="status">
        {copied
          ? "Install command copied"
          : copyFailed
            ? "Could not copy. Select the command to copy manually."
            : ""}
      </span>
    </section>
  );
}

type GalleryEntry = {
  id: string;
  family: Family;
  tag: string;
  context: string;
  source: "basic" | "advanced" | "new" | "activity";
};
const excluded = new Set(["steps", "signed", "radar-range", "radial", "radial-stacked"]);
const gallery: GalleryEntry[] = [
  ...recipes.filter((r) => !excluded.has(r.id)).map((r) => ({ ...r, source: "basic" as const })),
  ...advancedRecipes
    .filter((r) => !excluded.has(r.id))
    .map((r) => ({ ...r, source: "advanced" as const })),
  ...newRecipes.map((r) => ({ ...r, source: "new" as const })),
  {
    id: "activity",
    family: "Radial",
    tag: "Daily activity",
    context: "Move: 350 of 500 kcal. Exercise: 30 of 60 minutes. Stand: 9 of 12 hours.",
    source: "activity",
  },
];
function findRecipe<T extends { id: string }>(entries: readonly T[], id: string): T {
  const recipe = entries.find((entry) => entry.id === id);
  if (!recipe) throw new Error(`Unknown chart example: ${id}`);
  return recipe;
}
const exampleColors: Record<string, string[]> = {
  line: ["#1686ff", "#7ec5ff", "#d0edff"],
  multi: ["#248cff", "#ff659e", "#ffb829"],
  area: ["#9a63f6", "#c29aff", "#eee5ff"],
  stacked: ["#4e9cff", "#ffc145", "#ff82bd"],
  bars: ["#418fff", "#90baff", "#d1e4ff"],
  grouped: ["#9161f3", "#e1c4ff", "#f2e5ff"],
  horizontal: ["#29bba4", "#89e5d5", "#c7f5eb"],
  combo: ["#4b95ff", "#ffb430", "#cee1ff"],
  "combo-area": ["#22b99f", "#ffb43d", "#bdf0e6"],
  pie: ["#f19a51", "#ffd17b", "#ee668b"],
  donut: ["#a25ff5", "#ff85bd", "#ffd28a"],
  radar: ["#20b898", "#fdb648", "#b9f0df"],
  "radar-outline": ["#8d68ef", "#fa799e", "#d2c1fc"],
  gauge: ["#20bc9d", "#a5ead9", "#dbf8ef"],
  scatter: ["#2b91ff", "#ff8a57", "#bbe1ff"],
  bubble: ["#a666f0", "#d5b2ff", "#eee3ff"],
  "line-configured": ["#498fff", "#20b997", "#c5e9ff"],
  "heatmap-support": ["#fff5e1", "#ffc768", "#f57e37"],
  "heatmap-retention": ["#e6fbec", "#88dfa2", "#20a675"],
  "waterfall-revenue": ["#7388e7", "#28bf99", "#ff6c91"],
  "waterfall-budget": ["#5f92ed", "#27b99b", "#ff9653"],
  "sankey-acquisition": ["#4b9df9", "#b083f3", "#40c7ad"],
  "sankey-energy": ["#558de3", "#ffc147", "#30c79d"],
  "histogram-orders": ["#f2a248", "#ffd096", "#fff0dc"],
  "histogram-latency": ["#48a2f9", "#a2d3fc", "#dcf0ff"],
  "box-latency": ["#a475ed", "#cda9ff", "#eee1ff"],
  "box-regions": ["#24b493", "#85dfc4", "#cbf4e6"],
};
function colorsFor(entry: GalleryEntry) {
  return exampleColors[entry.id] ?? ["#8d77cb", "#bfaee4", "#e4dcf4"];
}
function renderEntry(entry: GalleryEntry, options: DemoOptions, animate: boolean) {
  const props = {
    material: "plain" as const,
    colors: colorsFor(entry),
    animate,
    replay: 0,
    options,
  };
  if (entry.source === "activity") return <ActivityDemo options={options} />;
  if (entry.source === "basic") return <ChartCard r={findRecipe(recipes, entry.id)} {...props} />;
  if (entry.source === "advanced")
    return <AdvancedChartCard recipe={findRecipe(advancedRecipes, entry.id)} {...props} />;
  return <NewChartCard recipe={findRecipe(newRecipes, entry.id)} {...props} />;
}
function entryCode(entry: GalleryEntry, options: DemoOptions, animate: boolean) {
  if (entry.source === "activity") return activityCode(options, animate);
  if (entry.source === "basic")
    return snippet(findRecipe(recipes, entry.id), "plain", colorsFor(entry), animate, options);
  if (entry.source === "advanced")
    return advancedCode(
      findRecipe(advancedRecipes, entry.id),
      "plain",
      colorsFor(entry),
      animate,
      options,
    );
  return newCode(findRecipe(newRecipes, entry.id), "plain", colorsFor(entry), animate, options);
}
export default function Page() {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", resolvedTheme === "dark" ? "#000000" : "#ffffff");
    });
  }, [resolvedTheme]);
  const [family, setFamily] = useState<Family>("Bar");
  const [selected, setSelected] = useState<GalleryEntry | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("preview");
  const [options, setOptions] = useState<DemoOptions>(demoDefaults("area"));
  const shown = gallery.filter((entry) => entry.family === family);
  const code = selected ? entryCode(selected, options, !reduceMotion) : "";
  const { copy, copied, message } = useCopyCode(code);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  function explore(entry: GalleryEntry) {
    setSelected(entry);
    setOptions(demoDefaults(entry.id));
    setView("preview");
    setOpen(true);
  }
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: { registerTool: (tool: unknown, options: unknown) => void | Promise<void> };
      }
    ).modelContext;
    if (!context) return;
    const lifecycle = new AbortController();
    const registration = context.registerTool(
      {
        name: "configure_chart_showcase",
        description: "Choose a chart family in the Kind UI gallery.",
        inputSchema: {
          type: "object",
          properties: { family: { type: "string", enum: families } },
          required: ["family"],
        },
        execute: async (input: unknown) => {
          const value = (input as { family?: Family }).family;
          if (!value || !families.includes(value))
            return {
              isError: true,
              content: [{ type: "text", text: "Choose a listed chart family." }],
            };
          setFamily(value);
          setOpen(false);
          return { content: [{ type: "text", text: `Showing ${value} examples.` }] };
        },
      },
      { signal: lifecycle.signal },
    );
    void Promise.resolve(registration).catch((error: unknown) => {
      if (!lifecycle.signal.aborted) console.error("Chart gallery tool registration failed", error);
    });
    return () => lifecycle.abort();
  }, []);
  return (
    <>
      <script type="application/ld+json">
        {JSON.stringify(chartSourceData).replace(/</g, "\\u003c")}
      </script>
      <a className="skip-link" href="#showcase">
        Skip to components
      </a>
      <main id="top" className="kind-home">
        <header className="kind-nav">
          <a className="wordmark" href={siteLinks.home} aria-label="Kind UI Charts home">
            <span className="brand-flower" aria-hidden="true">
              🌸
            </span>
            <span className="wordmark-title">
              <KindLogo />
              <span className="wordmark-charts">/charts</span>
            </span>
          </a>
          <nav className="kind-nav-links" aria-label="Main">
            <a href={siteLinks.docs} target="_blank" rel="noreferrer">
              Documentation <ArrowUpRight size={12} />
            </a>
          </nav>
          <div className="kind-nav-actions">
            <DocumentationSearch />
            <a
              className="mobile-docs"
              href={siteLinks.docs}
              target="_blank"
              rel="noreferrer"
              aria-label="Documentation"
              title="Documentation"
            >
              <BookOpen size={17} aria-hidden="true" />
            </a>
            <ThemeSwitcher enabled={mounted} />
            <MobileThemeSwitcher enabled={mounted} />
            <a
              className="kind-github"
              href={repo}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
            >
              <GitHubMark />
              <span>GitHub</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </header>

        <section className="kind-hero hero" aria-labelledby="hero-title">
          <motion.div
            className="kind-hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroHeadline />
            <div className="hero-install">
              <InstallSection />
            </div>
          </motion.div>
        </section>
        <section id="showcase" className="kind-gallery" tabIndex={-1} aria-label="Chart examples">
          <Tabs
            value={family}
            onValueChange={(value) => {
              setFamily(value as Family);
              setOpen(false);
            }}
          >
            <TabsList className="collection-tabs" aria-label="Chart families">
              {families.map((name) => (
                <TabsTrigger key={name} value={name}>
                  {name === "Radial" ? "Activity" : name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className={`demo-grid examples-${shown.length}`}>
            {shown.map((entry) => (
              // biome-ignore lint/a11y/noStaticElementInteractions: Pointer shortcut; the expand button provides keyboard access.
              // biome-ignore lint/a11y/useKeyWithClickEvents: The adjacent expand button is the keyboard equivalent.
              <div
                className={`example-shell example-${entry.id}`}
                key={entry.id}
                onClick={(event) => {
                  if (!(event.target as Element).closest('button,a,input,[role="gridcell"]')) {
                    triggerRef.current = event.currentTarget.querySelector(".tile-open");
                    explore(entry);
                  }
                }}
              >
                {renderEntry(entry, demoDefaults(entry.id), true)}
                <button
                  className="tile-open"
                  type="button"
                  aria-label={`Expand ${entry.tag}`}
                  onClick={(event) => {
                    triggerRef.current = event.currentTarget;
                    explore(entry);
                  }}
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            {selected && (
              <DialogContent
                className="component-playground"
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  document
                    .querySelector<HTMLButtonElement>(
                      '.component-playground [role="tab"][data-state="active"]',
                    )
                    ?.focus();
                }}
                onCloseAutoFocus={(event) => {
                  event.preventDefault();
                  triggerRef.current?.focus();
                }}
              >
                <div className="playground-main">
                  <Tabs value={view} onValueChange={setView}>
                    <div className="playground-tab-row">
                      <TabsList aria-label="Component view">
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                        <TabsTrigger value="code">Code</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent
                      value="preview"
                      className={`playground-preview example-${selected.id}`}
                    >
                      {renderEntry(selected, options, true)}
                    </TabsContent>
                    <TabsContent value="code" className="playground-source">
                      <button
                        className="code-copy-icon"
                        type="button"
                        onClick={copy}
                        aria-label={copied ? "Copied code" : "Copy code"}
                        title={copied ? "Copied" : "Copy code"}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <CodeBlock code={code} />
                    </TabsContent>
                  </Tabs>
                </div>
                <div className="playground-sidebar">
                  <DialogTitle>
                    {selected.id === "activity"
                      ? "Activity Rings"
                      : selected.id === "gauge"
                        ? "Gauge Chart"
                        : selected.id === "donut"
                          ? "Donut Chart"
                          : `${selected.family} Chart`}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    {selected.context} Customize the example or copy its React code.
                  </DialogDescription>
                  <DemoControls
                    family={selected.family}
                    id={selected.id}
                    options={options}
                    onChange={setOptions}
                  />
                  <div className="playground-footer">
                    <a
                      href={`${siteLinks.docs}components/${selected.family === "Box Plot" ? "box-plot" : selected.family.toLowerCase()}/`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Go to Documentation <ArrowUpRight size={13} />
                    </a>
                    <span role="status">{message}</span>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </section>
      </main>
      <footer className="cloud-footer kind-cloud-footer">
        <img
          className="footer-art"
          src={showcaseAsset("/footer-clouds.webp")}
          alt=""
          width={2172}
          height={724}
          loading="lazy"
        />
        <div className="footer-bloom" aria-hidden="true" />
        <div className="footer-inner">
          <p className="footer-wordmark" role="img" aria-label="Kind UI">
            <KindLogo />
          </p>
          <nav className="chart-guide-links" aria-label="Chart documentation">
            {documentationCharts
              .filter(
                (chart, index, charts) =>
                  charts.findIndex(({ href }) => href === chart.href) === index,
              )
              .map(({ name, href }) => (
                <a key={href} href={href}>
                  {name} charts
                </a>
              ))}
          </nav>
          <div className="footer-bottom">
            <a className="footer-credit" href={siteLinks.creator} target="_blank" rel="noreferrer">
              By Bhavesh Chowdhury
            </a>
            <nav aria-label="Footer">
              <a href={siteLinks.docs} target="_blank" rel="noreferrer">
                Docs
              </a>
              <a href={`${repo}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
                MIT license
              </a>
              <a className="footer-top" href="#top">
                Back to top ↑
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}

# Kind UI charts

React components compose real Recharts lines, areas and bars with shared pointer/keyboard state, measured tooltip placement, metadata and controlled visibility. Each chart accepts `animate={false | true | config}` for coordinated reveal and hover animation. Consumers own data shape, scales, axes, grids, reference lines, custom marks, copy and layout.

Pre-release and unpublished. The examples below use this workspace's built `@kind-ui/charts` package, not an npm installation claim. Tested with React/React DOM 19.3.0, Recharts 3.10.1, Motion 13.4.6, and TypeScript 5.9.3. The package declares compatible peers; the workspace pins the tested versions.

```tsx
import { useState } from "react";
import * as Chart from "@kind-ui/charts";
import { ResponsiveContainer, XAxis } from "recharts";
import "@kind-ui/charts/styles.css";

const config = {
  tasks: { label: "Tasks", color: "#3659b8", formatValue: (value) => `${value} tasks` },
} satisfies Chart.SeriesConfig;

export function TasksChart() {
  const [visible, setVisible] = useState<string[]>(["tasks"]);
  return (
    <Chart.Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
      <Chart.Legend aria-label="Visible series" />
      <ResponsiveContainer width="100%" height={240}>
        <Chart.LineChart data={[{ day: "Mon", tasks: 0 }, { day: "Tue", tasks: null }]} accessibilityLayer aria-label="Tasks by day">
          <XAxis dataKey="day" />
          <Chart.LineSeries dataKey="tasks" connectNulls={false} />
          <Chart.Tooltip />
        </Chart.LineChart>
      </ResponsiveContainer>
    </Chart.Root>
  );
}
```

`Chart` above is a normal ES module namespace import. Direct named imports also work: `import { Root, Legend, TooltipContent } from "@kind-ui/charts"`. The module exports `SeriesConfig` and each component's `*Props` type; there is no additional `Chart` object export.

## Line ownership and API

| Owner | Responsibilities |
| --- | --- |
| Kind | Root metadata and colors, LineSeries visibility, shared pointer/keyboard modality, measured tooltip bounds, optional reveal/default active-marker/tooltip motion |
| Recharts | Geometry, curve interpolation, axes/scales, graphical-item registration, payload and active selection, keyboard traversal and Escape/blur dismissal |
| Consumer | Data and ordering, controlled visibleSeries, sizing, axes/grid/reference lines, custom dot/activeDot/shape/content, labels, styling, accessible name/instructions and data alternative |

Render `LineChart` inside `Root`, and `LineSeries`/`Tooltip` inside `LineChart`. Engine children such as `XAxis`, `YAxis`, `CartesianGrid`, `ReferenceLine`, `LabelList` and `ErrorBar` keep their native composition path. There is no prescribed data schema, card or layout. The wrappers render registered Recharts components, rather than inspecting child display names or reexporting the engine.

- `LineChart`: native Recharts chart props and SVG ref. Kind composes `onMouseMove`/`onMouseLeave` with its own pointer tracking and captures focus/keyboard changes without replacing Root handlers. The ref targets `SVGSVGElement`, including React 19 callback cleanup. The internal frame uses `display: contents` so sizing stays with the engine or `ResponsiveContainer`.
- `LineSeries`: native `Line` props/children/custom `dot`, `activeDot`, `shape` and handlers. Motion owns animation, so `isAnimationActive` is excluded and Recharts animation is always disabled. `stroke` defaults to Root's color. A Root-hidden series stays hidden even with `hide={false}`; `hide={true}` additionally hides a series. String `dataKey` is the default metadata identity. Use `seriesKey` for function/numeric data keys, required with controlled visibility. Native tooltip payloads remain unchanged; Kind's default content resolves registered identities for metadata and filtering. Recharts Line has no public component ref in 3.10.1: use refs on your custom mark/shape nodes, retaining the engine shape's `pathRef` where needed.
- `Tooltip`: native selection/formatting/cursor/trigger/style props and element/function `content`, plus `maxWidth` (180 by default), native `frameProps` and a ref to the measured div. Kind owns `position`, `isAnimationActive`, the chart portal and bounds/translation options (`allowEscapeViewBox`, `reverseDirection`, `useTranslate3d`); those props are excluded. `offset` is honored as a number or x/y pair, defaulting to 12. It measures width and height with ResizeObserver, follows the pointer, and uses the engine coordinate after keyboard interaction. Oversized content gets chart-sized width/height limits and scrolling. Frame styles/classes may customize presentation; overriding sizing, margins or transforms can change bounds. A custom content component receives native engine props and owns its accessible feedback. Defaults are `cursor={false}`, `filterNull={false}` and `TooltipContent`.

Custom shape/content functions should be stable component types defined outside render when they retain state. Engine `wrapperStyle`, axes, IDs and native refs keep their upstream semantics. Custom tooltip portals/anchors can instead use a native Recharts Tooltip; it can share Root's `TooltipContent` metadata.

## Line animation

Import the same components from `@kind-ui/charts` in every mode. `LineChart` accepts `animate`, defaulting to `false`: `false` renders immediately, `true` enables defaults, and a `LineAnimation` object enables animation with overrides. It exposes `revealDurationMs` (1000 by default), Motion `revealEasing` and `hoverTransition` (spring by default). Import the stylesheet for shared SVG reveal clipping:

```tsx
import { Root, LineChart, LineSeries, Tooltip } from "@kind-ui/charts";
import { XAxis } from "recharts";
import "@kind-ui/charts/styles.css";

<Root config={{ count: { label: "Count", color: "#345" } }}>
  <LineChart width={400} height={220} data={points}
    animate={{ revealDurationMs: 900, revealEasing: "easeOut", hoverTransition: { duration: 0.2 } }}>
    <XAxis dataKey="day" />
    <LineSeries dataKey="count" />
    <Tooltip />
  </LineChart>
</Root>
```

Motion is a required peer, including when `animate={false}`. This prop controls behavior; it does not remove Motion installation or bundle bytes. We use synchronous `motion/react` imports to keep component identities and customization stable across modes, without asynchronous loading/error states. Motion's [LazyMotion](https://motion.dev/docs/react-lazy-motion) can defer features, but that is a separate loading/bundle strategy, not a consequence of disabling animation. The prior unpublished `/motion` export, `motion` prop and `LineMotion` type are removed; migrate imports to the root and use `animate` and `LineAnimation`. All packages remain private at `0.0.0`; this is a pre-release API revision, with no publication or release.

The single-prop mode follows the familiar behavioral toggle in [Nivo](https://nivo.rocks/line/); [EvilCharts](https://evilcharts.com/docs/recharts/line-chart/static) also exposes a disabled intro mode. These are API references, not reused implementations or additional renderers. Recharts still owns geometry and selection. Motion owns one chart-space clip for all line strokes and resting dots, the default active marker and tooltip translation. Engine animation is forced off and excluded from `LineSeriesProps`. Custom marks/shapes/content retain consumer ownership; custom active dots replace the default animated mark. Arbitrary path morphing and animation of axes are outside this contract.

The package subscribes reactively to reduced motion and starts disabled during server rendering. Reduced motion or explicit off snaps in-flight hover targets immediately. Focus, keyboard or pointer interaction finishes entrance; chart or per-series data/visibility identity, effective series visibility (including native `hide`), or measured size changes also cancel entrance, discard stale pointer pixels and snap existing hover targets. Hover motion resumes on the next pointer/keyboard input. Ordinary hover retargets the same mounted marks and tooltip. Entrance does not replay after interaction/update; remount to request a fresh entrance. Palette changes preserve chart state. Controlled Root visibility fades each line curve and resting dots over 180ms without replaying entrance or replacing the chart. Rapid reversals retarget the current opacity; hidden series leave tooltip content and pointer interaction immediately. Completion also invalidates geometry after an automatic-domain update. Off/reduced-motion modes snap visibility. Native `hide`, independently portaled labels/error bars and custom active marks retain native behavior. Keep an all-hidden message outside the mounted chart to preserve its interaction state. The clip requires the stylesheet; pointer/keyboard state and tooltip measurement work without it.

## Line materials

The existing `/recipes.html` line showcase has a compact Plain/Paper/Clay/Glow selector alongside palette and Motion controls. It applies this public API to all eight existing recipes while retaining their data, markers, labels and visibility.

`LineSeries material="plain" | "paper" | "clay" | "glow"` changes the default SVG curve's surface independently of color and animation. The exported `LineMaterial` type names these options. Plain is the existing default. Paper adds static fine fiber variation inside the ink stroke (2.5px by default); Clay adds a rounded, softly lit bevel, inner shade and a small neutral cast shadow (6px by default). Glow adds close and soft series-colored halos around a crisp 3px stroke, with a narrow neutral light core. All materials retain the engine's original quantitative path: no displacement, rough geometry or path morphing. Thin Clay strokes show less relief; use `strokeWidth` to choose thickness explicitly. Material defaults use round joins and solid-line caps; dashed lines use butt caps to keep their gaps visible. Native `strokeLinecap`, `strokeLinejoin`, dash patterns and handlers remain available.

```tsx
<Root config={{ count: { label: "Count", color: "var(--color-count-ink)" } }}>
  <LineChart width={400} height={220} data={points} animate={false}>
    <LineSeries dataKey="count" material="clay" strokeWidth={5} dot={false} />
    <Tooltip />
  </LineChart>
</Root>
```

Keep colors in `SeriesConfig`, CSS variables or an explicit `stroke`. For Tailwind CSS 4, for example, define `@theme { --color-count-ink: #8b5040; }` in the host stylesheet. A material does not choose a palette or theme surrounding UI. Legend/tooltip indicators still represent the series' unlit color; when setting a different explicit `stroke`, keep the config color consistent if indicators should match it.

| CSS variable (inherit from Root or host) | Default | Purpose |
| --- | --- | --- |
| `--kind-ui-line-paper-fiber` | `#fff` | Fiber tint, composited inside the ink |
| `--kind-ui-line-paper-grain` | `0.38` | Fiber opacity, use a number from 0 to 1 |
| `--kind-ui-line-clay-light` | `#fff` | Neutral bevel light |
| `--kind-ui-line-clay-shade` | `#17212b` | Neutral inner and cast shade |
| `--kind-ui-line-glow-light` | `#fff` | Narrow luminous core tint |
| `--kind-ui-line-glow-opacity` | `0.5` | Close and outer halo opacity, use a number from 0 to 1 |

These tokens work in plain CSS and Tailwind arbitrary properties, such as `[--kind-ui-line-paper-grain:0.2]` on Root. Existing component tokens independently style the restrained legend and tooltip. The defaults are original SVG compositions; [PaperCSS](https://www.getpapercss.com/) and [clay.css](https://github.com/codeAdrian/clay.css) are visual references for HTML surfaces, not dependencies or copied code. SVG [specular lighting](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/feSpecularLighting) supplies Clay's bevel; [Tailwind theme variables](https://tailwindcss.com/docs/theme) can supply host colors.

Materials apply only to the default line shape. An explicit native `shape` or `filter` takes precedence, disables built-in material rendering and retains consumer ownership. Dots, active marks, error bars, axes, labels, tooltip content and legends keep their existing rendering; custom shapes need their own surface treatment. The filtered curve retains the engine pathRef and plot clipping, and Motion still controls the shared reveal clip and hover motion. Off/reduced-motion modes keep static materials. Hidden series allocate no rendered filters after their visibility exit completes. Each mounted series has its own filter ID independent of a supplied Line ID; separately mounted React roots should use React's `identifierPrefix` to avoid document-wide ID collisions.

Only curves are filtered, with bounds padded by half the numeric `strokeWidth` plus 6 SVG units (a 12-unit width allowance for nonnumeric widths). Set a numeric `strokeWidth` for unusually wide strokes instead of overriding it only in CSS. Bounds use engine point extents, so custom curve interpolation that overshoots those extents may require a consumer shape/filter. Paper uses one static turbulence octave; Clay uses alpha blur and lighting; Glow uses two small static painted-stroke blurs and a light core composited inside the original stroke. No filter time animation, shader engine, additional dependency or canvas-wide filter is introduced. Filters add browser raster work proportional to each curve's bounding rectangle; many long overlapping series can be costly. Plain avoids this work. Current visual/interaction evidence covers Chromium, including narrow, flat and colored lines; other browsers, print/export renderers and dark host surfaces need their own verification. This additive pre-release API keeps packages private at `0.0.0`; no release or publication is implied.

## Contracts

- `SeriesConfig`: a record keyed by a string `dataKey`. Each entry has a string `label`, CSS `color`, and optional `formatValue(value)` returning React content. Keys start with a letter and contain letters, numbers, underscores, or hyphens. No data normalization or scales are introduced.
- `Root`: scopes config and `--color-{key}` CSS variables. It forwards native div props/ref. The default stylesheet provides full width with `min-width: 0`. Set chart height explicitly through the underlying chart or `ResponsiveContainer`. Nested or adjacent containers keep separate metadata and colors.
- `visibleSeries` is optional and consumer-owned. A callback requires this value; the legend requests the next array but never changes it itself. `LineSeries` applies this visibility automatically; keep native engine marks' `hide` props in sync when using them directly. Omit the callback for a static legend. An empty array means all series are hidden; the example owns that empty-state message.
- `Legend`: renders a native list; with a callback, it renders native toggle buttons with `aria-pressed`. It forwards ul props/ref. Space/Enter work through normal button behavior; focus stays on the button. Style its root with `className`/`style`, or set `--chart-legend-background` on buttons. You can also build your own legend from the same config.
- `TooltipContent`: pass the upstream callback's props as `tooltip`. Native div props/ref, classes, and style remain separate and are forwarded. Upstream `formatter`, per-entry formatter, and `labelFormatter` work; per-entry formatters take precedence over the upstream formatter, which takes precedence over the config formatter. An upstream formatter returning null/undefined suppresses that entry. Formatters run for zero but not null/undefined; those display `missingValue` (default “No data”) alongside other available values. Inactive, empty, or entirely missing visible payloads render no tooltip; zero remains valid data.
- Tooltip entries marked hidden or `type: "none"` are excluded, as are consumer-hidden series. Use `filterNull={false}` on the upstream Tooltip when missing values should appear. Unknown keys fall back to upstream names/colors/values. No tooltip payload is mutated.
- Keyboard positioning, Escape/blur dismissal, focus and live-region orchestration remain with the upstream chart/Tooltip. Content supplies its default `role="status"` and live-region attributes when the upstream accessibility layer is enabled. Preserve equivalent feedback when overriding these attributes.

Provide a named chart, keyboard instructions and a semantic data alternative appropriate to your application. The data alternative stays application-owned and should preserve hidden series in its table. Browser tests are evidence for this example, not a screen-reader compatibility or WCAG claim. No cross-framework or SSR/hydration support claim is made yet.

Consumer checks use `strict: true` with `skipLibCheck: false` in NodeNext and Bundler modes. Adding `exactOptionalPropertyTypes: true` with full dependency checking currently fails in upstream declarations, even without importing Kind UI; that stricter combination is not claimed yet.

The usage example has black monochrome and color palettes, a compact Tailwind CSS 4 layout, and a self-hosted Latin Geist font. Its series use solid/circle and dashed/diamond marks, so color is not the only distinction. Switching palettes preserves chart state. The font's OFL license is included with the example. Component defaults use host `border`, `radius`, `popover` and `popover-foreground` variables when present, with native CSS fallbacks. Tailwind and the font are example tooling, not runtime dependencies or required styling choices for package consumers.

## Styling

Import `@kind-ui/charts/styles.css` once for the default appearance. The JavaScript entry does not import CSS, so Node consumers can still import the components directly. The stylesheet contains only scoped component rules in the `kind-ui` cascade layer; it adds no page reset, theme or font. Omitting it leaves presentation to the host. All component defaults ship in this one CSS asset.

For plain CSS, import the stylesheet before your application stylesheet. Normal unlayered application rules override its layered defaults. With Tailwind CSS 4, declare the order before both imports in your application CSS:

```css
@layer theme, base, kind-ui, components, utilities;
@import "tailwindcss";
@import "@kind-ui/charts/styles.css";
```

This order lets normal utility classes override component defaults without `!important`. Low selector specificity alone cannot override an incorrectly ordered cascade layer. Native `style` props on `Root`, `Legend` and `TooltipContent` still take precedence over normal stylesheet rules.

Theme the components with `--kind-ui-chart-border`, `--kind-ui-chart-radius`, `--kind-ui-chart-popover`, `--kind-ui-chart-popover-foreground` and `--kind-ui-chart-legend-background`. They fall back to the existing host tokens; `--chart-legend-background` remains supported. Fixed layout/spacing values can be overridden through classes or CSS rather than a variable for every declaration.

Default legends use 8px markers and 11px labels; interactive legend buttons retain native semantics with a minimum 28px height. Hidden legend buttons use readable muted text and markers with no strikethrough, preserving `aria-pressed`. The default tooltip uses compact 12px text, slim series markers, aligned tabular values and measured content width capped by `maxWidth` (180px by default). Host metadata owns concise labels and units; formatter and custom content overrides remain supported. Override the scoped styles or theme tokens as needed. `Tooltip` supplies mouse-following placement with measured boundary clamping and keyboard fallback. A guide is independent of tooltip content: use `<Tooltip cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "2 4", strokeWidth: 1 }} />` for a dotted hover line or `cursor={false}` (the default) to hide only the guide. The existing recipes demonstrate this with a Hover guide toggle.

Stable `data-kind-ui` hooks are `chart`, `chart-legend`, `chart-legend-item`, `chart-legend-button`, `chart-indicator`, `chart-tooltip`, `chart-tooltip-label`, `chart-tooltip-list`, `chart-tooltip-item` and `chart-tooltip-value`. Line components additionally expose `line-frame`, `tooltip-frame`, `tooltip-motion` and `active-marker`. Legend and tooltip items also expose `data-series` with their series key. Use that identity for series-specific styles instead of positional selectors; tooltip entries may be reordered or hidden. Interactive legend buttons retain `aria-pressed` for state styling. For example:

```css
.my-chart [data-series="tasks"] [data-kind-ui="chart-indicator"] {
  border-radius: 50%;
}
```

Per-instance series colors and per-entry indicator color values remain inline CSS variables. They are data-dependent, not theme defaults. Chart dimensions, axes and other engine geometry stay application-owned.

## Develop

At the repository root: `npm ci`, then `npm exec playwright install -- --with-deps chromium` (Linux dependencies may need administrator permission). Run `npm run dev:chart` for the example, or `npm run check` for library, packed-consumer, type and browser checks.

The packed check first builds an actual tarball, installs it and the pinned peer/type dependencies into an isolated consumer, then checks public APIs with NodeNext and Bundler resolution. With the required Motion peer installed, it checks root imports/declarations and builds disabled and animated line/area consumers using the same exports; it also proves the removed `/motion` path cannot resolve. These line and area fixtures contain only public package imports and host data/extensions; no example implementation is copied into the proof. Migrated area and bar host recipes are typechecked separately. It also builds a plain-CSS production consumer for the browser checks, verifying CSS delivery and application overrides. Peer installation can require npm registry access; the package under test always comes from the local tarball, never a workspace link or registry copy.

## Area ownership and API

`AreaChart` and `AreaSeries` use the same Root, Legend and Tooltip exports as lines. Recharts owns area geometry, native interpolation (`monotone`, `linear`, `stepAfter`), baseline (`baseValue`), stacking (`stackId`) and normalization (`stackOffset="expand"`). Kind owns registered metadata, Root-controlled visibility, bounded pointer/keyboard tooltip placement, and Motion reveal/default active marks. Hosts own labels, axes, data, formatting, gradients and reference thresholds.

`AreaChart` accepts native Recharts AreaChart props, SVG ref, caller handlers and `animate={false | true | AreaAnimation}`. AreaAnimation has the same fields and defaults as LineAnimation. Data, size, controlled visibility and native `hide` changes discard stale pointer coordinates, cancel entrance and snap owned hover motion. Reduced-motion preference changes disable owned animation. Custom marks/content remain mounted when animation changes.

`AreaSeries<DataPoint, Value>` accepts native Area props and children except `isAnimationActive`; Recharts animation is always disabled. String data keys identify Root metadata automatically. Use `seriesKey` for numeric/function keys; it is required for controlled visibility. Native `hide={true}` and Root visibility both apply. Stroke and fill default to Root color; explicit native overrides win. Custom `dot`, `activeDot`, `shape`, handlers and nested LabelList retain native composition. Recharts Area has no public component ref; place refs on host marks or shapes.

```tsx
<Chart.Root config={{ visits: { label: "Visits", color: "#3659b8" } }}>
  <Chart.AreaChart width={400} height={220} data={points} animate={true} accessibilityLayer aria-label="Visits">
    <XAxis dataKey="day" />
    <Chart.AreaSeries dataKey="visits" type="monotone" connectNulls={false} fillOpacity={0.2} />
    <Chart.Tooltip />
  </Chart.AreaChart>
</Chart.Root>
```

Missing/null values remain gaps by default; numeric zero remains data. Hosts may explicitly choose `connectNulls`. The eight migrated area recipes are host compositions of these exports. Stacked/percent recipe examples use complete nonnegative inputs; percent axis labels and tooltip formatting belong to the host, use visible payload totals, and show “No share” for an all-zero row. The package does not impute, validate or mutate stack data.

Implementation references: [Recharts AreaChart](https://recharts.github.io/en-US/api/AreaChart/), [Recharts Area](https://recharts.github.io/en-US/api/Area/) and [Motion values](https://motion.dev/docs/react-motion-value).

### Area materials

`AreaSeries.material` accepts `"plain"` (default), `"paper"`, `"clay"`, and `"glow"`, independently of color and `AreaChart.animate`. `AreaMaterial` exports that union. Paper adds fibers, Clay adds broad, rounded-looking inset relief with directional highlights and soft opposing shadows, and Glow adds a colored halo with a light rim. The native Recharts area shape still owns interpolation, gaps, stacked/range baselines, stroke and fill paths. No displacement changes data geometry.

```tsx
<Chart.AreaChart data={data} animate={false}>
  <Chart.AreaSeries dataKey="value" material="clay" fill="#db7093" fillOpacity={0.65} />
</Chart.AreaChart>
```

Explicit `shape` or `filter` takes precedence over the material; consumer gradients, fill opacity, stroke widths and handlers remain intact. Low fill opacity also softens the finish. Filter IDs are unique per mounted series, independent of consumer IDs. Area filters use geometry bounds including baselines and remain inside the engine/chart clipping and Motion reveal. Materials are static SVG filters and add no animation. Use `--kind-ui-area-paper-fiber`, `--kind-ui-area-paper-grain`, `--kind-ui-area-clay-light`, `--kind-ui-area-clay-shade`, `--kind-ui-area-clay-highlight` (default `0.9`), `--kind-ui-area-clay-shadow` (default `0.65`), `--kind-ui-area-glow-light`, and `--kind-ui-area-glow-opacity` on the chart root to tune the finish. No new dependencies or release/version change; the package remains private at `0.0.0`.

## Bar ownership and API

`BarChart` and `BarSeries` are maintained package components, imported from the same public entry point as `LineChart`. Kind owns metadata colors, controlled series visibility, pointer/keyboard modality, bounded tooltip placement and optional Motion. Recharts owns bar geometry, grouping/stacking, axes, labels, selection and keyboard traversal. The consumer owns data, ordering, domains, chart orientation, accessible names and a text/table alternative.

```tsx
import { Root, BarChart, BarSeries, Tooltip } from "@kind-ui/charts";
import { XAxis, YAxis, LabelList } from "recharts";
import "@kind-ui/charts/styles.css";

<Root config={{ count: { label: "Tasks", color: "#3659b8" } }}>
  <BarChart width={480} height={240} data={[{ day: "Mon", count: 8 }, { day: "Tue", count: -3 }]} animate={{ revealDurationMs: 800 }} aria-label="Tasks by day">
    <XAxis dataKey="day" />
    <YAxis />
    <BarSeries dataKey="count" radius={3}>
      <LabelList dataKey="count" position="top" />
    </BarSeries>
    <Tooltip />
  </BarChart>
</Root>
```

- `BarChartProps` retains native Recharts chart props and the SVG ref, including `layout`, `barGap`, `barCategoryGap`, `barSize` and `stackOffset`. Use `layout="horizontal"` for vertical bars, or `layout="vertical"` with a numeric X axis and category Y axis for horizontal bars. Native chart mouse handlers run alongside Kind's tracking.
- `BarSeriesProps` retains native Bar props, children, cells, shapes, active bars, backgrounds, label/error-bar composition and handlers. It excludes `isAnimationActive`; Motion owns animation and the engine tween is always disabled. `fill` defaults to the Root color, with explicit fill and Cell overrides retaining native semantics. String data keys supply the metadata identity; set `seriesKey` for controlled numeric/function keys. Root visibility and native `hide` combine exactly as on `LineSeries`. Recharts Bar has no public component ref in the tested version; refs belong on custom shape nodes.
- Group bars by composing series; stack them with matching native axis IDs and `stackId`. Use `stackOffset="sign"` for separate positive/negative stacks, and native `LabelList`, `Cell`, `Rectangle`, `ReferenceLine` and `activeBar` for labels, category colors, highlights and signed baselines. The public API does not impose category/value field names or coerce null/zero values. Default tooltip content shows null as missing alongside available series, retains zero and signed values, and suppresses entirely missing categories.

`BarChart animate` accepts `false` (default), `true`, or `BarAnimation` with the same `revealDurationMs`, `revealEasing` and `hoverTransition` options as line. Each series opens a plot clip outward from the engine's zero coordinate (or nearest domain edge when zero is excluded) on its own numeric axis ID; negative values and both orientations retain their geometry. Grouped and stacked series share chart timing. A scale without a finite zero coordinate renders immediately. Ranged bars retain native geometry; their reveal also opens from numeric zero. Custom labels outside the plot appear fully when reveal completes.

Pointer/focus interaction, data/size/domain/orientation changes and native or controlled visibility changes finish entrance motion and discard stale pointer coordinates. Completed/interrupted reveals do not restart on data updates or palette changes. Tooltip springs retarget through the existing shared implementation and settle immediately when `animate={false}` or reduced motion applies. Neither animation nor geometry invalidation remounts custom tooltip content. Mount a new chart to replay entrance motion. Import the default stylesheet; per-series dynamic clip variables account for Recharts' portal-rendered marks without wrapping or replacing custom shapes. No new dependency, gallery, publication or registry work is included.

The existing [ten bar compositions](../../examples/chart/BARS.md) exercise vertical, horizontal, grouped, stacked, labels, custom labels, category colors, highlight, signed and interactive use. The isolated packed consumer copies only host data/composition fixtures, checks public imports and strict NodeNext/Bundler declarations, builds production output and runs Chromium contracts against the tarball. These checks do not establish screen-reader conformance.

## Bar materials

`BarSeries material="plain" | "paper" | "clay" | "glow"` applies a static SVG finish independently of fill and `BarChart animate`. The exported `BarMaterial` type uses the same vocabulary as lines. Plain remains the default. Paper adds a lightly textured fill with an uneven inset pencil contour; it never displaces or blurs the data boundary. Clay adds prominent soft inset shade, directional light and specular rim relief while retaining native paint alpha. Glow adds a painted halo and light rim. Native rectangles retain signed geometry, radii, per-cell colors, gradients and handlers. A native `shape`, custom `activeBar`, series `filter`, or individual `Cell filter` retains consumer ownership. The highlighted recipe deliberately retains its custom shape.

Corner geometry remains native: use `radius={8}` for soft standalone bars. The existing recipes select that larger radius for Clay. For complete stacks, compose native `<BarStack radius={8}>` around `<BarSeries radius={0}>` segments: the engine rounds the outer envelope, including exposed caps when an end segment is zero, while internal joins remain square. Kind does not infer stack caps or override an explicit radius. Automatic series rounding could create gaps in inherited native BarStack contexts, whose stack IDs are not available through the public Recharts hooks. The radius remains consumer-owned so arbitrary stack composition stays truthful.

Each series owns a unique filter that native rectangles apply independently within bounded object-relative regions. Recharts plot/stack clipping and Kind reveal clipping remain in place, so halos at plot edges can be clipped. There is no displacement, animated noise or fabricated bar. Tiny bars show less relief and can clip the outer glow. Extreme stroke widths may need a custom filter with host bounds. Filters add raster work per rectangle; dense data can be more expensive than plain bars. The existing `/bars.html` recipes provide independent Material, Palette and Motion controls.

Bar finish tokens are `--kind-ui-bar-paper-fiber` (white), `--kind-ui-bar-paper-grain` (0.14), `--kind-ui-bar-clay-light` (white), `--kind-ui-bar-clay-shade` (#17212b), `--kind-ui-bar-clay-highlight` (0.8), `--kind-ui-bar-clay-shadow` (0.55), `--kind-ui-bar-glow-light` (white), and `--kind-ui-bar-glow-opacity` (0.6). Opacity tokens accept numbers from 0 to 1. Clay/Paper lighting and ink are composited atop native paint, preserving translucent alpha. Native shapes retain engine zero-label and background filtering. Clay and Paper primitives are bar-local; Glow reuses the coordinated filled-surface helper. Line and area outputs remain unchanged. Validation covers Chromium; other browsers and print/export renderers remain unverified.

## Pie and donut

`PieChart`, `PieSeries`, `PieChartProps`, `PieSeriesProps` and `PieAnimation` are maintained public exports. A donut is a `PieSeries` with native `innerRadius`; it uses the same component and animation contract. No additional dependency or material API is introduced.

```tsx
const itemKey: NonNullable<Chart.TooltipProps["itemKey"]> = entry => String(entry.payload.id);
<Chart.Root config={categoryConfig} visibleSeries={visibleIds} onVisibleSeriesChange={setVisibleIds}>
  <Chart.PieChart width={400} height={300} animate={false}>
    <Chart.PieSeries data={rows.filter(row => visibleIds.includes(row.id))}
      dataKey="value" nameKey="id" innerRadius="50%" outerRadius="80%">
      {rows.filter(row => visibleIds.includes(row.id)).map(row =>
        <Cell key={row.id} fill={`var(--color-${row.id})`} />)}
      <Label position="center" value="Capacity" />
    </Chart.PieSeries>
    <Chart.Tooltip itemKey={itemKey} />
  </Chart.PieChart>
  <Chart.Legend />
</Chart.Root>
```

Import `Cell` and `Label` from Recharts. Metadata keys identify **categories**, independently of the shared numeric `dataKey`. `TooltipProps.itemKey` and `TooltipContentProps.itemKey` optionally resolve the native payload entry to the containing Root's metadata/visibility key. The default remains registered series ID, then `dataKey`, then `name`. The bounded Tooltip applies the resolver before visibility filtering and passes it to default content. Custom content receives the filtered native payload and retains its own rendering and formatting; pass the same resolver when composing `TooltipContent` yourself.

Category visibility and Cells are consumer-owned: filter data and generate Cells from that same array so index alignment survives filtering and reordering. Root/Legend never change polar data or silently recompute shares. `PieSeries` defaults to a continuous allocation: native padding/corner defaults remain zero, and its default stroke is `none`. Explicit series/Cell strokes, padding angles and corner radii remain consumer customizations. `PieSeries.hide` hides the whole native Pie independently of category state. Multiple native Pies, native Tooltip selection/`defaultIndex`/`trigger`, `nameKey`, function/numeric `dataKey`, numeric/percentage/function radii, angles, padding, corner radius, labels, custom shapes, Cells, SVG attributes and sector handlers remain available. Chart SVG refs retain the native ref contract. Recharts does not expose a Pie component ref.

`animate={false | true | config}` uses the established duration/easing/tooltip hover transition shape. Recharts animation is disabled in `PieSeries`; Motion grows each default sector from its own start angle within its native angular footprint on entrance. Labels remain at their final native positions. Custom `shape`, `activeShape` and `inactiveShape` retain ownership; Kind does not animate those custom marks. Motion stops and snaps to final geometry on pointer/keyboard interaction, data/visibility/geometry changes, resize or disabling animation. Reduced motion renders final geometry and bounded tooltip placement without motion. Entrance does not replay after an interruption; remount the chart for an intentional new entrance.

Use nonnegative, finite values for meaningful proportional data. Kind preserves native values rather than inventing allocations: empty/all-zero inputs paint no allocation, and zero/missing categories remain distinguishable in the consumer-owned table. A zero category has no visible angular area; expose it in the legend/data alternative rather than imposing a minimum fake share. Provide readable labels and a table/list; SVG plus tooltip alone is not a complete data alternative. [Recharts Pie API](https://recharts.github.io/en-US/api/Pie/) and the pinned `recharts@3.10.1` source (`polar/Pie.js`, `shape/Sector.d.ts`) informed the payload, Cell and polar geometry integration. Motion cancellation uses [animation playback controls](https://motion.dev/docs/animate).

`examples/chart/pies.html` contains two bounded recipes: a pie allocation and a donut capacity summary. Both consume these public APIs and share existing tooltip/legend/formatting/accessibility behavior. The isolated tarball host in `tests/fixtures/pie` is separate from the recipes and is checked with strict NodeNext/Bundler declarations, a production build and browser contracts.

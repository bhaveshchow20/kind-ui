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

- `SeriesConfig`: a record keyed by a string `dataKey`. Each entry has a string `label`, CSS `color`, optional `formatValue(value)` returning React content, and optional decorative `icon: ComponentType`. Built-in legend and tooltip content render that component inside an aria-hidden wrapper; keep visible string labels meaningful. Keys start with a letter and contain letters, numbers, underscores, or hyphens. No data normalization or scales are introduced.
- `Root`: scopes config and `--color-{key}` CSS variables. It forwards native div props/ref. The default stylesheet provides full width with `min-width: 0`. Set chart height explicitly through the underlying chart or `ResponsiveContainer`. Nested or adjacent containers keep separate metadata and colors.
- `visibleSeries` is optional and consumer-owned. A callback requires this value; the legend requests the next array but never changes it itself. `LineSeries` applies this visibility automatically; keep native engine marks' `hide` props in sync when using them directly. Omit the callback for a static legend. An empty array means all series are hidden; the example owns that empty-state message.
- `Legend`: renders a native list; with a callback, it renders native toggle buttons with `aria-pressed`. It forwards ul props/ref. Space/Enter work through normal button behavior; focus stays on the button. Style its root with `className`/`style`, or set `--chart-legend-background` on buttons. Configured icons replace swatches by default; `hideIcon` restores color swatches. Optional `children={({ key, label, visible, marker }) => ...}` composes each item's content inside the existing list item and button/static span. Include meaningful label text; return noninteractive content only (no buttons, links, inputs, tab stops or click handlers). Kind retains the controlled toggle and keyboard ownership. Use a separate host legend when you need different interaction semantics.
- `TooltipContent`: pass the upstream callback's props as `tooltip`. Native div props/ref, classes, and style remain separate and are forwarded. Upstream `formatter`, per-entry formatter, and `labelFormatter` work; per-entry formatters take precedence over the upstream formatter, which takes precedence over the config formatter. An upstream formatter returning null/undefined suppresses that entry. Formatters run for zero but not null/undefined; those display `missingValue` (default “No data”) alongside other available values. Inactive, empty, or entirely missing visible payloads render no tooltip; zero remains valid data. `hideLabel` omits the heading and its formatter, retaining series names/values and the live region. `indicator="dot" | "line" | "dashed"` changes the color marker; the default remains the existing slim `line`. Configured icons take precedence over marker choices; `hideIndicator` hides all decorative tooltip markers, including icons. These are content props: pass them to `TooltipContent` through the native `content` callback. Custom content keeps native formatter/content ownership and receives no injected presentation options.
- `Tooltip` and `TooltipContent` accept optional `itemKey(entry)` to resolve metadata/visibility identity before registered series keys or native dataKey/name. Pass the same resolver to both when composing content for categories such as pie slices. Keep category IDs stable; `labelFormatter` owns heading presentation independently. This avoids adding a second nameKey/labelKey identity convention.
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

Stable `data-kind-ui` hooks are `chart`, `chart-legend`, `chart-legend-item`, `chart-legend-button`, `chart-indicator`, `chart-tooltip`, `chart-tooltip-label`, `chart-tooltip-list`, `chart-tooltip-item` and `chart-tooltip-value`. Decorative configured glyph wrappers expose `chart-icon`; color markers expose `data-indicator` in tooltips. Line components additionally expose `line-frame`, `tooltip-frame`, `tooltip-motion` and `active-marker`. Legend and tooltip items also expose `data-series` with their series key. Use that identity for series-specific styles instead of positional selectors; tooltip entries may be reordered or hidden. Interactive legend buttons retain `aria-pressed` for state styling. For example:

```css
.my-chart [data-series="tasks"] [data-kind-ui="chart-indicator"] {
  border-radius: 50%;
}
```

Per-instance series colors and per-entry indicator color values remain inline CSS variables. They are data-dependent, not theme defaults. Chart dimensions, axes and other engine geometry stay application-owned.

## Develop

At the repository root: `npm ci`, then `npm exec playwright install -- --with-deps chromium` (Linux dependencies may need administrator permission). Run `npm run dev:chart` for the example, or `npm run check` for library, packed-consumer, type and browser checks.

The pack lifecycle rebuilds from clean output and rejects missing runtime modules, declarations, CSS or documentation. Recipe links below use the verified pre-release source snapshot so they remain available outside the repository. The packed check creates an actual tarball, installs it and the pinned peer/type dependencies into an isolated consumer, then checks public APIs with NodeNext and Bundler resolution. With the required Motion peer installed, it checks root imports/declarations and builds disabled and animated line/area consumers using the same exports; it also proves the removed `/motion` path cannot resolve. The bar consumer and a combined area/bar consumer use the same tarball and strict resolution checks. The combined browser proof checks native geometry, unique material filter IDs and independent visibility when both families share a page. These fixtures contain only public package imports and host data/extensions; no example implementation is copied into the proof. Migrated area and bar host recipes are typechecked separately. It also builds a plain-CSS production consumer for the browser checks, verifying CSS delivery and application overrides. Peer installation can require npm registry access; the package under test always comes from the local tarball, never a workspace link or registry copy.

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

`AreaSeries.material` accepts `"plain"` (default), `"paper"`, `"clay"`, and `"glow"`, independently of color and `AreaChart.animate`. `AreaMaterial` exports that union. Paper adds fibers, Clay adds broad soft convex matte relief with upper-left light, gradual lower-right shading and a small external cast shadow, and Glow adds a colored halo with a light rim. The native Recharts area shape still owns interpolation, gaps, stacked/range baselines, stroke and fill paths. No displacement changes data geometry.

```tsx
<Chart.AreaChart data={data} animate={false}>
  <Chart.AreaSeries dataKey="value" material="clay" fill="#db7093" fillOpacity={0.65} />
</Chart.AreaChart>
```

Explicit `shape` or `filter` takes precedence over the material; consumer gradients, fill opacity, stroke widths and handlers remain intact. Low fill opacity also softens the finish. Filter IDs are unique per mounted series, independent of consumer IDs. Area filters use geometry bounds including baselines and remain inside the engine/chart clipping and Motion reveal. Materials are static SVG filters and add no animation. Use `--kind-ui-area-paper-fiber`, `--kind-ui-area-paper-grain`, `--kind-ui-area-clay-light`, `--kind-ui-area-clay-shade`, `--kind-ui-area-clay-highlight` (default `0.48`), `--kind-ui-area-clay-shadow` (default `0.28`), `--kind-ui-area-clay-cast` (default `0.12`), `--kind-ui-area-glow-light`, and `--kind-ui-area-glow-opacity` on the chart root to tune the finish. No new dependencies or release/version change; the package remains private at `0.0.0`.

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

The existing [ten bar compositions](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/BARS.md) exercise vertical, horizontal, grouped, stacked, labels, custom labels, category colors, highlight, signed and interactive use. The isolated packed consumer copies only host data/composition fixtures, checks public imports and strict NodeNext/Bundler declarations, builds production output and runs Chromium contracts against the tarball. These checks do not establish screen-reader conformance.

## Bar materials

`BarSeries material="plain" | "paper" | "clay" | "glow"` applies a static SVG finish independently of fill and `BarChart animate`. The exported `BarMaterial` type uses the same vocabulary as lines. Plain remains the default. Paper adds a lightly textured fill with an uneven inset pencil contour; it never displaces or blurs the data boundary. Clay adds matte convex volume through broad upper-left light, diffuse lower-right shade, a quiet static microtexture and a gentle exterior cast shadow. Cast shade follows the category axis, avoiding added value length and heavy shadows between stack segments. It retains native paint alpha and has no sharp specular rim. Glow adds a painted halo and light rim. Native rectangles retain signed geometry, radii, per-cell colors, gradients and handlers. A native `shape`, custom `activeBar`, series `filter`, or individual `Cell filter` retains consumer ownership. The highlighted recipe deliberately retains its custom shape.

Corner geometry remains native: use `radius={8}` for soft standalone bars. The existing recipes select that larger radius for Clay. For complete stacks, compose native `<BarStack radius={8}>` around `<BarSeries radius={0}>` segments: the engine rounds the outer envelope, including exposed caps when an end segment is zero, while internal joins remain square. Kind does not infer stack caps or override an explicit radius. Automatic series rounding could create gaps in inherited native BarStack contexts, whose stack IDs are not available through the public Recharts hooks. The radius remains consumer-owned so arbitrary stack composition stays truthful.

Each series owns a unique filter that native rectangles apply independently within bounded object-relative regions. Recharts plot/stack clipping and Kind reveal clipping remain in place, so halos at plot edges can be clipped. There is no displacement, animated noise or fabricated bar. Tiny bars show less relief and can clip the outer glow. Extreme stroke widths may need a custom filter with host bounds. Filters add raster work per rectangle; dense data can be more expensive than plain bars. The existing `/bars.html` recipes provide independent Material, Palette and Motion controls.

Bar finish tokens are `--kind-ui-bar-paper-fiber` (white), `--kind-ui-bar-paper-grain` (0.14), `--kind-ui-bar-clay-light` (white), `--kind-ui-bar-clay-shade` (#17212b), `--kind-ui-bar-clay-highlight` (0.48), `--kind-ui-bar-clay-shadow` (0.26), `--kind-ui-bar-glow-light` (white), and `--kind-ui-bar-glow-opacity` (0.6). Opacity tokens accept numbers from 0 to 1. Clay/Paper lighting and ink are composited atop native paint, preserving every painted pixel’s translucent alpha, including antialiasing. Clay’s decorative cast shadow is excluded from that footprint; only fully transparent exterior pixels acquire shade, derived from native alpha at a fixed 0.16 opacity. This shadow does not change the native data path, radius or stack clip, and native clipping can trim it. Lighting uses a silhouette so translucent fills retain the same matte relief. Pixel-sized light/blur offsets are capped for chart marks; tiny bars can show less relief. The raised direction follows shipped line Clay, with [clay.css](https://github.com/codeAdrian/clay.css) and [Malewicz’s Claymorphism tutorial](https://hype4.academy/articles/design/claymorphism-in-user-interfaces) as soft-volume references, adapted without copying assets or adding dependencies. Native shapes retain engine zero-label and background filtering. Clay and Paper primitives are bar-local; Glow reuses the coordinated filled-surface helper. Bar material rendering leaves line and area outputs unchanged. Validation covers Chromium; other browsers and print/export renderers remain unverified.

## Scatter and bubble charts

`ScatterChart`, `ScatterSeries`, `ScatterTooltip`, and `ScatterTooltipContent` are public exports with colocated prop types; `ScatterAnimation` shares the familiar `revealDurationMs`, `revealEasing`, and `hoverTransition` options. `ScatterChart` accepts native Recharts ScatterChart props and refs plus `animate={false | true | config}`. `ScatterSeries` accepts native Scatter composition (Cells, labels, custom/active shapes, native handlers, axis IDs, lines and fits), except `isAnimationActive`: Kind owns animation. Set `seriesKey` for controlled visibility because numeric axis keys describe dimensions, not series. Explicit native `hide` remains authoritative.

```tsx
import { Root, Legend, ScatterChart, ScatterSeries, ScatterTooltip } from "@kind-ui/charts";
import { CartesianGrid, XAxis, YAxis, ZAxis } from "recharts";

<Root config={{ tasks: { label: "Tasks", color: "#7c5ce7" } }}>
  <Legend />
  <ScatterChart responsive style={{ width: "100%", height: 320 }} animate={false}>
    <CartesianGrid />
    <XAxis type="number" dataKey="latency" name="Latency" unit=" ms" domain={[0, 100]} />
    <YAxis type="number" dataKey="acceptance" name="Acceptance" unit="%" domain={[0, 100]} />
    <ZAxis dataKey="requests" name="Requests" unit="k" domain={[0, 300]} range={[35, 1200]} />
    <ScatterSeries seriesKey="tasks" data={observations} />
    <ScatterTooltip zDimension={{ dataKey: "requests", name: "Requests", unit: "k" }} pointLabel={(record) =>
      record && typeof record === "object" && "id" in record ? String(record.id) : "Task"
    } />
  </ScatterChart>
</Root>
```

`ScatterSeries material="plain" | "paper" | "clay" | "glow"` (exported `ScatterMaterial`) is independent of consumer color and Motion. Plain is the default. Paper uses deterministic inset pencil contours and subtle grain without displacing the path. Clay uses upper-left diffuse light and lower-right shade for convex matte relief, entirely inside the native silhouette. Glow uses a gentle luminous tint, inset light rim and soft exterior halo; the halo is decorative light, **not quantitative bubble area**. Native symbol paths, transforms, Z sizes and paint alpha remain exact. Glow light uses a separate noninteractive `use` and native-symbol geometry exclusion mask with an exterior guard covering declared stroke extents plus 1px for antialiased edges to keep fully transparent gradient regions and stroke-only interiors transparent. Geometry paths inside SVG definitions are decoration machinery, not additional data marks. Body finishes compose atop the original paint, including translucent gradients and invisible paint. Labels and native connecting lines are never filtered.

Materials apply to default/string symbols, including native boolean default-shape options and `Cell` paint/geometry overrides. Custom function/element/object shapes retain their own finish; custom active shapes retain ownership independently. Explicit `filter` or `style.filter` on a series or Cell opts that symbol out, even `none`. Every finish also retains unchanged native rendering for explicit point `clipPath` or `style.clipPath`, including `none`: filtering can rerasterize antialiased clip edges, and separate Glow light cannot safely inherit arbitrary native-local or object-bounding-box clip coordinates. This declared clipping fallback preserves native alpha and is tested for both coordinate systems and both prop/style ownership; ancestor plot clipping still applies to every finish. Refs and native handlers are forwarded. Each rendered symbol owns a unique filter ID, including duplicate consumer series IDs and active portals.

Effects scale with the square root of native area, with upper bounds (pencil rim 0.9px, Clay offset 3px/blur 2px, Glow blur 1.8px), **no minimum radius or size substitution**. Subpixel marks retain exact geometry and alpha but cannot show a full grain/relief pattern; the small-scale effect becomes tonal and may be indistinguishable below raster resolution. Nonpositive/unresolved sizes render through native Symbols without a finish. A declared nonnumeric stroke width or a stroke extent exceeding the square root of native area also uses unchanged native rendering instead of cropping paint; stroke-aware exclusion can suppress a small Glow halo while retaining its luminous body. This bounded fallback is covered with a 12px transparent gradient stroke, including `style.strokeWidth`. Glow's filter region is limited to three times each native symbol's bounding box and keeps native plot clipping, so extreme consumer strokes, registered custom symbol factories or boundary marks may crop decorative light. This is a bounded SVG finish for the seven built-in symbols, not an arbitrary custom-renderer guarantee.

Native Recharts owns numeric axes, ZAxis area mapping and per-point selection. Use `ScatterTooltip` instead of the category-oriented default `TooltipContent`: its default content displays the actual selected record's dimension values, names and units; a point label comes from the supplied callback or configured series title. Optional metadata for a dimension's string dataKey uses the same `Root.config` `label`/`formatValue` contract; native `entry.formatter`/tooltip `formatter` takes precedence. `Legend` shows all config entries, so use native axis names/units or a tooltip formatter when dimension entries should not appear in the legend. Custom `content`, `frameProps`, frame refs, bounded positioning and shared Motion are retained. Use `<ScatterTooltipContent tooltip={nativeContentProps} />` to compose the default UI inside your own native content.

No missing/zero/negative values are coerced or deduplicated by Kind. Default native symbols omit unresolvable x/y coordinates; custom shapes receive native nullable geometry and must guard it themselves. Recharts 3.10.1 uses the minimum Z range and omits the Z tooltip entry for both zero and missing z; default content displays only the native entries and does not invent a z value. Supply `zDimension={{ dataKey: "requests", name: "Requests", unit: "k" }}` to recover zero or missing size in maintained default content from the actual point record. `ScatterSizeDimension<Row>` also accepts a typed `(record: Row) => number | null | undefined` accessor without casts; reuse the accessor used by your ZAxis. String keys read own top-level properties only; use a function for nested paths. When native Recharts supplies a nonzero Z entry it remains intact, with its native formatter/name/unit. Mapping name/unit supplies the omitted entry, existing tooltip/series formatter and dimension config formatting apply, and missing entries use `missingValue` (default “No data”). No field is guessed when mapping is omitted. A table remains appropriate for all observations. Negative z is passed to the native scale; validate count domains in the host. Duplicate coordinates overlap but keep distinct record payloads/indexes. Custom Cells may override native geometry, exactly as with Recharts Scatter.

Motion fades native marks without moving their coordinates; native geometry animation is disabled to avoid two animation engines. Shared tooltip positioning can animate. Reduced motion renders final client geometry with Motion off. With the pinned Recharts 3.10.1, server rendering a fixed-size Scatter chart produces an empty chart wrapper, without SVG axes or point marks; geometry appears after client mount. Keep a host-owned table or summary available in the server HTML. Motion starts off during SSR; this is not an SSR geometry or hydration support guarantee. On the client, interaction, x/y geometry, data/visibility changes and resize settle entrance, and stale pointer placement is discarded on geometry changes. Off/config switches preserve consumer content and handlers. Entrance does not replay after interaction. Consumers own input validation, data tables, errors/loading states and immutable data updates.

For custom X axis IDs, set the matching native `ScatterTooltip axisId` so Recharts can resolve keyboard navigation. Native keyboard navigation visits points in the first registered series, in data order. Hover can select any series; arrows do not perform spatial or all-series navigation. Provide a keyboard-accessible data alternative for every series, especially overlapping points and missing measurements. Browser coverage is Chromium at the pinned peer versions; it is not a screen-reader/browser conformance claim or a large-dataset performance promise. See the [four bounded recipes](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/SCATTERS.md) and the isolated tarball consumer/browser proof in `tests/fixtures/scatter` and `tests/packed-scatter.spec.ts`.

This adds a pre-release public API at private version `0.0.0`; no dependency, publication or release change is made. The internal frame reuses the approved standalone generic `engine + chartProps` seam shared by polar and Combo charts.

## Combo / Composed charts

`ComboChart`, `ComboChartProps`, and `ComboAnimation` are public root exports.
`ComboChart` uses Recharts `ComposedChart` and accepts its native props, SVG ref,
handlers, axes, margins, layout, stacks, and children. Compose the existing
`LineSeries`, `AreaSeries`, and `BarSeries` under one `Root`; one `Tooltip` shows
all registered visible series at the selected category. `Legend` uses the same
consumer-owned `visibleSeries` and `onVisibleSeriesChange` contract.

```tsx
<Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
  <Legend />
  <ResponsiveContainer width="100%" height={260}>
  <ComboChart data={data}
    animate={{ lineReveal: { revealDurationMs: 700 }, areaReveal: false,
      barReveal: { revealDurationMs: 900 } }}>
    <XAxis dataKey="period" />
    <YAxis yAxisId="count" />
    <YAxis yAxisId="ms" orientation="right" />
    <AreaSeries dataKey="queued" yAxisId="count" fillOpacity={0.2} />
    <BarSeries dataKey="completed" yAxisId="count" />
    <LineSeries dataKey="latency" yAxisId="ms" dot={false} />
    <Tooltip />
  </ComboChart>
  </ResponsiveContainer>
</Root>
```

`animate` defaults to `false`; `true` uses the existing family defaults. An
object accepts the same `revealDurationMs`, `revealEasing`, and shared
`hoverTransition` as `LineChart`. Optional `lineReveal`, `areaReveal`, and
`barReveal` override entrance timing/easing for each family; `false` disables
that family's entrance. Hover/line visibility Motion remains shared, rather
than separately controlled by these entrance options. Reduced motion disables
all Kind Motion, including when the preference changes after mounting.

Use Recharts `ResponsiveContainer` to mount at measured dimensions, as the
recipes do. Native `responsive` sizing is accepted; a percentage placeholder
followed by its first measured size can finish an entrance through the normal
resize cancellation path.

Line/area entrances sweep across the plot. Bars reuse `BarSeries`' own
axis-specific, clamped zero baseline reveal for positive, negative and signed
stacks. One interaction cancellation path finishes all active entrances when
pointer/focus/keyboard input, visibility, data, geometry, bar layout, or native
children change. A changed children identity conservatively finishes entrances,
even if the parent merely rerendered; updates render immediately rather than
replaying an entrance. Family completion removes only that family's clip.

Colors remain independently supplied by `Root.config` or native series props.
Native Recharts children, custom marks, cells, labels, filters and event handlers
retain their ownership. Native marks do not register with Kind visibility or
metadata; use the maintained series for the shared legend/tooltip contract.
Native child animation props remain consumer-owned; managed series disable
Recharts' competing animation as in their standalone families.

Stack only compatible units on the same axes. Recharts owns stack semantics;
use `stackOffset="sign"` for signed bar stacks. Separate axis IDs preserve
unrelated units. `null` stays missing and `0` stays zero; `connectNulls` retains
its native meaning. Native ComposedChart offers axis selection, not item-only
bar selection. Supply a data table or equivalent text alternative.

See [Combo recipes](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/COMBOS.md) for two axes, signed stacks,
missing values, custom markers, independent legends and entrance controls.

## Pie and donut

`PieChart`, `PieSeries`, `PieChartProps`, `PieSeriesProps` and `PieAnimation` are maintained public exports. A donut is a `PieSeries` with native `innerRadius`; it uses the same component and animation contract. No additional dependency is introduced.

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

### Pie and donut finishes

`PieSeries` accepts `material="plain" | "paper" | "clay" | "glow"` (`PieMaterial`),
independently of native fill/Cells and the chart’s `animate` prop. Plain is the default.
Paper adds faint fibers and an uneven inset pencil contour; Clay gives soft convex
matte relief; Glow emits a soft colored halo around the crisp native sector. All finishes preserve native
angles, radii, path, paint alpha, continuous zero-padding/no-stroke defaults and labels.
Donuts use the same prop with native `innerRadius`.

Custom shapes (including active/inactive shapes) remain consumer-owned. Explicit
sector `filter` or `style.filter`, including Cell overrides, bypasses the built-in
finish on that sector. Native gradients, clipping, IDs and handlers remain available.
Paper/Clay remain inset. Glow’s decorative halo can overlap adjacent sectors/rings;
it does not change quantitative geometry or native body alpha. No finish displaces paths.
Per-sector filter/mask/source IDs are instance-scoped. Native paint masks retain
Paper/Clay alpha at curved edges; Glow keeps the native body separate from its
decorative halo. The halo follows the painted footprint, including gradient fades. Switching finishes during entrance snaps
to final geometry using the existing interruption contract.

Optional CSS variables: `--kind-ui-pie-clay-light`, `--kind-ui-pie-clay-highlight`,
`--kind-ui-pie-clay-shade`, `--kind-ui-pie-clay-shadow`, `--kind-ui-pie-paper-fiber`,
`--kind-ui-pie-paper-grain`, `--kind-ui-pie-paper-ink`,
and `--kind-ui-pie-glow-opacity`. Lighting adapts locally to native radius and ring
thickness. The pie/donut recipes expose the material control and keep category totals
and selection consumer-controlled.

## Radar and radial bars

`RadarChart` / `RadarSeries` and `RadialBarChart` / `RadialBarSeries` are maintained public exports. Their generic chart `*Props<DataPoint>` and series `*Props<DataPoint, Value>` types retain native typed data keys. The charts accept their native polar chart props and SVG refs, including `layout="centric" | "radial"`, centers, radii, angles, synchronization and event handlers. The series accept native shapes, dots/active marks, Cells, backgrounds, labels, axis IDs, stack IDs, z-order and handlers. Recharts 3.10.1 exposes no series component ref; place refs on custom SVG marks. Recharts owns polar geometry and native category payloads.

```tsx
import * as Chart from "@kind-ui/charts";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis } from "recharts";
import "@kind-ui/charts/styles.css";

<Chart.Root config={{ score: { label: "Score", color: "#3161bd" } }}>
  <Chart.RadarChart width={420} height={300} data={dimensions} animate={false}>
    <PolarGrid />
    <PolarAngleAxis dataKey="dimension" />
    <PolarRadiusAxis domain={[0, 100]} />
    <Chart.RadarSeries dataKey="score" fillOpacity={0.2} />
    <Chart.Tooltip />
  </Chart.RadarChart>
</Chart.Root>
```

For radial progress, use `RadialBarChart` with a **numeric** `PolarAngleAxis` and an explicit domain such as `[0, 100]`, a categorical `PolarRadiusAxis dataKey="dimension"`, and `RadialBarSeries dataKey="score"`. Keep category ordering and any category filtering in your data. `Cell` styling and native category payloads remain intact. Kind's controlled `visibleSeries` and legend identify **series**, through string `dataKey` or explicit `seriesKey` for function/numeric keys. `hide={true}` additionally hides a series; `hide={false}` cannot override Root visibility. A controlled non-string key without `seriesKey` throws an actionable error. Explicit fill/stroke overrides Root color defaults.

Both charts accept `animate={false | true | config}` using `RadarAnimation` / `RadialBarAnimation` (the existing `revealDurationMs`, `revealEasing`, `hoverTransition` contract). Motion fades each native series from 0 to 1 over 1000ms by default; it does not interpolate polar coordinates or category indices. This preserves quantitative geometry and consumer shapes. Shared tooltip motion and the default radar active marker use the existing hover transition. Native engine animation is disabled and `isAnimationActive` is excluded from series props. Animation callbacks/interpolation settings on native props remain available for compatibility but do not run while engine animation is disabled.

Off/reduced-motion modes render full geometry immediately and stop in-flight opacity/hover movement. Pointer, focus and keyboard input finish entrance. Data/visibility/size changes, native polar chart geometry props, series axis/key/group props and child composition changes also finish entrance and clear stale pointer coordinates. Native labels/backgrounds/active marks can render through independent Recharts z-index portals and are not promised to fade. Series visibility changes snap in every mode; entrance does not replay after updates or interaction. Remount the chart to request a fresh entrance. A series mounted later may enter only while the chart's entrance remains uninterrupted. Custom tooltip content, active shapes, backgrounds and native data alternatives remain consumer-owned.

The shared `Legend`, `Tooltip` and `TooltipContent` provide the same formatting, measured bounds and controlled visibility as Cartesian charts. Recharts 3.10.1 provides polar keyboard traversal with Left/Right, Enter toggling, and Escape dismissal. Give each chart an accessible name and provide a value table; native keyboard behavior is preserved rather than replaced. Empty and zero data retain native behavior.

The `/polar.html` showcase uses public APIs for comparison, outline and range radar, grouped rings, stacked arcs and a half-circle gauge. It includes explicit domains, controlled legends, Motion/data/update controls and value tables. `tests/fixtures/polar` installs the actual tarball in an isolated consumer, checks strict NodeNext/Bundler declarations and production builds, and compares browser paths against native Recharts charts.

First-party references: [Radar API](https://recharts.github.io/en-US/api/Radar/), [RadialBar API](https://recharts.github.io/en-US/api/RadialBar/), and the tested package's `types/polar` and `es6/polar` sources. No new dependencies, package boundary or publishing accompanies these exports. The package remains private at `0.0.0`.

### Radial band labels

Use native `LabelList dataKey="dimension" fill="white" content={<Chart.RadialBarLabel show={showText} />}` inside `RadialBarSeries`. `RadialBarLabel` is maintained label content, not a sector renderer. It consumes Recharts' native polar viewBox, follows the mid-radius within that sector's endpoints, reverses the path for upright reading, and checks measured glyph bounds. `fontSize` defaults to 11 numeric pixels, `minFontSize` to 9 and `padding` to 2. Thin/short/zero/invalid sectors and values that cannot fit omit or hide text. The native LabelList can inject fill; set its fill explicitly for contrast. `formatter`, SVG presentation/events and SVG text `ref`/`labelRef` (including React 19 cleanup) remain available. Layout coordinates/transform are excluded because the helper owns arc placement. Oversized CSS font overrides also fail the fit guard.

`show={false}` controls only this visual label; it does not filter series, data, tooltip payload or Root metadata. Control tooltip visibility independently with native `Tooltip active={false}`. Labels render hidden during SSR until client SVG measurement; retain a value table for an immediate data alternative. Arbitrary geometry transforms or inherited letter/word styling can change available space; measurement conservatively hides labels when their glyph bounding boxes exceed the native sector.

The [polar gallery audit](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/POLAR-GALLERY.md) maps all eighteen current first-party shadcn radar/radial variations to runnable public compositions.

## Histogram family

`HistogramChart`, `HistogramSeries`, and `binHistogram` are maintained public exports, with `HistogramBin`, `HistogramMeasure`, `HistogramBinningResult`, chart/series props and `HistogramShapeProps` types. No new dependency or package is introduced. This additive pre-release API remains private at `0.0.0`.

```tsx
import * as Chart from "@kind-ui/charts";
import { CartesianGrid } from "recharts";

const result = Chart.binHistogram([0, 1, 2, 2, null, NaN, 9], [0, 1, 3]);
<Chart.Root config={{ count: { label: "Density", color: "#167d77" } }}>
  <Chart.HistogramChart bins={result.bins} measure="density" width={480} height={260}
    xAxisProps={{ label: { value: "ms", position: "insideBottom" } }}>
    <CartesianGrid vertical={false} />
    <Chart.HistogramSeries />
    <Chart.Tooltip shared={false} labelFormatter={(_label, entries) => {
      const bin = entries[0]?.payload;
      return bin ? `[${bin.lower}, ${bin.upper}${bin.upper === 3 ? "]" : ")"} ms` : "";
    }} />
  </Chart.HistogramChart>
</Chart.Root>;
```

The helper owns raw-sample aggregation with **explicit edges**. Edges must be finite, strictly increasing, and have finite positive differences. Intervals are `[lower, upper)`, except the final upper edge is included, following [D3 bin](https://d3js.org/d3-array/bin) and [NumPy histogram](https://numpy.org/doc/stable/reference/generated/numpy.histogram.html). It returns every bin, including zero counts, plus `accepted`, `missing` (`null`/`undefined`), `nonfinite` (`NaN`/infinities), and `outOfRange` totals. It does not coerce, infer edges, round, impute, weight observations, or select a statistical binning estimator. Inputs are not mutated; work is O(samples × log(edges) + edges).

For **pre-binned data**, callers supply ordered, nonoverlapping `{ lower, upper, count }` intervals and own aggregation and interval membership. Gaps are retained as quantitative space, rather than compressed into categories. Counts must be nonnegative safe integers; bounds, widths and overall domain span must be finite. Invalid bins, overlaps, unsafe totals, and nonfinite or underflowing positive density fail with actionable errors. Empty `bins=[]` uses a neutral `[0,1]` x-domain and no marks. All-zero bins retain zero height; density is zero when total count is zero.

`measure` is always required. `count` means height = count. **With unequal widths, count-mode rectangle area does not represent frequency**; disclose that choice to readers. Prefer `density` for unequal bins: height = count / total count / bin width, so the sum of height × width is one when total is positive. Density units are the reciprocal of the input unit (e.g. ms⁻¹), rather than samples or percent. Counts remain available in the original tooltip payload and data table. No rounding is applied to bin edges or counts; native Recharts retains ownership of SVG coordinate serialization. Formatting belongs to the consumer.

The chart reuses `BarChart`/`BarSeries`, visibility metadata, `Legend`, shared `Tooltip` presentation and interrupted/reduced Motion. It owns vertical layout and linear numeric axes (ID 0), maps x/width from actual bounds, and preserves the zero baseline. Use `xAxisProps`/`yAxisProps` for axis labels, ticks, styling and padding. Native `CartesianGrid`, `ReferenceLine`, SVG definitions, `Cell`, chart refs, attributes and handlers compose as children/props. `HistogramSeries.shape` receives native `BarShapeProps` with corrected x/width and `bin`; it owns its resulting SVG and can return a native `Rectangle`. Native bar Cells and events remain available. The default shape has square corners and exact numeric boundaries. `material="plain" | "paper" | "clay" | "glow"` adds static native-bin paint, independently of color and Motion. Paper reuses bar pencil/grain primitives; Clay reuses soft convex matte relief but crops its exterior cast shadow because both histogram axes are quantitative. Glow adds an exterior decorative halo and crisp inset light; the underlying body retains native translucent alpha. No finish rounds or displaces interval boundaries. All finishes use the documented `--kind-ui-bar-*` tokens. Each painted bin has its own filter ID and exact user-space bounds; filter padding resolves native CSS stroke widths on mounting and React updates. Stylesheet-only stroke transitions without a React render remain unverified. Custom `shape`, series `filter`/`style.filter`, and per-Cell `filter`/`style.filter` retain paint ownership. Custom shape callbacks still receive corrected geometry and original bins. The material gallery is `/histograms.html?materials`; zero bins retain zero geometry and no material-created marks. Native bar labels remain excluded by the core contract; use axis labels, tooltips, tables or the custom shape extension for bin annotations.

Use `Tooltip shared={false}` for pointer hit testing against the actual bin rectangles; native shared-axis tooltip selection uses nearest midpoints. Native arrow-key selection remains available. Label the original interval and unit through `labelFormatter`, rather than presenting the midpoint as a bin boundary. A zero-height bin has no pointer target; keyboard selection and a complete table expose its value. The consumer owns the data alternative and units. The feature recipes at `/histograms.html` demonstrate raw rebinning with discard audit, unequal-bin density, native custom shapes/reference lines, controlled visibility, responsive layout and expandable tables.

For labels, use the custom shape with its corrected geometry. Native Bar `LabelList` uses the engine’s original bar sizing and is not supported for unequal-bin edge positions.

This bounded family does not support horizontal orientation, stacking, native bar sizing/minimum heights/backgrounds, automatic edges, weighted/fractional counts or nonlinear histogram axes. Do not add replacement primary axes or wrap the series in `BarStack`; native escape hatches remain the consumer's responsibility. Floating-point inputs follow JavaScript comparison without epsilon adjustments; extreme finite values that cannot produce a finite domain/density are rejected. Chromium and the pinned React/Recharts/Motion peers are the tested targets; there is no broader compatibility guarantee.
## Box plot: explicit statistics

`BoxPlotChart` reuses Kind's `BarChart` (including optional `animate`) and public
Recharts composition. Recharts has no native BoxPlot component: `BoxPlotSeries`
registers a native range Bar and renders its summary with public axis-scale hooks.
No new dependency or copied renderer is introduced.

```tsx
const data = [{ group: "A", summary: {
  lowerWhisker: -5, q1: -2, median: 0, q3: 3, upperWhisker: 8,
  outliers: [-10, 20],
} }];
<Root config={{ spread: { label: "Distribution", color: "#16756c" } }}>
  <BoxPlotChart data={data} width={480} height={280}>
    <XAxis dataKey="group" />
    <YAxis type="number" domain={["dataMin", "dataMax"]} />
    <BoxPlotSeries dataKey="summary" seriesKey="spread" />
  </BoxPlotChart>
</Root>
```

- `BoxPlotSummary` requires finite numbers in the order
  `lowerWhisker <= q1 <= median <= q3 <= upperWhisker`.
  `outliers?: readonly number[]` must be finite and strictly outside the supplied
  whiskers. Duplicates are retained. Invalid present summaries throw actionable
  errors; `null`/`undefined` summaries render no marks, and an empty dataset renders
  no marks. Zero, negatives, equal quartiles and equal whiskers are valid.
- The caller computes these statistics and chooses the quartile/fence convention.
  Kind does not ingest raw samples, classify observations, remove outliers, or
  fabricate statistics. `validateBoxPlotSummary(unknown)` returns the same summary
  or null; `boxPlotExtent(summary)` validates and returns the complete min/max,
  including every outlier. These helpers do not mutate input.
- `BoxPlotSeries<Row>` accepts a direct property name or typed accessor in `dataKey`
  (no nested-path interpretation). `seriesKey` is required for metadata and
  controlled Root visibility. Native domain inference uses the complete extent,
  not just median or quartiles. Supply native axes and their IDs; for horizontal
  boxes use `layout="vertical"`, a numeric XAxis and categorical YAxis.
- `barSize`, native series data, Cell paint, stroke, opacity, style, filter,
  clipPath, mask and visibility, LabelList, axis IDs, chart/series
  handlers, chart refs, and consumer children retain their native ownership.
  LabelList's native position refers to the enclosing range; supply a label
  dataKey or custom content if the label should describe a statistic.
- `shape(props: BoxPlotShapeProps)` receives `summary`, `native: BarShapeProps`,
  mapped `coordinates`, category `center`/`size` and `orientation`. It owns its
  returned markup. `markProps` forwards SVG group attributes, styles, handlers and
  refs (one group per present row). `BoxPlotMark` is the exported SVG primitive;
  it accepts screen coordinates rather than statistical values. Degenerate boxes
  get a collapsed line without inflating the numeric IQR. `outlierRadius` controls
  the screen-space outlier symbol size.
- Shared `Legend`, controlled visibility, `Tooltip`, and optional Motion remain
  available. A native tooltip value is the enclosing numeric range; use custom
  tooltip content to read the original payload and show quartiles/whiskers/
  outliers. The recipe demonstrates that and a full, always-available table.
  Recharts owns keyboard category selection; null rows have no numeric tooltip.
  Arrow keys and Escape are checked in Chromium. Tables provide complete numeric
  access independently of chart interaction and series visibility.

Initial scope: linear numeric axes, categorical groups, two orientations, optional
Bar reveal Motion with reduced-motion/interruption behavior. Stacking, minimum
numeric sizes, native rectangle backgrounds/radius, native
active-bar duplication, raw-sample estimators, weighted quartiles, notches,
variable-width-by-sample-size boxes, and quantitative category positioning are
outside this family. Nonlinear numeric axes, Brush, mixed-series composition and
performance at large sample/group counts are not verified. Custom SVG marks are
consumer-owned. This change adds exports at private `0.0.0`; it does not publish
or alter existing family contracts.

References: [NIST box plot definitions and variants](https://www.itl.nist.gov/div898/handbook/eda/section3/boxplot.htm),
[Recharts Bar](https://recharts.github.io/en-US/api/Bar/),
[public X scale](https://recharts.github.io/en-US/api/useXAxisScale/),
[public Y scale](https://recharts.github.io/en-US/api/useYAxisScale/).
The sample estimator and whisker definition deliberately remain caller-owned.


### Box plot materials

`BoxPlotSeries` and the screen-space `BoxPlotMark` accept `material="plain" | "paper" | "clay" | "glow"` (`BoxPlotMaterial`). Plain is the default. Paper uses the existing bar grain and uneven inset pencil contour; Clay uses bar soft convex matte relief; Glow adds an exterior painted halo and a crisp lightened body. These static finishes are independent of color and Motion and preserve every whisker, quartile, median and outlier coordinate. Native stroke width/dashes remain the input silhouette. No extra minimum extent is introduced: all-equal and tiny marks receive a line finish; missing rows still have no marks.

Each present native mark has its own React-generated filter ID and user-space region, including outliers and resolved child stroke widths/miter limits, so line-only summaries do not require nonzero bounding boxes. Use React `identifierPrefix` for independently mounted roots. Box finishes reuse the `--kind-ui-bar-*` tokens documented above. Body alpha is preserved, including zero fill opacity; glow/cast effects can paint only outside the native footprint. Tiny marks have less room for visible grain/relief. Bounds are refreshed for React updates, stylesheet edits/loads, ancestor theme classes, viewport changes and pointer entry/exit. Direct CSSOM rule mutations without one of those signals are not observed. The default box fill remains `0.18`; an explicit `fillOpacity` (for example `0.65`) makes broad surfaces easier to see.

An explicit series/Cell/mark `filter`, or `style.filter`, including `none`, disables the built-in finish for that mark. Custom `shape` owns its markup and is not automatically materialized; it may explicitly return a materialized `BoxPlotMark`. Cells, gradients, native paint/opacity, mark styles, clipping, masks, visibility, refs, handlers and labels retain ownership. Filters run on the original consumer mark group (parts remain direct children) and existing reveal/plot clips, which may trim decorative halos. Chromium is verified; other SVG engines and print renderers remain unverified. No shared helper changes, dependencies, workflow changes or releases accompany this material stack.
### Shared presentation example

`examples/chart/presentation.html` demonstrates the same public options for line, area and bar, icon/swatch fallback, composed legend labels, native formatter tuples/suppression, custom content and light/dark host CSS variables. It enables motion by default while following live reduced-motion preferences, and includes keyboard instructions and all-series table values. Its source is also compiled against an independently installed tarball, with guarded public imports, strict NodeNext/Bundler checks, and Chromium interactions. Theme colors remain host-owned CSS variables; this change does not add automatic light/dark config mapping. String labels/colors remain required.

```tsx
<Chart.Legend hideIcon>
  {({ label, visible, marker }) => <>{marker}<span>{label}</span><small>{visible ? "Shown" : "Hidden"}</small></>}
</Chart.Legend>
<Chart.Tooltip content={(tooltip) => (
  <Chart.TooltipContent tooltip={tooltip} hideLabel indicator="dashed" />
)} />
```

### Polar materials

`RadarSeries` and `RadialBarSeries` accept `material="plain" | "paper" | "clay" | "glow"` (`PolarMaterial`), independently of consumer color and Motion. Plain is the default. Paper uses seeded inset pencil contours and subtle fiber grain without displacement; Clay adds broad upper-left convex matte relief; Glow adds a bright rim and exterior color light. All retain native polygon/sector paths, quantitative coordinates, gradients, fill/stroke opacity and zero-alpha paint. Paper and Clay retain native output alpha; Glow retains native alpha inside the mark and adds intentional decorative light outside it. The exterior halo is not a quantitative extent. Very thin/short marks have less room for interior relief. Chromium can rasterize curved antialiased edges differently when a native SVG filter uses spatial inputs; alpha regression checks require every covered pixel to stay within the independently measured native unfiltered/morphology/blur/offset-relief raster envelope (plus one byte for quantization), alongside untouched path/paint assertions and zero-alpha checks. Unfiltered and filtered edge rasters are not promised to be byte-identical.

Custom Radar `shape`, RadialBar `shape` or custom `activeShape`, a series `filter`, or `style.filter` owns rendering and suppresses the material. Cell filter/style overrides retain native precedence. Dots, backgrounds, labels, refs and handlers remain native. Unique per-series filters use chart-space bounds so short/thin/empty arcs do not depend on nonzero object bounds. Native SVG and consumer clipping still apply. Optional CSS variables use `--kind-ui-polar-paper-{fiber,grain}`, `--kind-ui-polar-clay-{light,highlight,shade,shadow}` and `--kind-ui-polar-glow-{light,opacity}`.

The polar recipes/gallery share a Material control and enable Motion by default, respecting reduced motion. Gauge text remains large in the center whitespace; ordinary radial labels remain at band center with independent Chart text visibility. This is an additive pre-release API at private version `0.0.0`.

## Waterfall

`computeWaterfallData(entries, initialBalance = 0)` returns fresh ordered rows for
native numeric range bars. Each entry has a unique nonempty `id`, a `label`, and
one of these explicit kinds:

| Kind | Supplied value | Meaning |
| --- | --- | --- |
| `start`, `total`, `end` | finite number or `null` | Checkpoint: draw zero → value and establish the running balance. A checkpoint can intentionally disagree with the preceding balance. |
| `delta` | finite signed number or `null` | Draw previous balance → balance + value. |
| `subtotal` | none | Draw zero → current balance; do not add it again or reset it. |

The default starting balance is explicitly zero; pass `null` for an unknown
opening balance. Kind names express intent, not positional restrictions: an
`end` is an explicit supplied total, never an automatically inferred final sum.
A missing delta makes subsequent geometry/balances unknown until a known
checkpoint restores them. Its known successors still retain their original
values. A missing checkpoint also establishes an unknown balance. Zero remains
numeric (`[balance, balance]` for a zero delta), with no invented minimum height.
Nonfinite values, omitted values, duplicate/empty ids, supplied subtotal values,
unknown kinds and arithmetic overflow throw. Inputs are not mutated.

```tsx
import * as Chart from "@kind-ui/charts";
import { Cell, ReferenceLine, XAxis, YAxis } from "recharts";

const data = Chart.computeWaterfallData([
  { id: "opening", label: "Opening", kind: "start", value: 80 },
  { id: "cost", label: "Cost", kind: "delta", value: -100 },
  { id: "net", label: "Net", kind: "subtotal" },
  { id: "closing", label: "Closing", kind: "end", value: -20 },
]);

<Chart.Root config={{ range: { label: "Balance", color: "#3478ae" } }}>
  <Chart.WaterfallChart data={data} width={480} height={280} animate>
    <XAxis dataKey="id" />
    <YAxis domain={["auto", "auto"]} />
    <ReferenceLine y={0} />
    <Chart.WaterfallConnectors data={data} />
    <Chart.WaterfallSeries material="paper">
      {data.map(row => <Cell key={row.id} fill={row.kind === "delta" ? "#b54d46" : "#3478ae"} />)}
    </Chart.WaterfallSeries>
  </Chart.WaterfallChart>
</Chart.Root>;
```

`WaterfallChart` is the existing `BarChart` under a descriptive name, with its
native props/ref, controlled visibility, interruption behavior, reduced-motion
handling and opt-in Motion. `WaterfallSeries` binds `dataKey="range"` and
`minPointSize={0}`. It accepts the remaining `BarSeries` extension points,
including native shapes, cells, labels, active bars, filters, refs and events;
`data`, `dataKey`, `stackId`, and `minPointSize` are excluded and rejected at
runtime. Keep one unstacked Waterfall series on its axes. Supply the computed
rows to the chart and the same rows to connectors, with the categorical axis
using `id`. Custom range rows may be supplied directly by a host that owns its
arithmetic. Brush-windowed connectors are not covered; subset the data for both
primitives yourself.

`WaterfallConnectors` uses native `ReferenceLine` segments, matching explicit
`xAxisId`/`yAxisId` and horizontal (`layout="vertical"`) charts as well. Pass the
same `seriesKey` (default `range`) and `hide` as the series. Connectors join only
adjacent known balances that agree: no bridge over an unknown step, or from a
computed balance to a differing checkpoint. They run between native category
centers under bars, with default `zIndex={100}`, dashed stroke and no pointer
capture; native `shape`, `stroke`, `position`, `zIndex`, labels and overflow props
remain available. Use `position="middle"` to align center endpoints.

Existing `BarMaterial` (`plain`, `paper`, `clay`, `glow`) applies independently to
native floating rectangles without changing numeric geometry. Native custom
shapes/filters retain material ownership, as with `BarSeries`; no additional
material adapter or shared API change is needed.

A native range tooltip reports range endpoints. For semantic values, compose
`Tooltip` content using the original/computed row (as in
[`waterfall-recipes.tsx`](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/waterfall-recipes.tsx)); use
`filterNull={false}` when showing unknown steps. The host owns formatting,
accessible data tables and source values. The responsive
[`waterfalls.html`](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/waterfalls.html) recipe enables motion
by default and includes a table, visibility/update controls and missing, zero,
negative and crossing-zero examples.

### Sankey flows

`SankeyChart` uses first-party Recharts `Sankey` for layout, native `node`/`link`
object, element or callback renderers, child Tooltip, labels, SVG props and native
events. `data` is `SankeyFlowData`: every node has a nonempty unique string `id`
and string `name`; every link has its own unique `id`, a finite nonnegative
`value`, and `source`/`target` as node IDs or integer array indices. String
endpoints always mean IDs, including numeric-looking strings. No flow is
synthesized, normalized or aggregated.

`prepareSankeyData(data)` validates and copies input into native numeric
endpoints. It rejects duplicate/empty identities, unknown IDs, out-of-range or
fractional indices, missing/negative/nonfinite values, overflowing node totals
and cycles, including zero links. Nodes with both incoming and outgoing links
must balance to a relative tolerance of `1e-9`, with no absolute zero tolerance.
Model losses/gains as explicit edges and boundary nodes. Boundary sources/sinks
need no matching counterpart. Supply immutable data when changing a chart.

Zero links and nodes without positive links remain in input and tables;
`SankeyChart` excludes them from native layout. All-zero and empty charts display
`empty` (default `No positive flows`). Native callback indices address this
filtered rendering array. Renderer/event payloads retain typed `id` identities,
including source/target node IDs on links. Native layout owns derived node
values (maximum input/output). Never use a render index as an input identity.

Finite values can still exceed native floating-point layout limits. At the
native drawable height H, with N positive-flow nodes, the chart conservatively requires finite aggregate
positive flow T, finite positive H/T, finite T*H and nonzero v*((H - (N-1)*padding)/T) for every
positive link. It throws an explicit renderer-limit error rather than changing
values. Supply explicitly rescaled units at your data boundary if necessary.
Equal-value parallel positive links also throw a renderer-limit error because
Recharts keys links by source, target and value. Distinct-value parallel links
are supported; semantic validation and the table accept either. No duplicate
flow is silently combined. These checks are separate from semantic validation. A frame too small for the
conservative node-padding budget displays `Insufficient space for flows; use
the data table` instead of negative native geometry. SSR and unmeasured frames
also use this status until measured. Native ResponsiveContainer remains usable.

`SankeyNode` and `SankeyLink` are optional native callback/element shapes, not
series components. They accept SVG presentation/handlers and `rectProps` or
`pathProps`. Computed coordinates, dimensions and link width win over supplied
presentation attributes; link width also wins over inline CSS stroke width.
`SankeyLink.material="solid" | "gradient"` remains the paint API, using native
cubic coordinates and proportional stroke widths. Separately,
`SankeyLink.finish` and `SankeyNode.finish` accept exported `SankeyFinish`:
`"plain"` (default), `"paper"`, `"clay"`, or `"glow"`. No chart-level finish
is injected into custom renderers. Set finishes explicitly on the optional marks:

```tsx
<SankeyChart data={flows}
  node={(props) => <SankeyNode {...props} color="#cf5782" finish="clay" />}
  link={(props) => <SankeyLink {...props} material="gradient" finish="paper" />}
/>
```

Paper uses static subtle grain and an uneven inset pencil contour. Clay uses
broad upper-left light and diffuse lower-right shading to suggest convex matte
volume, with quiet grain and no cast shadow. Glow has a soft white interior
rim and a restrained neutral exterior halo; blur is 0.85–1px (flow width/4, bounded to a nonzero native blur
kernel), halo opacity is capped at 0.12. It is intentionally less expansive
than line Glow so adjacent flows retain their quantitative reading. Tiny marks
show less relief. No finish displaces, widens, offsets or blurs native geometry.
Paint RGB/semantic gradients remain the base; neutral surface decoration modifies
visible RGB while atop compositing preserves native body alpha. Exterior Glow
is separately decorative, is not additional flow, and never adds hit targets.

Explicit SVG `filter` or inline `style.filter` disables built-in finishes;
stylesheet filters override the filter presentation attribute normally. Props,
refs and handlers remain on the original rect/path; native clipping can trim
exterior Glow. Node labels are consumer siblings, outside mark filters. Native
custom node/link callbacks and elements retain complete rendering ownership.
Separately mounted React roots should use `identifierPrefix` for unique IDs.
Finishes are static and follow the chart's existing reduced-motion reveal rules.
This is an additive pre-release API with no dependency or version change; the
package stays private at `0.0.0`. Validation targets Chromium; other browsers,
print/export renderers and richer configurable material tokens are unverified.

`SankeyTable` is an independently composable native table with required
`caption`, all link identities, source/target names and exact zero values.
`formatValue` controls units. Optional `onInspect` renders native buttons for
Tab/Enter/Space inspection with controlled `activeLinkId` and `aria-pressed`.
The callback receives the original link. Consumer state connects pointer/native
events to the same table; table refs, attributes and handlers remain available.
Pair diagrams with tables and a status description. Supply separate node
metadata tables when isolated nodes carry information beyond flow quantities.

`animate` defaults to false; recipes enable it. `animate={true}` uses 450ms;
`animate={{ revealDurationMs: 800 }}` accepts a finite nonnegative duration. Motion reveals opacity only for
450ms, without changing proportional widths or moving flows. Pointer down,
focus, changed immutable data/layout/renderers, native measured frame resize and live
reduced-motion preference stop playback and show final geometry. Unmount stops
playback. Examples retain a readable minimum diagram width in a keyboard
scrollable region on phones and viewport-fitting tables. No topology morph or
width tween is promised. See `examples/chart/SANKEYS.md` and `/sankeys.html`.

## Heatmap

`HeatmapChart`, `HeatmapGrid`, `HeatmapLegend`, `HeatmapTooltip`, and `HeatmapDataTable` compose a two-dimensional categorical grid using native HTML table layout. They are independent of `Root` and Recharts chart contexts. The browser owns equal-cell geometry; ordered domains and data are consumer-owned. No new dependency or existing chart API change is required.

```tsx
import {
  createHeatmapScale, HeatmapChart, HeatmapGrid,
  HeatmapLegend, HeatmapTooltip, HeatmapDataTable,
} from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

const scale = createHeatmapScale({
  domain: [-10, 10],
  colors: ["#3b6fa8", "#f5f5ee", "#bf5b38"],
});
<HeatmapChart
  rows={["API", "Worker"]}
  columns={["East", "West"]}
  data={[
    { row: "API", column: "East", value: -4 },
    { row: "API", column: "West", value: 0 },
    { row: "Worker", column: "East", value: null },
  ]}
  scale={scale}
  animate
>
  <HeatmapGrid caption="Latency change by service and region" />
  <HeatmapTooltip />
  <HeatmapLegend label="Change in milliseconds" />
  <details>
    <summary>View values</summary>
    <HeatmapDataTable caption="Latency changes (ms)" />
  </details>
</HeatmapChart>;
```

- `rows` and `columns` are explicit ordered unique string domains. Unknown coordinates, duplicate domain entries, undefined/nonfinite values and overflowed sums throw actionable errors. An empty domain renders an empty grid message. Domains containing categories with no records still render missing cells. Supply new array identities when updating data/domains; inputs are treated as immutable.
- A datum is `{ row: string; column: string; value: number | null }`. Absent records and explicit `null` are missing, while `0` remains measured zero. `createHeatmapModel` exposes every domain coordinate, indices, resolved value and original `sources` for typed customization and inspection.
- `duplicates` defaults to `"error"`. `"first"` and `"last"` preserve the corresponding record, including null. `"sum"` sums finite records, ignores null when numbers exist, and keeps all-null cells missing. Negative/positive cancellation remains zero. `sources` retains all records in input order for every policy.
- `createHeatmapScale({ domain, colors })` requires finite ascending endpoints and at least two opaque `#rrggbb` colors. It interpolates evenly spaced stops in sRGB and clamps out-of-domain values. A constant domain uses the palette midpoint. Explicit domains make comparisons across updates meaningful; automatic rescaling is not performed. Consumers should label any clamping and choose a palette suited to sequential or diverging values. The legend uses the same stops/endpoints, includes a positioned zero marker with a separate label for signed domains, and a separate missing key.
- `formatValue(number)` and `missingLabel` are shared by cell labels, tooltip, legend and table. Default labels show values, with contrast-selected black/white text for numeric fills. Set both `--heatmap-missing` and `--heatmap-missing-foreground` when changing the missing swatch colors. Custom content owns its own text contrast. `HeatmapGrid` accepts a typed `Cell: ComponentType<HeatmapCellContentProps>` receiving `{ cell, fill, formattedValue }`, plus `cellProps(cell)` for native td refs/styles/handlers, and `rowLabel`/`columnLabel` for visible header content. Preserve opaque fills and a meaningful text alternative when customizing; nested interactive content needs host-specific keyboard handling. Grid role, tab stops, coordinate identity, accessible cell labels and background color remain component-owned; cell handlers are composed and a cancelled key event suppresses grid navigation.
- Native DOM props, styles, refs and handlers are forwarded on the chart div, grid table, legend fieldset, tooltip div and static table. `HeatmapTooltip` accepts a typed `Content` component with the same cell contract. Compose one grid and at most one tooltip per chart; create separate chart boundaries for independent grids. Tooltip values derive from the latest active coordinate, so data changes and reorder do not leave stale payloads.
- The grid has one roving tab stop. Arrow keys move within the ordered domains, Home/End move to the row endpoints, Ctrl+Home/End to the corners. Focus and pointer inspection open the tooltip; Escape closes it and Tab exits the grid. Native cell focus scrolls narrow containers. Long row headers and default cell text are clipped visually to preserve equal rows; cell accessible labels and the static data table retain the full values. Removing the focused category falls back to the first cell on the next Tab entry. The optional tooltip is an in-flow readout; the static data table is consumer-placed and has no roving focus behavior.
- `animate` defaults off in the library and on in the recipes. The existing Motion peer animates only a short frame translation; cell fills stay opaque and values do not tween. Reduced-motion preferences disable translation. Host/card styling belongs to the consumer through native `className` and `style`; it is not a chart material. `HeatmapGrid material` accepts `HeatmapMaterial`: `"plain"` (default), `"paper"`, `"clay"`, or `"glow"`. These are static per-cell edge treatments, never card styling. Paper adds a fibrous, irregular ink rim; Clay adds a soft top-lit convex matte bevel; Glow adds a luminous rim contained within the cell. Only the outer 8% on each side is decorated: the central 84% by 84% (70.56% of the rectangular cell area, before text) remains the exact opaque scale color. Compare this center to the unmodified legend, not the decorative edge. Missing cells retain their pattern and never receive a finish. No filter, opacity, shadow, geometry or animation is added. Consumer background-image/size/repeat overrides still win, and custom content and native cell styles/filters/refs/events remain owned by the consumer. Consumer paint overrides can invalidate the encoding guarantee. Full-face texture, glossy clay and an external glow halo are intentionally unsupported because they would alter or bleed the numeric encoding; these are bounded rim materials.

See [responsive matrix and activity recipes](https://github.com/bhaveshchow20/kind-ui/blob/931eb002287e300d220023a45d3ab8ff8ee86a37/examples/chart/HEATMAPS.md) for renderer research, behavior, verification and limitations. Native tables render every cell; virtualization, editing, range selection, inferred domains and automatic aggregation are outside this API. Automated Chromium checks cover tested interaction/layout paths; manual screen-reader coverage remains unverified.

Pie finishes preserve consumer CSS transform ownership by rendering the original native Sector when an inline transform or a stylesheet transform overrides its SVG transform attribute. This fallback preserves antialiased paint, clipping and hit targets; it does not apply the requested finish. Ordinary CSS colors/classes/styles and explicit SVG `transform` attributes continue to support finishes. CSS individual `translate`, `rotate` and `scale` properties also retain native ownership. Ambient stylesheet/media/pseudo-class changes without a relevant React prop update do not refresh material ownership. Stylesheet ownership is sampled when the finish, center, outer radius, SVG transform, style, class or id changes. For transforms that change later through media queries, ancestor state or pseudo-classes, use a consumer `style` prop or change the finish/style/class/id to refresh ownership. Custom shapes and filters also retain native ownership.

CSS fallback verification compares complete native SVG topology and resolved ancestor paint, absence of transient material definitions, and exact decoded RGBA from self-contained fixed-fixture SVG images. Mutation controls check paint, transforms, clipping, wrappers and reference relationships. This proves native paint ownership; it does not promise universal live-inline browser raster stability or arbitrary HTML-to-SVG export fidelity. Normal material alpha and geometry checks continue to use the live packed consumer.

### Selective emphasis (preview)

`Root emphasis="auto"` is the default; `"none"` disables transient emphasis.
It does not change `visibleSeries`, engine inspection, selection, or click callbacks.

| Family | Automatic decoration in this preview |
| --- | --- |
| Bar | Default `BarChart emphasis="none"`. Opt in with `emphasis="category"` for an eligible native plot; grouped and stacked series stay together. |
| Pie / Donut | Native default sectors emphasize the semantic `nameKey` value. |
| Line / Area / Combo / Scatter / Bubble | Existing inspection; no automatic dimming. |
| Radar / Radial / Sankey / Box / Histogram | Adapters unfinished; no automatic dimming. |
| Heatmap / Waterfall | Existing cell or step inspection; numeric paint and chain remain unchanged. |

Bar eligibility is conservative and applies to the whole visible plot. Every visible
Kind `BarSeries` must use chart-level rows, a direct string numeric `dataKey`,
complete finite values that differ from the numeric baseline, native default
shape/activeBar, and unique string category-axis values with one domain entry per row, or a complete
unique `emphasisKey` mapping. A resolver returning `undefined` makes the entire
Bar plot ineligible; it does not partially dim remaining rows.
Zero/missing/range/function/nested-key/per-series rows, ambiguous categories, and
custom-shape peers fall back the entire plot to native rendering without dimming.
Hidden peers do not block eligibility. Use Kind `BarSeries` for all peers in this
opt-in comparison; raw engine/custom marks require explicit decoration. This
protects native zero-size filtering and consumer labels. Eligibility changes
clear removed paint targets; safe→sparse/custom→safe does not resurrect an old
hover. Root `emphasis="none"` disables the opt-in as well.

Bar numeric and index-only domains do not dim automatically. Supply
`emphasisKey={(row) => ...}` on each participating `BarSeries` to return the same
stable category ID across grouped/stacked series. Give Pie a semantic `nameKey`
or an `emphasisKey` resolver. IDs must be unique within each category/sector scope;
index values are not stable IDs. Independent plots inside one Root have separate
category scopes. Removing a registered target clears its transient state.

Custom shapes, consumer active/inactive shape overrides, and their portals retain
ownership. To participate explicitly, wrap only their paint in
`<EmphasisMark target={{kind: "category", key: data.id, scope: "my-plot", seriesKey: "sales"}}>…</EmphasisMark>`.
Keep annotations and labels outside that wrapper. Share a `scope` only for marks
that represent the same comparison. `useEmphasis(target, enabled?)` exposes
`active`, `dimmed`, `factor`, `enter("pointer" | "keyboard")`, and `leave(channel)`
for renderers needing their own decoration. Apply `factor` through an extra paint
layer so existing opacity, transparent fills and motion multiply exactly once.
Neither API uses descendant rewriting or global selectors.

`Legend emphasis="series"` opts into series hover/focus emphasis for participating
marks with `seriesKey`; controlled visibility click behavior and custom item content
remain unchanged. Other chart families require an explicit mark adapter before
legend emphasis paints them. The default Legend does not emphasize series.

Pointer leave restores the retained keyboard candidate. Explicit legend/custom keyboard/focus
emphasis supersedes hover; Escape clears transient emphasis without changing
controlled selection. Touch has no new tap/click behavior. Dimming keeps marks
hittable and uses a 160ms interruptible opacity transition; reduced motion removes
the transition. Import `@kind-ui/charts/styles.css` for these defaults.

The public packed recipe in `tests/fixtures/emphasis` demonstrates category,
sector, custom portal, visibility, and independent-plot composition. This preview
is additive and private at `0.0.0`; adapters beyond the matrix above are not claimed.

Identity relationships: `dataKey` selects measured values; it is not a category ID.
`seriesKey` selects Root metadata and controlled series visibility (or a string
`dataKey` supplies that series key). `emphasisKey` selects the stable datum ID.
Pie sector visibility remains consumer-owned through its supplied data/Cells;
Root visibility does not rewrite Pie data. A custom mark must use `enabled={false}`
when its owning consumer hides or removes it. Emphasis registration represents
paint that is currently present, rather than a second persistent selection model.

A pointer candidate temporarily takes precedence over a retained keyboard
candidate. A new explicit legend/custom keyboard/focus action supersedes pointer emphasis;
leaving that hover restores the retained candidate. Native chart focus/blur and
Escape reconcile these transient candidates without invoking selection callbacks.
Touch-induced focus does not create keyboard emphasis. Native active marks may
move between Recharts portals; clearing uses semantic identity across that move.

Native overlap limitation: Recharts' public tooltip inspection prioritizes an
active mouse hover over keyboard state. When the pointer remains on category A
and keyboard arrows run, native tooltip data and Kind emphasis can both remain
on A. Clean keyboard entry advances normally. Kind does not maintain a second
keyboard index, dispatch synthetic consumer events, or use private engine state.
Full pointer/keyboard equivalence is not claimed. After pointer exit, retained
keyboard emphasis represents the last eligible inspection candidate; the native
tooltip may close. This bounded preview follows native selection ownership.

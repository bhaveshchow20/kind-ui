# Legend and chart activation — design proposal (#111)

Status: **discussion draft; no runtime implementation or approved API**.
Related: [issue #111](https://github.com/bhaveshchow20/kind-ui/issues/111),
[identity alignment #97](https://github.com/bhaveshchow20/kind-ui/issues/97).
Baseline: `d6c62f32344fc7fbf43decf25fd16a17317d6c66` (main).
All additions below are proposals, not currently accepted props or exports.

## Existing contract and recommendation

`Root` owns `config`, optional controlled `visibleSeries`, and
`onVisibleSeriesChange(next: string[])`. Without that callback, `Legend` does not toggle visibility; transient emphasis
can still expose focusable legend entries. `Legend emphasis="series"` adds transient pointer/focus emphasis;
it does not select a persistent series. `useEmphasis`, `EmphasisMark`, and
`EmphasisTarget` already support scoped transient series/category/sector paint.
`Root emphasis="none"` disables that emphasis, and Root currently resets it in
Escape capture before the consumer capture handler runs.

`RadarChart selection="series"` already supports controlled `selectedSeries:
string | null`, required `onSelectedSeriesChange`, or internal selection starting
at null. It toggles selection on repeated activation and clears on Escape.
Hidden/removed controlled selections have no effective paint; internal invalid
selection clears without a synthetic callback. It currently requires Root
emphasis to be enabled. `SankeyChart` has stable identity-aware `onClick`,
`onMouseEnter`, and `onMouseLeave`, but **no built-in persistent selection** at this
baseline. `SankeyLegend` is a separate noninteractive node legend.

Recommend one explicit mode at the shared owner, not independent Legend and mark
modes: proposed `interaction="visibility" | "focus"` on `Root`, with visibility
as the compatibility default. Mark activation is separately opt-in (proposed
`markActivation="none" | "matching-legend"`, default none). Thus existing native
mark click handlers gain no surprise action. A static Legend stays static unless
state is controlled with a callback or explicitly initialized for internal use.
Focus uses a single selected identity, independent of the visibility array.
No universal data schema, geometry ownership, dependencies, or new package.

Alternative: configure mode on Legend alone. Reject because chart marks outside
Legend cannot discover its owner reliably, and multiple legends could conflict.
Alternative: consumer-only recipes. Useful for specialized families, but cannot
by themselves establish consistent guard, event order, and accessible state.

## Proposed typed surface for discussion

Reuse series names from Radar rather than renaming every selection to a generic
item. These schematic sketches describe additions to existing components, not new exports;
final prop unions must enforce the ownership constraints stated below:

```ts
type SeriesFocusProposal = {
  selectedSeries?: string | null;
  defaultSelectedSeries?: string | null;
  onSelectedSeriesChange?: (next: string | null) => void;
};
type VisibilityProposal = {
  // Existing controlled props keep their signatures.
  visibleSeries?: readonly string[];
  defaultVisibleSeries?: readonly string[];
  onVisibleSeriesChange?: (next: string[]) => void;
};
type ActivationProposal = {
  interaction?: "visibility" | "focus";
  markActivation?: "none" | "matching-legend";
  onBeforeInteraction?: (request: {
    identity: { kind: "series" | "category" | "node"; key: string };
    source: "legend" | "mark" | "reset";
    mode: "visibility" | "focus";
    // null for Escape/reset; otherwise the originating input event.
    event: Event | null;
  }) => boolean | void; // false vetoes; exact event type needs review
};
```

Controlled/default props are mutually exclusive; supplying a controlled selection
requires a change callback, as Radar does today. `undefined` selects internal
ownership, `null` clears focus, and `[]` is an intentionally empty visibility
value. Internal visibility requires explicit `defaultVisibleSeries`; do not
silently make every current Legend interactive. Proposed category focus uses
`selectedCategory`, `defaultSelectedCategory`, `onSelectedCategoryChange` on
`PieChart`/`RadialBarChart`; category visibility stays caller-filtered pending
review. Proposed Sankey node focus uses `selectedNode`, `defaultSelectedNode`,
`onSelectedNodeChange` on `SankeyChart`; no fictional current selection prop.

Typed composition examples follow. Existing names are imported from the public
package; **typed proposal objects require a future approved implementation**. These
are design examples, not compiled consumer proofs. `rows`, `slices`, and `rings`
are caller-owned data; Hook calls and JSX belong inside a React component.

```tsx
import { useState } from "react";
import {
  Root, Legend, BarChart, BarSeries, PieChart, PieSeries,
  RadialBarChart, RadialBarSeries, type SeriesConfig,
} from "@kind-ui/charts";

const config = {
  revenue: { label: "Revenue", color: "#3659b8" },
  costs: { label: "Costs", color: "#a04d33" },
} satisfies SeriesConfig;
const rows: Array<{ month: string; revenue: number; costs: number }> = [
  { month: "Jan", revenue: 12, costs: 8 },
];
const [visible, setVisible] = useState<string[]>(["revenue", "costs"]);
const [selected, setSelected] = useState<string | null>(null);

// Proposed typed configuration (not passed to current Root):
const focusProps = {
  interaction: "focus", markActivation: "matching-legend",
  selectedSeries: selected, onSelectedSeriesChange: setSelected,
} satisfies ActivationProposal & SeriesFocusProposal;
// After approval: pass these additions to Root alongside existing props.
<Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
  <BarChart width={400} height={240} data={rows}>
    <BarSeries dataKey="revenue" seriesKey="revenue" />
    <BarSeries dataKey="costs" seriesKey="costs" />
  </BarChart>
  <Legend emphasis="series" />
</Root>;
// Visibility variant: proposed interaction="visibility" uses the same visible
// state; a revenue bar and its Legend entry request the same series toggle.
// Internal focus variant: omit selectedSeries and supply proposed
// defaultSelectedSeries="revenue"; callback is optional for observation.
```

```tsx
type CategoryRow = { key: "apples" | "pears"; value: number };
const categoryConfig = {
  apples: { label: "Apples", color: "#3659b8" },
  pears: { label: "Pears", color: "#a04d33" },
} satisfies SeriesConfig;
const slices: CategoryRow[] = [{ key: "apples", value: 12 }, { key: "pears", value: 8 }];
const [category, setCategory] = useState<string | null>(null);

type CategoryFocusProposal = {
  selectedCategory?: string | null;
  defaultSelectedCategory?: string | null;
  onSelectedCategoryChange?: (next: string | null) => void;
};
const pieFocusProps = {
  interaction: "focus", markActivation: "matching-legend",
  selectedCategory: category, onSelectedCategoryChange: setCategory,
} satisfies ActivationProposal & CategoryFocusProposal;
// After approval: pass pieFocusProps additions to PieChart and bind its Legend.
<Root config={categoryConfig}>
  <PieChart width={400} height={240}>
    <PieSeries data={slices} dataKey="value" nameKey="key" categoryKey="key" />
  </PieChart>
  {/* Proposed category-aware Legend binding; current Legend assumes series. */}
  <Legend />
</Root>;

const rings: CategoryRow[] = slices;
const radialFocusProps = {
  interaction: "focus", markActivation: "matching-legend",
  defaultSelectedCategory: "apples", onSelectedCategoryChange: setCategory,
} satisfies ActivationProposal & CategoryFocusProposal;
// After approval: pass radialFocusProps additions to RadialBarChart and bind its Legend.
<Root config={categoryConfig}>
  <RadialBarChart width={400} height={240} data={rings} categoryKey="key">
    <RadialBarSeries dataKey="value" />
  </RadialBarChart>
  {/* Proposed category-aware Legend binding, not value-series selection. */}
  <Legend />
</Root>;
```

```tsx
import {
  SankeyChart, SankeyLegend, type SankeyFlowData, type SankeyNodeConfig,
} from "@kind-ui/charts";

const flows = {
  nodes: [{ id: "source", name: "Source" }, { id: "destination", name: "Destination" }],
  links: [{ id: "flow-1", source: "source", target: "destination", value: 8 }],
} satisfies SankeyFlowData;
const nodeConfig = {
  source: { label: "Source", color: "#3659b8" },
  destination: { label: "Destination", color: "#a04d33" },
} satisfies SankeyNodeConfig;
const [node, setNode] = useState<string | null>(null);
const nodeFocusProps = {
  interaction: "focus", markActivation: "matching-legend",
  selectedNode: node, onSelectedNodeChange: setNode,
} satisfies ActivationProposal & {
  selectedNode: string | null;
  onSelectedNodeChange: (next: string | null) => void;
};
// After approval: pass nodeFocusProps additions to SankeyChart; explicitly bind
// SankeyLegend to this chart's node action owner. No Root series state involved.
<SankeyChart width={400} height={240} data={flows} nodeConfig={nodeConfig} />;
<SankeyLegend config={nodeConfig} />;
```

Placement deliberately remains unresolved: Root is the recommended owner for
series, but category/node plots need a narrow owner-to-legend binding when several
plots share Root. Before implementation choose an explicit plot scope/binding;
never let the first mounted plot silently claim a Legend. `categoryKey` provides
color identity today, not category selection or visibility. Category mode must
align it with `nameKey`/`emphasisKey` and reject duplicate/missing selection IDs;
indices, labels, color, and numeric measure `value` are not stable identity.

## Family behavior matrix

Every family is accounted for; proposed support is not a current guarantee.
One logical identity has one action regardless of whether input starts on a mark
or its matching legend. Different plots require explicit scope when IDs overlap.

| Family / current surface | Identity and activation target | Visibility proposal | Focus proposal / boundary |
| --- | --- | --- | --- |
| Bar, Line, Area, Combo (`*Series`) | `seriesKey`, else string `dataKey`; bar/line/area paint and corresponding Legend button | Existing Root array, common last-visible guard; Combo mixed types share series identity | Root series selection; all marks of selected series emphasized. Bar category hover remains transient, not a category click action |
| Scatter (`ScatterSeries`) | Series key; any corresponding point and one series control | Same series guard | Series focus, not point selection; preserve native point tooltip/keyboard inspection |
| Radar (`RadarChart`, `RadarSeries`) | Existing series key; existing polygon/dot activation and series Legend | Root series guard | Adapt existing `selection="series"` state to shared owner; no two independent selectors. Existing standalone contract retained |
| Pie/donut (`PieSeries`) | Stable row category key; sector and category legend | Caller filters rows; common category guard only after explicit category binding is approved. Never toggle `value` as a series | Category/sector focus; multiple pies need explicit scope and policy for shared category IDs |
| Radial (`RadialBarChart`, `RadialBarSeries`) | Category row/ring via `categoryKey`; segment and category legend in category mode | Caller filters rows as for Pie; series visibility remains a separate existing contract | Category focus for rings; multi-series radial plots must explicitly choose series versus category binding |
| ActivityRings | Existing datum `key`; segment | Owns Root, currently omits visibility props from `rootProps`; needs explicit wrapper passthrough decision | Category focus requires reviewed wrapper support, not an assumed Root shortcut |
| Histogram (`HistogramSeries`) | Existing series key (default `count`); bin paint maps to series | Series guard, normally sole series cannot be hidden | Series focus; individual bin selection deferred |
| Box plot (`BoxPlotSeries`) | Series key; box/whisker paint maps to its series | Series guard | Series focus; observation/outlier selection deferred |
| Waterfall (`WaterfallSeries`) | Series key; step paint maps to series | Series guard only; do not filter steps and recalculate balances implicitly | Series focus; per-step identity/selection deferred |
| Sankey (`SankeyChart`, `SankeyLegend`) | `SankeyFlowNode.id`; node and node Legend. Links have distinct `SankeyFlowLink.id` | Deferred: removing a node also changes links/layout and flow semantics; no generic Root series toggle | Proposed node focus highlights node plus incident links and endpoint nodes; all other marks dim. Link activation remains consumer-owned unless an explicit link legend/binding is later approved |
| Heatmap (`Heatmap.*`) | Stable row/column pair; grid cell | Deferred: numeric color-scale legend does not identify cells, rows or columns | Keep existing grid inspection/tooltip state; persistent cell selection needs a separate reviewed binding, not a fake series contract |

Dimmed marks retain hit testing, tooltip access, focusability, and data alternatives.
Missing or nonpainted data never creates a fake activation target. Zero is valid
data: count it as eligible if a corresponding visible control/data item exists,
even when its geometry has no area; use its legend/keyboard alternative.

## State transitions and guard

For visibility, eligible IDs are the current caller-approved bound data identities
with a rendered series/item or usable corresponding data control, excluding
explicitly unavailable/disabled items. Config-only stale entries do not count.
A family needs explicit eligibility input if native data registration cannot
reliably distinguish filtering from temporary mount changes. Use the same
settled eligibility snapshot for Legend and marks.

For each hide request only, let `E` be eligible IDs and `V` the requested visible IDs.
Reject hiding `k` when `|(V ∩ E) \\ {k}| = 0`; keep state unchanged, emit no change
callback, and announce “At least one item must remain visible.” Showing an
eligible item is allowed even from externally controlled `[]`. Stale/unknown IDs
cannot satisfy the guard. Re-evaluate at activation, not using a stale closure.
With one active item, changing its identity through filtering does not auto-select
another: if no visible eligible item remains, show the genuine filtered/empty
state. The guard protects user hide requests, not data updates or owner writes.
Do not resurrect filtered data or prevent controlled `[]`.

Remove “All series hidden. Select a legend item to show it.” only in compositions
where guarded interactions make it unreachable. Preserve distinct no-data,
filtered-to-empty, and externally controlled all-hidden states and recovery
controls. No removal occurs in this design PR.

In focus mode activation toggles `null → k`, `k → null`, `j → k`; visibility never
changes. Only visible eligible identities can be selected. Reorder retains keys.
Uncontrolled hidden/removed/filtered selection clears after settled data updates,
without a synthetic change callback, matching Radar's current convention.
Controlled invalid selection remains owner-owned but is effectively null; it
can resume when the same ID returns. Document that restoration explicitly.
Controlled handlers request changes once; unchanged owner props keep paint and
pressed state unchanged. Omitted defaults start focus at null; later default
changes do not reset internal state. Do not switch control ownership mid-mount.

Mode change clears transient state; internal focus clears when leaving focus.
Controlled focus is retained but inactive in visibility mode and may resume on
return. Visibility is retained in either mode. An explicit reset action or
Escape requests null focus and clears transient emphasis, but never shows hidden
items. No callback for an already-null focus. No background-click reset: it
would conflict with consumer plot handlers. Review whether mode return should
instead require owner reset before adopting this policy.

Transient pointer/keyboard emphasis and tooltip inspection never write persistent
selection. Recommend inspection temporarily override persistent dim paint in its
explicit scope, then restore selection on leave/blur/cancel. Legend transient
series emphasis follows the same rule. Use one resolved paint factor rather than
multiplying opacities from hover and selection layers; persistent `aria-pressed`
remains stable while inspecting another mark. Escape clears both channels and
suppresses immediate re-emphasis from the unchanged hovered/focused target until
fresh pointer movement/re-entry or focus movement. Touch does not latch hover.
`Root emphasis="none"` continues disabling existing Radar selection; decoupling
persistent focus from that flag is an explicit compatibility decision, not a
silent fix.

## Input, callbacks, and composition

Native buttons activate once on click (mouse, touch, Enter/Space); SVG controls
handle Enter/Space without page scroll or repeated-key toggles. Touch tap activates
once; drag, scroll, cancelled pointer, secondary buttons, and synthetic portal
bubbling from unrelated annotations do not. Keep native tooltip navigation and
avoid intercepting inspection arrow keys. Prefer one keyboard control per logical
identity, rather than tab stops on every Cartesian observation. Ensure a usable
mark/control equivalent for thin lines and zero-size shapes.

Run consumer native mark handlers first with original payload, event, refs and
custom shape ownership intact. `preventDefault()` vetoes the built-in action;
then proposed `onBeforeInteraction` may return false. If allowed and guarded,
emit exactly one existing mode-specific change callback. `stopPropagation()` alone
is not a veto contract. Reset requests also pass through the before hook. The
last-visible guard remains mandatory even with custom policy; fully custom
consumer state writes remain external writes. Consumer override may disable mark
activation entirely. Custom renderers can opt into the same narrow action
adapter; do not wrap arbitrary DOM or replace custom handlers automatically.

`Legend.children` currently composes noninteractive content inside owned controls.
Preserve that signature's existing fields, add selected/mode metadata only if
approved, and do not require nested consumer buttons. Sankey's separate children
contract likewise stays compatible. A future explicit scoped action binding must
support custom legend layout without a second state store.

Visibility controls expose `aria-pressed` for visible state; focus controls for
persistent selection. Accessible labels name both item and action (“Highlight
Revenue” versus “Hide Revenue”). Announce selection/clear and rejected last-hide
requests through one scoped polite status, without duplicate announcements from
Legend and mark. Keep focused last-visible control operable so it can explain the
guard; do not remove it from the tab order. No focus stealing on activation/reset;
if filtering removes the focused control, use a documented nearest surviving
control or chart fallback. Reduced motion applies to dim transitions; no layout
animation is introduced by selection.

Escape precedence needs implementation review: consumer capture/bubble veto must
be honored before the proposed combined reset. Current Root capture resets hover
first; preserving exact old ordering and adding a cancellable reset conflict.
Do not claim that existing code already meets the proposed event contract.

## Decisions for owner review and implementation evidence

1. Approve Root series mode/default and separate opt-in mark activation; choose
   explicit category/node owner-to-legend scope binding before adding props.
2. Approve single selection, temporary inspection override, reset suppression,
   controlled invalid-ID restoration, and mode-return behavior.
3. Decide how existing Radar local selection hands off to Root without duplicate
   owners; define precedence/error for conflicting props and the `emphasis="none"`
   compatibility policy. Preserve Sankey's current identity event contract.
4. Approve category visibility/eligibility input and Pie re-normalization/radial
   row removal semantics. Keep Sankey visibility, links, Heatmap cells and
   observation/bin/step selection deferred with the boundaries above.
5. Finalize veto event typing, custom binding/reset API, focus restoration, and
   announcement wording. Last-visible guard itself is required, not optional.

After API agreement, implementation needs packed public-consumer type tests and
browser/component cases per supported family: mark/Legend parity and callback
count, controlled/uncontrolled/default/null/empty states, last-visible guard
(including stale config and zero values), native/custom handler vetoes, portals,
keyboard/touch cancellation, tooltip inspection, reorder/filter/remove/re-add,
last-active-item changes, mode switches, Escape, custom legend content, independent
scopes, reduced motion, and accurate genuine empty states. Test Radar compatibility
and Sankey identity payloads specifically. No claim of implemented support or
assistive-technology verification is made here.

Validation for this draft: source contract review and independent read-only
proposal review (no blocking completeness or API-name findings);
`git diff --cached --check`. No installs, builds, typechecks, package tests,
format aggregate, or CI polling under the disk-recovery constraint. Dependencies,
licenses, manifests, versions, and runtime files are unchanged.

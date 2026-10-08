# Loading and controlled interaction

Pass `loading={pending}` and a specific `loadingLabel` to the family chart root,
not to `Root`. All 0.3 families support them. The stylesheet supplies decorative
skeletons; real content remains mounted, hidden and inert while pending. Loading
does not validate bad rows away or delay completion. External legends can remain
active, so decide whether host controls should be disabled while pending.

**Bad:** `loading={rows.length === 0}` (an empty completed result never finishes).
**Good:** separate pending, success-empty, error, and ready states. Render host-owned
empty/error text and retry controls; cancel stale requests in the app. Partial
results need an explicit policy, not a fabricated finished dataset.

`animate={false}` disables chart motion. Reduced motion is handled by the library
and stylesheet; test the preference and do not add a CSS override that restarts
skeleton or mark animation. Loading-to-ready rearms enabled entrance animation;
ordinary hover/color updates should not force a remount.

## Visibility

```tsx
const [visible, setVisible] = useState<string[]>(["revenue", "conversion"]);
<Root config={config} visibleSeries={visible} onVisibleSeriesChange={setVisible}>
  {/* chart + Legend */}
</Root>;
```

See the complete [Combo example](../examples/controlled-combo.tsx).
Configured Line accepts visibility props directly and supports callback-only
uncontrolled visibility. On an explicit Root, a callback alone is invalid:
provide controlled `visibleSeries` or opt-in `defaultVisibleSeries`. Never pass
both controlled and default values.
Passing visibleSeries without a callback makes visibility read-only. Built-in
Legend owns native buttons and keyboard behavior; do not nest buttons inside
`Legend.children`, which composes noninteractive item content.

## Persistent focus is separate from visibility

Only when requested, use Root `interaction` with `kind`, `mode: "focus"`, and
`eligibleKeys`; pair controlled `selected` with `onSelectionChange`, or use
`defaultSelected`. Include hidden and zero-valued identities, exclude unavailable
or removed identities. For mark activation, explicitly opt into
`markActivation: "matching-legend"`. Hover emphasis is not persistent selection.
Category and Sankey node bindings require their own family contracts; Sankey
visibility and persistent Heatmap cell selection are not supported by this contract.

# Name the chart and expose its observations

Give each chart an informative accessible name with units/context; configured
Line requires `aria-label` or `aria-labelledby`. In explicit composition name the
host region/Root and preserve the native chart accessibility layer. Keep keyboard
access and native Legend button semantics when replacing visual content.

A tooltip, legend, or skeleton is not a complete accessible data alternative.
Supply a visible table or an equally complete nearby representation of the actual
observations, with caption, row/column headers, units, and missing-value text.
The examples include tables; avoid treating zero as absent (`value || "No data"`).

```tsx
// Good: distinguish an observation of zero from a missing observation.
<td>{row.revenue === null ? "No observation" : money(row.revenue)}</td>
// Bad: row.revenue || "No data"
```

When filtering, say what is hidden and keep the alternative's scope explicit.
A table may retain all observations while legend visibility only changes marks;
label that policy. Do not copy skeleton values into the table or announce old
rows as newly loaded data. Empty and error states need meaningful text.

Heatmap has native table semantics and `HeatmapDataTable`; Sankey offers
`SankeyTable`. Retrieve their family contracts before composing them. Names and
tables are necessary evidence, not a claim of full assistive-technology support.

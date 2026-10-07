# React and Next setup

Install `@kind-ui/charts` with the app's package manager. Released 0.3.0 requires
React/react-dom `^19.3.0`, Recharts `^3.10.1`, and Motion `^13.4.6`. Check the
installed manifest and lockfile before resolving peer conflicts. Motion is still
a required peer when `animate={false}`; disabling animation does not remove imports.

Import `@kind-ui/charts/styles.css` once at the app entry. In Next App Router,
put it in `app/layout.tsx`; keep the interactive chart in a client module:

```tsx
// app/layout.tsx (keep the existing layout markup)
import "@kind-ui/charts/styles.css";
```

```tsx
// app/revenue-chart.tsx
"use client";
import { ComboChart, BarSeries } from "@kind-ui/charts";
```

**Bad:** put hooks/event handlers in a Server Component, or pass config formatter
functions from a Server Component into a client component. **Good:** define config,
formatters, and interaction callbacks inside the client module; pass serializable
rows across the server/client boundary.

Configured Line supplies responsive sizing (set `height` deliberately). Explicit
composition needs finite parent dimensions: a `ResponsiveContainer` with a
percentage height inside an unsized parent cannot determine its chart height.
Do not add Tailwind, icon packs, or another stylesheet system just to use charts.

# Verify what the consumer will receive

1. Typecheck actual imports against the installed package, using the app's strict
   settings. For portable examples check both NodeNext and Bundler; do not reach
   into source to make an unsupported prop compile. Build the actual framework app
   to catch CSS exports and Next server/client serialization boundaries.
2. Exercise zero, null, empty, error, loading-to-ready, reordered categories, and
   narrow containers. Match domains/units and data alternatives to these cases.
3. In a browser, toggle every legend item by keyboard, inspect focus and tooltip
   dismissal, and confirm controlled state updates. Test the last-visible guard
   and external resets instead of assuming any empty state is impossible.
4. Emulate reduced motion and inspect both loading and ready states; test each
   supported theme and finite chart height. Separate visual checks from type checks.
5. Report commands, versions, and observed results. An example compiling does not
   prove Next hydration, screen-reader behavior, browser interactions, or contrast.

For maintaining this skill, run `node --test skills/kind-ui-charts/evals/contract.test.mjs`.
Keep realistic request prompts in [requests.json](../evals/requests.json); compare
fresh agents using this skill and a pre-change snapshot, then inspect their actual
code against released declarations. Do not put expected answers into agent prompts
or write to a live application during evaluations.

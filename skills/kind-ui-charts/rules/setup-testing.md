# React and Next setup

Install `@kind-ui/charts` with the app's package manager. Released 0.3.0 requires
React/react-dom `^19.3.0`, Recharts `^3.10.1`, and Motion `^13.4.6`. Check the
installed manifest and lockfile before resolving peer conflicts. Motion is still
a required peer when `animate={false}`; disabling animation does not remove imports.

Use Tailwind CSS v4 and register the package in your application CSS. Paths are
relative to the CSS file:

```css
@import "tailwindcss";
@source "../node_modules/@kind-ui/charts/dist";
```

Import that CSS at the app entry or Next.js root layout. Keep interactive charts
in a client module:

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
Tailwind v4 is required; icon packs are optional.

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

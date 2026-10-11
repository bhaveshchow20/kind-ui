# React and Next setup

Install `@kind-ui/charts` with the app’s package manager. Inspect its manifest
and lockfile for peer versions. Motion remains required with `animate={false}`.

Build Tailwind v4 CSS with the app’s Vite or PostCSS integration and scan the
installed package. The source path is relative to the CSS file:

```css
@import "tailwindcss";
@source "../node_modules/@kind-ui/charts/dist";
```

Import your built CSS once at the app entry. In Next App Router, use the root
layout for CSS and a client module for interactive charts:

```tsx
"use client";
import { ComboChart } from "@kind-ui/charts";
```

**Bad:** put hooks/event handlers in a Server Component, or pass config formatter
functions from a Server Component into a client component. **Good:** define config,
formatters, and interaction callbacks inside the client module; pass serializable
rows across the server/client boundary.

Chart families supply responsive sizing. Set `height` deliberately; percentage
height requires a measurable parent. Use explicit fixed dimensions when
`responsive={false}`.
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

# Radar and radial recipes

Open `/polar.html` after `npm run dev:chart`.

The six recipes in `polar-recipes.tsx` consume only `@kind-ui/charts` and public Recharts composition. Comparison, outline and range radar use a categorical angle axis and numeric radius axis. Grouped rings, stacked arcs and the gauge use a numeric angle axis with an explicit domain and a categorical radius axis. Stacked values use a shared stackId; the half-circle gauge shows one category with a 0–100 domain.

Use the shared series legend to control visibility. Data controls demonstrate zero actual values, empty data and updates while keeping the mounted chart. Motion enables the component's geometry-preserving opacity entrance and shared tooltip movement; reduced motion is respected. Entrance replays on a fresh chart mount, not on every data edit or mode toggle. Each card has an accessible chart name, keyboard instructions and a value table.

This is a bounded core polar showcase. There are no local renderer, tooltip or legend copies and no material controls. The isolated tarball fixture and `packed-polar.spec.ts` verify the exported implementation independently from recipes.

# Kind UI

A private, experimental TypeScript workspace for a family of independently useful UI libraries, starting with charts. Kind UI is the selected umbrella name, with intended packages under `@kind-ui/*` and a `kind-ui` CLI. Every workspace package remains private; nothing is published to npm or deployed. npm scope ownership has not been verified. This scaffold targets the private repository `bhaveshchow20/kind-ui` for draft review.

The intended product is a complete developer experience: maintained runtime libraries, useful default UI, editable application compositions, and documentation that exercises the same public APIs. Fumadocs' layered ecosystem and TanStack's domain-focused libraries are architectural references, not code templates to copy.

The implemented foundation is deliberately narrow: one line chart, its linked exact-value table, a Vite example, and a small local CLI that copies one optional recipe. This is a starting point for that ecosystem, not a mature component catalog or documentation platform.

## Try it locally

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Try selecting a point or row, switching gap/zero missing-value policy, changing theme, and reversing the input order.

```sh
npm run check        # lint, types, tests, library/example builds, packed consumer
npm test            # chart and CLI regression tests (builds packages first)
npm run build       # ESM + declarations, then the Vite example
npm run package:check # after build: verify local tarballs, isolated consumer + CLI recipe
```

Package output goes into each package's `dist/`; the example build goes into `examples/react/dist/`. `npm run dev` builds library packages once. While editing library source, run `npm run dev:packages` in a second terminal so TypeScript refreshes those outputs automatically and Vite can reload them.

## Package boundaries

- [`@kind-ui/charts-core`](packages/charts-core): React-free chart normalization, semantic metadata, domains, and pure line geometry; uses granular `d3-scale` and `d3-shape`
- [`@kind-ui/charts`](packages/charts): the React 19 product entry point: SVG `LineChart`, native `DataTable`, paint-only tokens, controlled selection, and re-exported normalization/semantic types
- [`@kind-ui/cli`](packages/cli): a local `kind-ui` command with bundled, versioned recipes; no network registry or automatic dependency installation
- `examples/react`: private Vite example exercising the public package exports

`charts-core` is specific to charts. It is not a universal platform core for future libraries. The React package offers one convenient consumer import, while a headless consumer can use `charts-core` independently. The CLI is optional; direct runtime imports need no generated files or CLI configuration.

Future libraries may share naming, documentation, testing, and release conventions. They do not need a shared runtime until a real use case demonstrates one. See the [ecosystem decision and phased benchmark](docs/decisions/0003-ecosystem-and-cli.md).

## Small public API

```tsx
import { DataTable, LineChart, normalizeSeries } from '@kind-ui/charts';
import { useState } from 'react';

const model = normalizeSeries(
  [
    { id: 'jan', label: 'January', x: 1, y: 8 },
    { id: 'feb', label: 'February', x: 2, y: null },
    { id: 'mar', label: 'March', x: 3, y: 12 },
  ],
  {
    missing: 'gap',
    x: { kind: 'number', unit: null },
    y: { unit: 'kWh' },
  },
);

function Energy() {
  const [selectedId, onSelectionChange] = useState<string | null>(null);
  return <>
    <LineChart model={model} title="Monthly energy" selectedId={selectedId} onSelectionChange={onSelectionChange} />
    <DataTable model={model} caption="Exact energy values" selectedId={selectedId} onSelectionChange={onSelectionChange} />
  </>;
}
```

For a read-only view, omit both selection props. To update data, create a new normalized model; memoize it with React's `useMemo` when necessary. Models are immutable snapshots.

## Optional editable recipes

Use the maintained `@kind-ui/charts` package directly, or ask the local CLI to copy a small application composition into your project. The bundled `charts/line` recipe produces `src/components/ui/charts/line-chart-demo.tsx` by default. It wraps the maintained runtime; it does not copy normalization, geometry, or chart internals.

The command contract is:

```text
kind-ui init [--cwd <dir>] [--dry-run]
kind-ui add charts/line [--cwd <dir>] [--dry-run]
```

To run the actual local build from this workspace, target an existing React 19 + TypeScript project containing `package.json`:

```sh
npm run build:packages
node packages/cli/dist/bin.js init --cwd /absolute/path/to/your-react-project --dry-run
node packages/cli/dist/bin.js init --cwd /absolute/path/to/your-react-project
node packages/cli/dist/bin.js add charts/line --cwd /absolute/path/to/your-react-project --dry-run
node packages/cli/dist/bin.js add charts/line --cwd /absolute/path/to/your-react-project
```

`init` creates `kind-ui.json` with `schemaVersion: 1`, `framework: "react"`, and `recipesDir: "src/components/ui"`. `add` requires that configuration. Both commands support a no-write preview; they do not detect or create an app framework.

`add` also creates `kind-ui/recipes/charts-line.json`, recording the recipe version, runtime requirement, generated source path, and its original SHA-256 hash. Keep this receipt with the copied source. Existing files are never overwritten: a matching receipt lets reruns preserve your edits, while an untracked file with different contents is refused. A deleted source file can be regenerated with the matching receipt. A changed recipe version or configured destination is refused because upgrades and moves are not implemented. Unsafe relative paths and symlinks within project file paths are rejected. See the [CLI README](packages/cli/README.md) for the full behavior.

Copied recipe source belongs to the consumer to edit. Runtime fixes arrive through an intentional runtime dependency update; copied compositions do not automatically change with that update. There is no command that merges new recipe versions into edited files.

This project’s packages are unpublished and npm scope ownership is unverified: do not use `npm install @kind-ui/charts` or `npx @kind-ui/cli` to install this scaffold. After `npm run build:packages`, `npm run package:check` uses [`scripts/check-packages.mjs`](scripts/check-packages.mjs) to build an isolated consumer from local tarballs, exercise the packed CLI, and verify the generated recipe against the packed runtime. The tarballs are local verification artifacts in `artifacts/`. The CLI itself never runs an installer, changes dependency versions, or contacts a service; consumers must supply the documented React/runtime dependencies.

## Semantic guarantees

- IDs are caller-owned nonempty strings and unique per model. Input is sorted by x then ID without mutation; selection survives reordering
- `null` and `undefined` are missing. Choose `gap`, `zero`, or `reject` explicitly. NaN and infinities are rejected; domain ranges below `1e-300` or overflowing finite arithmetic are rejected before D3 tick generation
- Zero imputation happens before domain calculation. `[8, null, 12]` with `zero` resolves to `[0, 12]`, retaining `rawY: null` and `imputed: true`
- Automatic domains use actual finite values without integer rounding. Constant numeric domains expand by max(1, 1% of the absolute value); constant time domains expand by 12 hours each side
- Empty/all-missing numeric domains fall back to `[0, 1]`. Explicit domains must be finite/increasing and contain all observed and imputed values. This scaffold rejects clipping rather than silently hiding outliers
- Units are required metadata (`null` means unitless); the library labels them but performs no unit conversion
- Time x values are integer epoch milliseconds, with an explicit IANA display timezone. Positions and ticks use UTC instants; timezone affects labels only. Dates outside years 0001–9999 use numeric epoch ticks to avoid unsafe calendar interval overflow. The table preserves exact UTC ISO timestamps. No calendar aggregation or date-string parsing is implied
- Theme changes only paint; it cannot change geometry, domains, missing policy, or values
- Selection belongs to the application. Both views emit stable IDs to the same callback; there is no second internal store. The owner decides how to clear selection if filtering removes a row

## Accessibility and limitations

SVG has a title/description; interactive points support Enter, Space, and Escape. The companion native table exposes exact source values, visibly marks imputation, and provides ordinary HTML selection buttons. These are useful foundations, not a WCAG conformance claim. Screen-reader, touch-target, contrast, and narrow-container testing still need dedicated production validation.

Logical SVG width/height are explicit and the viewBox scales to its container. Automatic label measurement, collision avoidance, responsive font size, large-data virtualization, tooltips, animation, aggregation, multiple series, Canvas, and additional chart types are out of scope for this draft. Fixed margins can need adjustment for long labels; don't treat this as a polished production chart library yet.

ESM only; React 19 only. No CommonJS or legacy-browser compatibility claim. No app framework, AI service, telemetry, database, network recipe registry, or chart-type registry is bundled. The CLI does not create a whole application, install dependencies, migrate recipes, or promise compatibility with every React framework.

## Design and provenance

See [chart architecture](docs/decisions/0001-boundaries.md), [packaging decisions](docs/decisions/0002-tooling-and-packages.md), [ecosystem and CLI direction](docs/decisions/0003-ecosystem-and-cli.md), [source research](docs/research.md), and [contributing](CONTRIBUTING.md).

All implementation here is original. Referenced libraries informed boundaries and verification practices; source code was not copied. Their licenses remain with their dependencies. MIT © 2026 Bhavesh Chowdhury.

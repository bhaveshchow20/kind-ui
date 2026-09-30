# @kind-ui/charts-core

Private, experimental ESM package for React-free chart semantics and geometry. This is a chart-specific core, not a generic platform core for future UI families. This Kind UI package is not published; npm scope ownership is unverified.

- `normalizeSeries(input, options)` validates IDs/numbers, preserves missingness and unit/time metadata, and resolves domains
- `createLineGeometry(model, size, insets?)` returns a path, positioned points, plot bounds, and ticks using granular D3 algorithms
- Exported TypeScript types describe the semantic and geometric contracts

No React, DOM access, theme, selection state, global registry, or unit conversion is included. React applications can import normalization and common semantic types from `@kind-ui/charts` alongside the maintained views. Headless consumers can use this package independently.

Stable caller-owned IDs, explicit missing policy, preserved raw values, finite non-clipping domains, UTC positions with declared time-label timezone, and immutable snapshots are deliberate API guarantees. See the workspace root README for their exact edge-case policies and limits.

Packed exports/declarations are checked in an isolated TypeScript/Node consumer. Local tarballs are verification artifacts; registry installation and publication are not available in this scaffold. Original implementation is MIT © 2026 Bhavesh Chowdhury.

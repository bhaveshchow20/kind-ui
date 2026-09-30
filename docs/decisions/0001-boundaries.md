# ADR 0001: Chart semantic core, small React product

Status: accepted for the scaffold, 2026-09-30

## Context

The goal is a UI-library family whose chart package remains useful beyond attractive examples. Missingness, scale domains, exact values, and identity must survive design and theme changes. One tested vertical slice is more valuable than an unverified catalog.

## Decision

Keep two chart-runtime package boundaries: `@kind-ui/charts-core` owns immutable normalization and separate numeric geometry; `@kind-ui/charts` owns SVG/HTML rendering, accessible controls, and paint tokens. The React entry point also re-exports normalization and semantic types for one-package consumer ergonomics. The application owns selection. A line chart plus an exact-value table prove that those views share one semantic snapshot and one controlled selection.

Normalization requires stable business IDs, missing policy, and unit/time metadata. It preserves original missingness when zero is explicitly imputed. Domains resolve after that policy. Geometry consumes the resolved model and dimensions without seeing a theme. Explicit domains that hide source values are rejected in this first version. No duplicate hidden domain resolution occurs in the adapter.

Depend directly on `d3-scale` and `d3-shape` instead of reimplementing tick/path algorithms or importing all of D3. Keep them behind our narrow geometry function; do not expose a public backend/plugin protocol prematurely.

## Evidence and tradeoffs

TanStack Charts separates framework definitions from hosts; visx combines modular D3 math with React rendering; D3's line `defined` accessor encodes gaps; Recharts documents keyboard accessibility as a first-class concern. Those are useful patterns, not APIs to reproduce wholesale. See [research](../research.md).

Two chart-runtime packages impose local build ordering, but enforce an importable React-free core and expose packaging mistakes early. The optional recipe CLI added in [ADR 0003](0003-ecosystem-and-cli.md) is a distribution tool, not another chart-runtime layer. Frozen normalized snapshots allocate memory and must be replaced when input changes; this is acceptable for a small-data scaffold and makes memoization semantics explicit.

## Deferred

No plugins, renderer registry, universal data frame, aggregation engine, animation runtime, AI backend, or unrelated UI components. Revisit extra runtime packages only when a second real consumer demonstrates a boundary. Ecosystem-level documentation, optional compositions, and CLI ownership are covered by [ADR 0003](0003-ecosystem-and-cli.md). Multi-series charts, formatters, custom marks, and dense-data selection require separate design work and benchmarks.

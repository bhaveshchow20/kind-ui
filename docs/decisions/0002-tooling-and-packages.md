# ADR 0002: Boring tools and actual package-consumer checks

Status: accepted for the scaffold, 2026-09-30

## Decision

Use npm workspaces and a committed lockfile, TypeScript 5.9 in strict mode, Vite 7 for the example, Vitest 4 plus Testing Library for tests, and Biome for lint/format. Pin direct tooling dependencies. Node 22.12+ is the floor; CI exercises Node 22 and 24.

These versions were verified against the npm registry during setup. The choice intentionally avoids a TypeScript major migration during scaffolding. No Nx/Turborepo task graph is necessary for two small chart libraries, one local CLI, and one example; ordinary scripts are sufficient.

Build libraries with `tsc` project references to preserve readable ESM modules and declarations. Import/export paths include `.js`; `exports` specifies the supported entry point. React stays a peer and D3 modules remain dependencies, allowing application bundlers to tree-shake. Both chart libraries declare `sideEffects: false` and import no global CSS. `@kind-ui/charts` re-exports normalization and semantic types from `@kind-ui/charts-core`, while the CLI bundles its recipe assets and exposes the `kind-ui` binary.

`package:check` checks allowlisted packed files and a 40 kB per-package packed-size guard, installs actual tarballs outside workspace package resolution, then typechecks and executes an ESM/React SSR consumer. It includes the CLI binary and bundled recipe in the packed-file contract, runs the CLI in the consumer, and checks the generated TSX against the packed runtime. The size guard is a regression tripwire for scaffold contents, not a browser bundle-performance claim. CI also builds the example from public exports.

## Release safety

Every package is private, there is no publish/deploy workflow, and this draft does not publish npm artifacts. Local tarballs are verification artifacts only. Kind UI is the chosen name, but `@kind-ui/*` scope ownership is unverified and this project has not published packages; package checks intentionally supply local tarballs instead of assuming those names exist on npm. A future release needs a confirmed npm namespace, package/version policy, changesets or equivalent release notes, a broader compatibility matrix, security/dependency review, and explicit authorization to publish. MIT copyright is Bhavesh Chowdhury; architecture research is credited without vendoring upstream code.

See [ADR 0003](0003-ecosystem-and-cli.md) for the distinction between maintained runtime code and consumer-owned recipes, plus the phased ecosystem benchmark.

## Tradeoffs

ESM-only keeps packaging small and honest; CommonJS is not promised. React 19 is the sole peer range tested. Fixed examples and unit tests do not replace browser, screen-reader, performance, hydration, or framework-specific validation. CI runs checks only and uses read-only repository permissions.

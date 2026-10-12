# Package compatibility checks

The package gate validates the retained `@kind-ui/charts` tarball. The framework
gate installs that same artifact in two isolated consumers, verifies its SHA-256
before and after the checks, and never repacks it. These representative rows are
explicit selections in `scripts/compatibility-matrix.mjs`, independent of the
workspace's development dependencies.

| Pin | `peer-floor` | `selected-stable` |
| --- | --- | --- |
| React / React DOM / React Is | 19.3.0 | 19.3.0 |
| Motion / Framer Motion | 13.4.6 | 13.5.1 |
| Motion DOM | 13.4.5 | 13.5.1 |
| Motion Utils | 13.3.0 | 13.5.0 |
| Recharts | 3.10.1 | 3.10.1 |
| Tailwind CSS and its Vite, PostCSS, Node and Oxide packages | 4.0.0 | 4.3.3 |
| Vite | 6.4.4 | 8.3.1 |
| Next App Router | 16.3.8 | 16.3.8 |
| Lucide React | 1.50.0 | 1.50.0 |
| TypeScript | 5.9.3 | 5.9.3 |
| React / React DOM type packages | 19.3.0 | 19.3.0 |
| Node type package | 22.20.4 | 22.20.4 |

The floor row deliberately selects the minimum of every declared package peer
range, including Tailwind 4.0.0. Tailwind 4.0.0's Vite plugin declares support for
Vite 5/6, so that row uses Vite 6.4.4. The selected row checks newer stable Motion
and Tailwind versions inside the declared ranges with Vite 8.3.1. Each row uses
its own installed compiler and plugins. Matching Node/Oxide and Framer Motion
overrides prevent their transitive ranges from replacing the intended floor.
Motion DOM and Motion Utils are also installed and overridden at their explicit
row pins: the floor uses the runtime versions selected in the workspace lockfile,
and the selected row uses Framer Motion 13.5.1's exact dependency versions.

The npm registry metadata was checked on 2026-10-11 with `npm view` for the exact
pins and peer ranges. React 19.3.0 and Recharts 3.10.1 were the newest stable
releases inside their declared ranges; no separate newer combination existed for
those peers. Motion 13.5.1 was the newest stable release in `^13.4.6`; Motion
14.1.0 was outside that range. These pins do not automatically track future
releases. Updating a declared floor requires updating the matrix and rerunning
its checks.

## What each row checks

`npm run check:line-integrations` requires the receipt and tarball prepared by
`npm run pack:artifact`. It installs all direct pins exactly, rejects workspace
links, checks the resolved package versions and runs `npm ls --all`. The
production consumers then check:

- ESM import and public declarations in strict NodeNext and Bundler modes with
  `skipLibCheck=false`.
- A Vite production build with consumer source registration and named Lucide
  icon tree-shaking.
- A Next App Router production static export, named package client boundaries,
  serializable server props and SSR chart shell/content.

The declaration checks retain the existing `exactOptionalPropertyTypes=false`
exception for Recharts/Redux Toolkit dependency declarations. Owned sources and
the package gate's focused negative consumer check exact optional properties
separately. Next's framework-generated types use its existing build settings;
the separate strict declaration checks run before that build.

`npm run test:line-integrations` runs the existing integration browser suite
against both rows' prepared production outputs. Each row checks hydration without
console errors, scoped pattern/gradient identities, legend interactions and the
last-visible-series guard. Vite and Next both check semantic/local themes,
consumer utility overrides, inline styles and theme changes. `npm run check`
includes the builds and browsers; CI prepares each build once and distributes
the outputs across the existing browser shards.

## Evidence and scope

The floor row reuses the existing `artifacts/packed-line-integrations` and
`artifacts/packed-line-next` outputs and
`artifacts/line-integrations/evidence.json`. The selected row writes
`artifacts/packed-compatibility-selected-vite` and
`artifacts/packed-compatibility-selected-next`.
`artifacts/line-integrations/compatibility-evidence.json` records the same tarball
checksum, resolved exact versions and completed build checks for both rows. Each
row's `*-npm-ls.json` records its dependency tree; Next build logs remain in the
same ignored evidence directory. A build receipt is not evidence that the
separate browser checks passed: require successful aggregate completion checks.

This small matrix is not a Cartesian test of all versions in the peer ranges.
It does not establish CommonJS support, other framework versions, other browser
engines or untested peer combinations. Public examples are available at
[Charts](https://kindui.dev/charts/) and the
[Charts documentation](https://kindui.dev/charts/docs/).

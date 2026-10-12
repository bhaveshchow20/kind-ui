# Charts release verification

Kind charts ship as one ESM package with explicit named exports and Tailwind v4
component classes. The monorepo workspace stays private. npm owns reusable chart
behavior, composition, interaction, accessibility and restrained defaults;
host applications own palettes, typography, framing and dashboard presentation.
Consumers own data, axes, application state and layout.

## Package contract

`@kind-ui/charts` exposes its runtime and declarations through the root export.
Consumers build Tailwind v4 CSS with an `@source` path to the installed package’s
`dist` directory, relative to their CSS file. There is no stylesheet export.
The files allowlist includes compiled JavaScript, declarations and changelog; npm also includes the package README, manifest and MIT
license. `clsx` and `tailwind-merge` combine component and consumer classes.
No development tools are runtime dependencies.

React and React DOM are host peers. Recharts and Motion remain required engine
peers, preserving native composition identity. Disabling animation does not
remove Motion imports. Current declared ranges begin at the tested floors:
React/DOM 19.3.0, Recharts 3.10.1 and Motion 13.4.6. The package gate pins those
versions plus React-is 19.3.0, TypeScript 5.9.3 and React/DOM types 19.3.0. The separate [compatibility matrix](compatibility.md) also checks the declared
Tailwind 4.0.0 minimum and a selected newer stable row without widening peers. Matching
React-is belongs to the host because Recharts requires it.

An ordinary npm host installs Kind without separately declaring engines; the
gate records the actual automatically resolved versions and checks its component
and strict type contracts. Host settings and existing peer conflicts can change
installation. Yarn hosts must supply peers; strict Yarn PnP support is not claimed.

## Required checks

`npm run check` checks lint, release/CI guards, component tests, an actual packed
package in isolated consumers, strict NodeNext/Bundler declarations and Chromium
interaction contracts. Packed consumers verify ESM imports, Tailwind class generation, license, public
exports, production builds and native composition. Primitive-only imports exclude
Kind interaction/Motion runtime and stay within the native bundle delta budget.
[Production JS/CSS budgets](bundle-measurements.md) additionally measure compressed
compound Cartesian, polar, Heatmap and Sankey consumers, retained modules and the
utilities emitted by package-wide Tailwind source scanning.

Both pinned framework rows check Vite builds and Next App Router production static exports,
SSR shell/content, Tailwind v4 overrides and named Lucide icons using the retained
tarball. Browser checks cover hydration, themes and legend interaction for both rows. These are bounded
consumer proofs, not blanket guarantees for every chart/router/framework. Next's
standard application declaration settings are separate from the strict package
declaration gate. CommonJS, React 18 and Motion 14 are not advertised support.

An SSR chart shell may omit marks until client layout. Provide a host-owned data
alternative. Manual screen-reader coverage remains separate from automated
keyboard, accessibility attributes and reduced-motion tests.

## Retained artifact and publication evidence

`npm run check` retains the validated tarball in `artifacts/package/` and its
`artifacts/package/validated-artifact.json` receipt. Use the receipt’s `filename`
field to identify the retained tarball. The receipt identifies source cleanliness,
checksum, npm integrity, tool versions and consumer versions. GitHub runs additionally
identify the run and attempt. The package receipt alone proves the package gate;
record the aggregate result alongside it.

CI prepares and uploads the validated package/build candidate once on Node 22, then tests those exact consumer builds in four browser shards. Require the `All checks` completion check before treating the candidate as fully validated.
The release verifier rejects dirty sources, mismatched runs/attempts/checksums and
integration evidence from different bytes. Publish the selected tested tarball
with lifecycle scripts disabled. Never rebuild during publication. A package
README, manifest, version or source change requires a fresh tested artifact.

After publication, compare registry `dist.integrity`, install the exact version
in a fresh consumer, run strict types and render LineChart with consumer-built Tailwind CSS.
Keep the outputs and browser evidence with the candidate receipt. Package metadata
or a successful local tarball install does not prove public registry availability.

See [the release handoff](../.changeset/README.md) for Changesets version PRs,
authentication boundaries and retry rules. Support/security routes are documented
in [SECURITY.md](../SECURITY.md). Credentials, persistent GitHub permissions and npm
trusted-publisher changes require separate approval.

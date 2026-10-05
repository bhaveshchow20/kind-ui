# Charts release verification

Kind charts ship as one ESM package with explicit named exports and an opt-in
stylesheet. The monorepo workspace stays private. npm owns reusable chart
behavior, composition, interaction, accessibility and restrained defaults;
registry recipes own palettes, typography, framing and dashboard presentation.
Consumers own data, axes, application state and layout.

## Package contract

`@kind-ui/charts` exposes its runtime and declarations through the root export,
and `@kind-ui/charts/styles.css` through a separate CSS export. CSS is marked as
side-effectful. The files allowlist includes compiled JavaScript, declarations,
stylesheet and changelog; npm also includes the package README, manifest and MIT
license. No development tools are runtime dependencies.

React and React DOM are host peers. Recharts and Motion remain required engine
peers, preserving native composition identity. Disabling animation does not
remove Motion imports. Current compatible ranges begin at the tested floors:
React/DOM 19.3.0, Recharts 3.10.1 and Motion 13.4.6. The package gate pins those
versions plus React-is 19.3.0, TypeScript 5.9.3 and React/DOM types 19.3.0. Matching
React-is belongs to the host because Recharts requires it.

An ordinary npm host installs Kind without separately declaring engines; the
gate records the actual automatically resolved versions and checks its component
and strict type contracts. Host settings and existing peer conflicts can change
installation. Yarn hosts must supply peers; strict Yarn PnP support is not claimed.

## Required checks

`npm run check` checks lint, release/CI guards, component tests, an actual packed
package in isolated consumers, strict NodeNext/Bundler declarations and Chromium
interaction contracts. Packed consumers verify ESM imports, CSS, license, public
exports, production builds and native composition. Primitive-only imports exclude
Kind interaction/Motion runtime and stay within the existing native bundle budget.

The existing integration gate checks a Next App Router production static export,
SSR shell/content, Tailwind v4 overrides and named Lucide icons using the retained
tarball. Browser checks cover hydration and legend interaction. These are bounded
consumer proofs, not blanket guarantees for every chart/router/framework. Next's
standard application declaration settings are separate from the strict package
declaration gate. CommonJS, React 18 and Motion 14 are not advertised support.

An SSR chart shell may omit marks until client layout. Provide a host-owned data
alternative. Manual screen-reader coverage remains separate from automated
keyboard, accessibility attributes and reduced-motion tests.

## Retained artifact and publication evidence

`npm run check` retains `artifacts/package/kind-ui-charts-0.1.1.tgz` and its
`validated-artifact.json`. The receipt identifies source cleanliness, checksum,
npm integrity, tool versions and consumer versions. GitHub runs additionally
identify the run and attempt. The package receipt alone proves the package gate;
record the aggregate result alongside it.

CI uploads successful candidates only after the full Node 22/24 aggregate passes.
The release verifier rejects dirty sources, mismatched runs/attempts/checksums and
integration evidence from different bytes. Publish the selected tested tarball
with lifecycle scripts disabled. Never rebuild during publication. A package
README, manifest, version or source change requires a fresh tested artifact.

After publication, compare registry `dist.integrity`, install the exact version
in a fresh consumer, run strict types and render LineChart with its stylesheet.
Keep the outputs and browser evidence with the candidate receipt. Package metadata
or a successful local tarball install does not prove public registry availability.

See [the release handoff](../.changeset/README.md) for Changesets version PRs,
authentication boundaries and retry rules. Support/security routes are documented
in [SECURITY.md](../SECURITY.md). Credentials, persistent GitHub permissions and npm
trusted-publisher changes require separate approval.

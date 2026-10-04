# First charts release readiness

This is a proposal and validation change. `@kind-ui/charts` and the workspace
remain private at `0.0.0`. There is no publishing workflow, OIDC permission,
release tag, GitHub Release, account setup or publication authorization.
Audited main: `68ce9ad10d617faae3f08c562cb2768035167ee3`.

## Distribution and ecosystem evidence

Ship one ESM npm package with explicit named exports and one opt-in stylesheet.
Keep the current API, React client boundary and native Recharts composition.
Do not add CommonJS, a CLI, registry, adapter or second package for launch.

| Official reference | Useful practice | Kind decision |
| --- | --- | --- |
| [Recharts manifest](https://github.com/recharts/recharts/blob/main/package.json) | Host React/DOM/React-is peers; built distribution and source metadata | Preserve shared engine identity. Upstream broad React support does not prove Kind support. |
| [Motion installation](https://motion.dev/docs/react-installation) | `motion/react` integration and explicit App Router boundary | Keep the integrated engine required, including when animation is disabled. |
| [shadcn charts](https://ui.shadcn.com/docs/components/chart), [EvilCharts](https://evilcharts.com/) | Application-owned components and animated chart examples | Source-copy distribution is a different maintenance contract. Keep installed-package guarantees. EvilCharts' site alone does not establish its release/dependency policy. |
| [Radix Dialog manifest](https://github.com/radix-ui/primitives/blob/main/packages/react/dialog/package.json) | React peers, package-owned runtime dependencies, repository directory/issue metadata | Add truthful npm metadata; use peers where host/runtime identity is shared. |
| [Lucide React manifest](https://github.com/lucide-icons/lucide/blob/main/packages/lucide-react/package.json) | Explicit files and tree-shaking metadata | Keep CSS side effects; do not copy `sideEffects: false` onto a package with a stylesheet. |

These comparisons inform packaging decisions, not compatibility claims.

## Dependencies and supported environments

This PR preserves peers while testing the actual installation experience; it
does not treat today's manifest as the final distribution decision.
React/React DOM are host runtimes and should remain peers. Recharts supplies
geometry/state/native composition identity; Motion supplies the integrated
animation engine. Disabling animation does not remove static Motion imports.

| Choice | Setup and version control | Identity and public type consequences |
| --- | --- | --- |
| Required engine peers | Host chooses versions; npm and default pnpm can install them automatically. Yarn hosts must supply them. | A shared Recharts instance supports mixed native/Kind parts and hooks. Motion providers can share host context. Engine types require the peer to resolve. |
| Package-owned engine dependencies | Kind installs/selects engine versions for the normal consumer across managers. React/DOM remain host peers. | All parts reexported by Kind use its resolved engine. A separate host Recharts/Motion version may be a second instance: mixed chart registration/context or Motion provider settings cannot be assumed to work. Declarations referencing those engines still resolve through Kind's installed dependencies; ownership does not erase their public types. |
| Owned Motion, peer Recharts | Removes one portable setup burden while preserving the current native-engine interoperability contract. | Low-risk first ownership change: Kind already owns animation through props. Raw Recharts extension paths remain host-owned. |

Recommendation for the requested portable, Kind-owned setup: aim for package-owned
Motion and Recharts, plus a matching React-is dependency for the supported React
19 host, with React/DOM as peers. Start engine ownership at the exact tested
`motion@13.4.6`, `recharts@3.10.1`, `react-is@19.3.0`; broaden owned ranges only after
testing updates. Keep native axes, shapes and hooks consumed through Kind's
existing public reexports so the default path has one engine instance and one
library import. This requires a separate reviewed dependency PR, not relocation
in this head. That PR must exercise hosts with no engines and with a different
pre-existing engine, declaration resolution, bundle deduplication and the existing
raw Recharts escape hatches (notably Sankey's native Tooltip). If shared identity
cannot be preserved for those documented paths, ship the concrete intermediate
choice: own Motion, keep Recharts peer, and document the native-extension setup.
Do not silently break existing composition in pursuit of a one-install promise.

[npm 7+ installs peers by default](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#peerdependencies).
[pnpm's autoInstallPeers defaults to true](https://pnpm.io/settings/peer-dependencies),
but conflicts can leave a peer unresolved and hosts can disable it; default
pnpm warns, while `strictPeerDependencies` controls command failure.
[Yarn peers are inherited from the ancestor](https://yarnpkg.com/configuration/manifest#peerDependencies);
its documented peer-with-default option is not a cross-manager guarantee.
Only npm 11.9 is exercised here; pnpm/Yarn behavior is sourced, not a tested
support promise. The ordinary-host gate installs Kind alone into a React/DOM host
without declared engines, records what npm resolves and runs public component
tests and strict NodeNext/Bundler types. The fully pinned consumer remains a
separate reproducibility gate. A single npm install can therefore work with today's
peer manifest; do not present the long pinned command as mandatory user setup.

The package gate pins React/DOM/React-is `19.3.0`, Recharts `3.10.1`, Motion
`13.4.6`, TypeScript `5.9.3` and React/DOM types `19.3.0`. Current ranges start at
these tested floors and allow same-major updates. They are not proof of every
permitted combination. Before publication, verify current registry versions and
repeat gates on the actual resolved tuple. Retain the floors unless new evidence
justifies widening them. Do not promise React 18, older Recharts or other Motion
majors based on upstream support alone. React-is is an upstream Recharts peer;
install it at the host React version rather than allowing a different major.
It is pinned in consumers, not imported by Kind itself.

Read-only registry research on 2026-10-04 found React `19.3.0`, Recharts
`3.10.1` and Motion's latest dist-tag at `14.0.0`. The current peer range excludes
Motion 14; do not claim that major as compatible without testing it. The ordinary
npm host resolved Motion `13.5.1` within the current peer range; its component and
strict type checks pass, while the full browser fixture remains pinned at `13.4.6`.
Those pinned engines and
React declare MIT; Kind's packed MIT license matches the repository. Public
`npm view @kind-ui/charts` returned E404: no publicly readable package was found,
which is not proof of namespace ownership or name reservation. Those reads are
completed research; only ownership/maintainer proof requires the owner.

Plain CSS needs no Tailwind compiler. Existing Tailwind `4.3.3` fixtures verify
overrides, and named Lucide React `1.50.0` imports use the decorative icon slot.
The build gate permits one or two icon modules; the recorded run retained the
selected `trending-up` module alone, and the browser checks one decorative icon.
Neither is a package peer. Native
React SVG components fit `SeriesConfig.icon`; no universal icon/Tailwind v3 claim.

The root entry retains `"use client"`. The existing pinned Next `16.3.8` consumer tests
a server page supplying serializable props, and a client component owning state,
callbacks and a Lucide icon. It uses a production static export, verifies package
SSR shell/content and tests hydration/controlled legend interaction via localhost.
There is no `transpilePackages`, `ssr: false`, workspace link, copied library code,
deployment or external font fetch. Next is installed only in the temporary test
consumer. This is a representative configured line-chart
proof, not a guarantee for every chart/router/framework. An SSR chart shell may
omit marks until client layout. Supply an accessible host-owned data alternative.
See [Next's client-boundary rules](https://nextjs.org/docs/app/api-reference/directives/use-client).
The Next host uses strict application checks with the framework's standard
`lib: ["dom", "dom.iterable", "esnext"]` and `skipLibCheck: true` settings
([upstream defaults](https://github.com/vercel/next.js/blob/v16.3.8/packages/next/src/lib/typescript/writeConfigurationDefaults.ts)).
Next's own declarations need newer ambient types than ES2022/Node 22 types for
`PromiseWithResolvers` and `URLPattern`. The independent package gate still checks
Kind/Recharts/Motion declarations with `skipLibCheck: false` in both resolution
modes; this fixture does not claim strict checking of all Next internals.

## Artifact and GitHub gates

`npm run check` runs lint, public component tests, installed-package and browser
contracts, including existing integration build/hydration gates. The package gate checks required runtime/declaration
files, MIT license, README, ESM exports, CSS/side effects, strict NodeNext/Bundler
consumers, installed component tests and production bundles. Primitive-only
imports must exclude Kind/Motion runtime and stay within 100 bytes of native
Recharts. Keep those existing guarantees.

`npm run pack:artifact` retains the exact installed/tested tarball. Its receipt
includes SHA-256, npm integrity, actual checkout commit/dirty flag, separate PR
head/base commits, workflow run ID/attempt/URL, tool versions and exact consumer
pins. Local runs have null PR/workflow fields. SHA-512 is checked before installation and SHA-256 before retention.
The receipt describes only the package gate, not aggregate approval or a provenance
attestation. Dirty candidates are diagnostics, never publication evidence.
`check:line-integrations` requires that retained artifact, checks its checksum
before/after build tests and records Next/Tailwind/Lucide build evidence for the
same digest. `test:line-integrations` runs the separate browser contracts.

CI uploads the package and integration build evidence only after the full aggregate succeeds on each
Node 22/24 matrix job. Failed jobs may retain diagnostic screenshots but cannot
upload a successful package candidate. Require clean source, independent review
and both Node jobs associated with the current PR head. GitHub pull-request
checkout tests the synthetic merge commit; keep that base integration proof and
record its actual checkout SHA separately from the PR head/base SHAs. Select one
artifact by run ID/attempt, checkout commit, PR head/base and SHA-256, then
verify its downloaded checksum. Never repack a directory at publication. Version,
manifest or source changes require building/installing/testing a fresh tarball.

The recurring native Radial sector hit-probe failure is an unresolved release
gate. Green retries alone do not explain it. Do not suppress it or infer a cause
from this packaging PR. Loading states are not added or claimed. `apps/docs`,
homepage work and draft editorial branches are outside this change.

## Proposed versioning and separately approved setup

Propose a reviewed `0.1.0` first version; the owner must choose version/dist-tag.
For pre-1.0, breaking APIs increment minor; compatible fixes increment patch.
Document this before users install. Follow the existing policy: adopt Changesets
in a separate approved setup PR using its standard CLI for reviewed version and
changelog changes. One package needs no custom version script, release bot or
multi-package orchestration layer. Do not invent release notes for a placeholder.

Prepare a version/changelog commit with publication still disabled. After approval,
use a protected GitHub-hosted publishing job with `contents: read`, job-scoped
`id-token: write`, pinned official checkout/setup-node actions and Node 24. Prefer
npm trusted publishing, which generates provenance for public packages from public
GitHub repositories. The package repository URL must match this repository. Keep
publishing identity out of PR validation and consume the exact validated tarball.

[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) requires npm
11.5.1+ and Node 22.14+; checked-in npm 11.9 meets that CLI requirement.
[Staged publishing](https://docs.npmjs.com/staged-publishing/) requires npm 11.15+
and can create a publicly visible `0.0.0-stage` placeholder for a new package.
It is not a dry run within current authorization. Selecting it requires a
reviewed npm upgrade and publication approval. Confirm the new-package/bootstrap
route with the owner: settings-based trusted publisher configuration does not
prove namespace ownership or that an unpublished package can already accept OIDC.
Do not create credentials or publish placeholders to unblock setup.

Remaining owner decisions and release gates:

1. Confirm npm `@kind-ui` ownership, name control and maintainers; the public registry lookup is already recorded above.
2. Approve package set, first version/dist-tag and tested support boundaries.
3. Establish a working private security-reporting route/support policy; SECURITY.md
   explicitly identifies this as unfinished.
4. Approve/adopt version/changelog tooling, bootstrap route, npm trusted publisher
   fields and protected release environment. Persistent account/access setup is
   outside this PR.
5. Resolve the Radial probe issue, review the recorded license findings, get independent
   review and pass aggregate/exact-head Node 22/24 checks on the versioned artifact.
6. Obtain explicit authorization for publication, tags/GitHub Releases and merges.
   Update docs to registry installs only after publication is verified.

## Expected install/import

For a compatible existing npm React/DOM host, ordinary local review after packing:

```sh
npm install /absolute/path/to/artifacts/package/kind-ui-charts-0.0.0.tgz
```

After an approved publication, the recommended npm user install in that host is
`npm install @kind-ui/charts@0.1.0` (future version, unavailable now). npm resolves
required peers automatically; package-manager settings and existing conflicts
can change the result. React/DOM and matching types belong to the host app.

The following fully pinned command is for reproducing the tested tuple:

```sh
npm install /absolute/path/to/artifacts/package/kind-ui-charts-0.0.0.tgz react@19.3.0 react-dom@19.3.0 react-is@19.3.0 recharts@3.10.1 motion@13.4.6
```

After an approved `0.1.0` publication, the expected registry form is:

```sh
npm install @kind-ui/charts@0.1.0 react@19.3.0 react-dom@19.3.0 react-is@19.3.0 recharts@3.10.1 motion@13.4.6
```

The registry command is a future example, not a currently available version.
TypeScript hosts also install matching React/DOM types. In a Next client component:

```tsx
"use client";

import { LineChart } from "@kind-ui/charts";
import "@kind-ui/charts/styles.css";

export function TasksChart() {
  return (
    <LineChart
      data={[{ day: "Mon", tasks: 0 }, { day: "Tue", tasks: 12 }]}
      config={{ tasks: { label: "Tasks", color: "#3659b8" } }}
      xDataKey="day"
      aria-label="Tasks by day"
      animate={false}
    />
  );
}
```

Include a host-owned data alternative. Function accessors, icons, callbacks, refs
and state originate inside the client boundary. CommonJS `require()` is not an
advertised export.

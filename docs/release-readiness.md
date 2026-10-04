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

Keep the existing required peers in this PR. React/React DOM are host runtimes.
Recharts supplies geometry, state and native composition identity; Motion supplies
the integrated animation engine. The engines are implementation dependencies
expressed as peers so consumers control and share their versions. This is a
deliberate install burden. Disabling animation does not remove static Motion
imports from the module graph. Making Motion a normal dependency remains a future
reviewed decision about shared versions and public Motion types; no optional flag
or dependency relocation is introduced here.

The package gate pins React/DOM/React-is `19.3.0`, Recharts `3.10.1`, Motion
`13.4.6`, TypeScript `5.9.3` and React/DOM types `19.3.0`. Current ranges start at
these tested floors and allow same-major updates. They are not proof of every
permitted combination. Before publication, verify current registry versions and
repeat gates on the actual resolved tuple. Retain the floors unless new evidence
justifies widening them. Do not promise React 18, older Recharts or other Motion
majors based on upstream support alone. React-is is an upstream Recharts peer;
install it at the host React version rather than allowing a different major.
It is pinned in consumers, not imported by Kind itself.

Plain CSS needs no Tailwind compiler. Existing Tailwind v4 host fixtures test
style interoperability; Tailwind is not a package peer. Native React SVG components
work through the existing `SeriesConfig.icon` slot; no icon library is required
or certified. No Tailwind v3 or universal icon compatibility claim is added.

The root entry retains `"use client"`. The new pinned Next `16.3.8` consumer tests
a server page supplying serializable props, and a client component owning state,
callbacks and an SVG icon. It uses a production build/localhost server and checks
server HTML/data alternative, hydration, state updates and controlled legend
interaction without browser errors. There is no `transpilePackages`, `ssr: false`,
workspace link, copied library code, deployment or external font fetch. Next is
a development-only dependency. This is a representative configured line-chart
proof, not a guarantee for every chart/router/framework. An SSR chart shell may
omit marks until client layout. Supply an accessible host-owned data alternative.
See [Next's client-boundary rules](https://nextjs.org/docs/app/api-reference/directives/use-client).

## Artifact and GitHub gates

`npm run check` runs lint, public component tests, installed-package and browser
contracts, then `check:next`. The package gate checks required runtime/declaration
files, MIT license, README, ESM exports, CSS/side effects, strict NodeNext/Bundler
consumers, installed component tests and production bundles. Primitive-only
imports must exclude Kind/Motion runtime and stay within 100 bytes of native
Recharts. Keep those existing guarantees.

`npm run pack:artifact` retains the exact installed/tested tarball. Its receipt
includes SHA-256, npm integrity, source commit/dirty flag, tool versions and exact
consumer pins. SHA-512 is checked before installation and SHA-256 before retention.
The receipt describes only the package gate, not aggregate approval or a provenance
attestation. Dirty candidates are diagnostics, never publication evidence.
`npm run check:next` requires that retained artifact, checks its checksum before
and after testing and writes `next-consumer.json` for the same digest.

CI uploads the package directory only after the full aggregate succeeds on each
Node 22/24 matrix job. Failed jobs may retain diagnostic screenshots but cannot
upload a successful package candidate. Require clean source, independent review
and both exact-head jobs. Select one artifact by run ID, commit and SHA-256, then
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

1. Confirm npm `@kind-ui` ownership, package availability and maintainers.
2. Approve package set, first version/dist-tag and tested support boundaries.
3. Establish a working private security-reporting route/support policy; SECURITY.md
   explicitly identifies this as unfinished.
4. Approve/adopt version/changelog tooling, bootstrap route, npm trusted publisher
   fields and protected release environment. Persistent account/access setup is
   outside this PR.
5. Resolve the Radial probe issue, review dependency licenses, get independent
   review and pass aggregate/exact-head Node 22/24 checks on the versioned artifact.
6. Obtain explicit authorization for publication, tags/GitHub Releases and merges.
   Update docs to registry installs only after publication is verified.

## Expected install/import

For local review now, after `npm run pack:artifact`:

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

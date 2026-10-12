# Kind UI registry

`npm run build:registry` builds the canonical documentation compositions with
`shadcn@4.21.4 build`. The generated source catalog and staging files live in
`artifacts/registry/source`; the flat served catalog and item payloads live in
`artifacts/registry/r`. Hosting copies that directory to the domain root:
[https://kindui.dev/r/](https://kindui.dev/r/).

The documentation example catalog owns which compositions are canonical.
`catalog.mjs` maps those examples to flat install names, including
`activity-rings` from `radial-activity`. Build staging preserves the exact
composition bytes and public imports; the CLI places editable files under each
consumer's configured components alias. Core owns chart geometry, interactions,
and animation. The registry pins `@kind-ui/charts@0.5.0` and declares its React,
React DOM, Recharts, and Motion requirements.

The supported registry `css` field registers package utilities with Tailwind v4
for standard `src/`, `app/`, and `src/app/` stylesheet locations. Other layouts
must register `node_modules/@kind-ui/charts/dist` relative to their stylesheet.
Missing source directories are harmless. Existing consumer theme variables
remain authoritative; canonical compositions own their series colors.

## Directory submission material

`directory-entry.json` is the reviewable entry for the official
[`apps/v4/registry/directory.json`](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/directory.json).
The namespace is `@kind-ui`, with the URL template
`https://kindui.dev/r/{name}.json` and catalog
[https://kindui.dev/r/registry.json](https://kindui.dev/r/registry.json).

Core 0.5.0 publication was verified on October 11, 2026. The official
[npm archive](https://registry.npmjs.org/@kind-ui/charts/-/charts-0.5.0.tgz) has
integrity `sha512-k4z9xNBbh+S7s6pf2nS727WNwds7AKUQSuP0pSCjspOGyOp98XHkQQ7tEwHTCfWWVoEWFa0r8A617jtxfSFIwQ==`
and SHA-256 `cf30c5d94915576139fa5bcd5fab5e104407463dd7d6a90fd3cba5fd68674ba6`,
matching the validated candidate.

Before submission, verify that the deployed catalog and all fourteen item URLs
respond successfully. The
catalog must conform to the official registry schema, have flat item names,
and omit `content` from catalog file entries. Individual item payloads include
source content for installation. The MIT source repository must be public.

After those prerequisites are established, add the prepared entry to the
upstream directory, run its `pnpm validate:registries` command, and submit a
separate authorized pull request, following the
[official requirements](https://ui.shadcn.com/docs/registry/registry-index).
Only upstream acceptance enables automatic discovery of the intended command:
`npx shadcn@latest add @kind-ui/line-chart`. No deployment or directory submission
is performed by this repository's build or checks.

Candidate consumer checks install the checksum-verified local Core tarball and
save `artifacts/registry/consumer-evidence.json`. Run
`node scripts/check-registry-consumers.mjs --published` for separate public npm
installation evidence. That mode independently fetches npm metadata, downloads
the exact published archive with npm, compares its bytes and integrity to the
validated candidate, and installs unmodified production items in clean Vite and
Next projects. It saves `artifacts/registry/published-consumer-evidence.json`.
Both modes use a temporary namespace mapping for checks; neither establishes
deployment or upstream namespace acceptance.

The pinned build/install CLI is executed ephemerally instead of being added to
this workspace's dependency tree. Its current transitive `braces` dependency has
an upstream high-severity advisory (GHSA-vfj7-8cjw-p6xm) with no patched release;
the repository's existing dependency audit gates remain intact. The CLI handles
only this repository's authored catalog and controlled scratch consumers.

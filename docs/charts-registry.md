# Charts registry maintenance

The existing Docs app builds a shadcn-compatible distribution of all 51 current chart compositions across 13 families. The editable sources remain `apps/docs/examples/<id>/example.tsx`; previews, npm downloads and registry recipes share them. `apps/docs/registry.json` is the standard source manifest. No chart engine is copied: every recipe imports the published `@kind-ui/charts` core. ActivityRings has its own `kind-radial-activity` item; donut, bubble, gauge, stacked, material and other catalog recipes install independently.

## Build and compatibility

Run `npm run generate` or `npm run build` in `apps/docs`. Generation stages editable components, adds the existing example presentation stylesheet and a complete static data alternative when the source does not supply one, then invokes the official pinned `shadcn@4.21.4 build`. Every recipe installs only its composition, its supporting sources (where present), shared CSS and MIT license. Shared files use the same target and the CLI preserves identical files on subsequent installs.

The source manifest requests `@kind-ui/charts@0.4.0` and its documented React/React DOM, Recharts and Motion peer ranges. npm metadata was inspected on 2026-10-10: latest was 0.4.0, with integrity recorded in `scripts/registry.mjs`. The CLI saves `^0.4.0` in the consumer manifest; its lockfile pins resolved bytes. This is a tested 0.4.0 composition, not a guarantee for future patches. Updating the core version requires reviewing recipes, metadata, peer ranges and the published integrity together, then repeating clean-consumer checks. The catalog gate rejects missing/duplicate recipes and unreviewed core version changes. A package release is unnecessary for this distribution-only change.

The official CLI is an isolated npm-exec development tool, pinned by version rather than a website dependency. Its current transitive `braces` dependency has advisory GHSA-vfj7-8cjw-p6xm with no fixed version at inspection. It receives repository-owned paths during builds; do not feed it untrusted glob patterns. The site's declared dependencies pass the repository's high-severity audit gate. The CLI's temporary dependency graph is not covered by that audit result.

## Hosting and discovery

The app exports `public/r/registry.json` and `public/r/kind-<example-id>.json` into `out/r/`. Root previews serve `/r/...`; the public build uses `NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs`, giving planned URLs `https://kindui.dev/charts/docs/r/...`. Client commands use the actual page origin and the configured docs mount. Production generation requires `KIND_DOCS_ORIGIN` for absolute Markdown links. When it is unset in a local build, Markdown install commands require it in the consumer's terminal (for example, `export KIND_DOCS_ORIGIN=http://127.0.0.1:6374` for that preview). They do not bake in a default preview port. Consumers can configure:

```json
{
  "registries": {
    "@kind": "https://kindui.dev/charts/docs/r/{name}.json"
  }
}
```

Then `npx shadcn@latest add @kind/kind-line` installs the line recipe. Direct item URLs need no namespace setup. The root `registry.json` index supports standard CLI discovery and the existing shadcn MCP server without a bespoke server.

`apps/docs/README.md` identifies this repo's app as the publishing source; the Sites checkout is a generated snapshot. Neither source build nor this PR deploys it. The deployment owner must publish the approved `out/` snapshot and verify the index and each item at the public mount. Do not describe the planned production endpoints as deployed until those HTTP responses have been checked.

## Validation

`npm run check:registry` checks catalog/schema contracts, serves real JSON under a local `/charts/docs/r` mount, and installs every item sequentially with the actual CLI into a clean src-based consumer. It verifies that no unrelated chart is installed, the supported npm version/integrity resolves, all selected variant props compile, strict Bundler/NodeNext declarations pass, and Vite builds. The retained consumer is in `artifacts/registry-consumer`; `registry-results.json` records each installed item. These are disposable evidence, not source files.

`npm run check` in Docs checks exported JSON alongside existing docs contracts. Run `npm run check:registry` before `npm run check:browser`; it prepares the published-core consumer receipt and production build used by the browser checks. The browser launcher stops immediately with this instruction if either output is missing. `npm run check:browser` adds distribution control, persistence, commands/imports, preview preservation, mobile containment and hydration checks to existing browser coverage. Library checks remain `npm run check` at the repository root. Run the focused checks first, then required aggregates; use fixed, bounded concurrency.

Official schemas in `apps/docs/scripts/schemas` were retrieved from the maintainer's MIT-licensed repository at `c2a67849be260701852b0977ba15eb5f3a0ce2a4` (2026-10-10), under `apps/v4/public/schema/`. Keep their license and provenance notice. Ajv validates those schemas offline; the HTTPS draft-07 identifier is registered as an alias of Ajv's built-in HTTP meta-schema. Update snapshots only after reviewing the current official schemas.

References: [registry overview](https://ui.shadcn.com/docs/registry), [source index schema](https://ui.shadcn.com/docs/registry/registry-json), [item schema](https://ui.shadcn.com/docs/registry/registry-item-json), [MCP discovery](https://ui.shadcn.com/docs/registry/mcp).

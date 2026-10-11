# Charts registry

The current registry distributes 14 reusable chart components over the existing `@kind-ui/charts` npm core. The installed source owns editable layout and presentation defaults; callers supply observations, identities and plot children. It does not copy the rendering or interaction engine.

## Boundaries

`apps/docs/registry/*.tsx` is canonical component source. `apps/docs/registry.json` indexes Line, Area, Bar, Box Plot, Combo, Heatmap, Histogram, Pie, Radar, Radial Bar, Sankey, Scatter, Waterfall and ActivityRings. Donut, bubble, gauge, stacked, horizontal, materials and loading use the existing native parts/options. The catalog gate maps all 51 documented examples onto these items and checks every public chart export.

A family install contains that family module, the identical shared `chart.tsx` frame/public parts, and the MIT notice. There are no dependencies on another family item. Styles come from the npm package. Native parts retain their original implementation and identity; preserve refs, handlers and discriminated ownership props. Components with built-in context (configured Line, Heatmap and ActivityRings) never add another Root. Other families can opt into the editable frame with `config` or compose normally in an existing Root without it.

`registry/usage.json` contains caller examples, not installed datasets. CLI payloads and Manual display are generated from the exact same source files. Each documentation page has Installation before Usage, with CLI / Manual tabs and numbered steps. Preview code consumes the local module; separately downloaded npm examples remain available for direct package usage.

The previous 51 `kind-*.json` recipe URLs are generated from `registry/legacy.json` for compatibility and are omitted from the discovery index and prominent docs. Do not redirect them to exports with a different contract.

## Version and build

The registry is checked against published `@kind-ui/charts@0.4.0` and its recorded npm integrity. Supported peers are React/DOM ^19.3.0, Recharts ^3.10.1 and Motion ^13.4.6. The CLI currently writes ^0.4.0 to package.json; a lockfile is necessary to retain the tested resolution. Core and compositions must be reviewed together before updating compatibility. npm distribution is unchanged.

`npm run generate` validates official schemas and invokes shadcn 4.21.4 to build `public/r/registry.json` and individual JSON payloads. The existing Next static export carries these into `out/r`. `publicPath` applies the deployment base path. Production generation requires `KIND_DOCS_ORIGIN`; the visible mapping follows the actual browser origin. Local endpoint validation does not establish production availability. The website/docs publishing owner must deploy the corrected export before advertising it.

## Namespace and discovery

Until genuine global registration, users must merge the one-time @kind-ui mapping into components.json. Bare namespace commands are only valid after that setup. Normal registry indexing supports shadcn CLI discovery and its MCP tooling; no Kind-specific MCP server is added.

Global registration follows separately authorized merge and deployment. Prepared metadata is in `apps/docs/registry/directory-entry.json`, including the required inline logo from the existing Kind flower asset. Verify that the live index returns all 14 items with no embedded file content, every item URL returns schema-valid source, and a clean consumer can discover/install the live registry using the one-time namespace mapping. Confirm @kind-ui is still available.

The parent/owner can then add that exact entry to shadcn-ui/ui `apps/v4/registry/directory.json`, run `pnpm validate:registries` from `apps/v4`, and submit for maintainer review. The current upstream validator checks directory/public-payload schemas and namespace uniqueness; it does not prove endpoint availability. The registry must remain public/open source and flat. See https://ui.shadcn.com/docs/registry/registry-index and the upstream `apps/v4/lib/registry-directory.ts` schema. No external submission is performed by this corrective PR.

## Verification

`npm run check:registry` uses the actual CLI to discover/install all 14 items through a project-configured @kind-ui namespace. It checks install isolation, npm integrity, strict Bundler/NodeNext typing, usage examples, all 51 existing caller compositions and variants, and a Vite production build. A second independent npm consumer installs Manual source directly from the public JSON and receives the same type/build checks. Browser checks cover installed caller behavior and installation tabs, keyboard, literal clipboard commands and mobile containment.

Cloud environments blocking the official shadcn colors endpoint may optionally set `KIND_UI_SHADCN_COLORS_FILE` to an independently retrieved, verbatim official neutral.json. Only the CLI's incidental official color request is mirrored, using its REGISTRY_URL support; Kind endpoints and npm installs remain real. The receipt records this limitation. Normal CI uses the official endpoint directly. Do not claim unrestricted official-network validation from the fixture path.

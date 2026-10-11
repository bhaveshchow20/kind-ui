# Kind UI registry

The shared registry distributes 14 reusable chart components over the published `@kind-ui/charts` npm core. Installed source owns editable layout and presentation defaults; callers supply observations, identities and plot children. It does not copy the rendering or interaction engine.

## Source and package boundaries

The shared catalog belongs to `registry/`. `registry/charts/*.tsx` is canonical editable chart source, and `registry/charts/usage.json` contains caller examples, not installed datasets. npm packages remain in `packages/charts` with independent versioning. A future product can add its own source directory, catalog entries and package dependencies without inheriting the charts package version.

Public item names are flat: `@kind-ui/line-chart` resolves to `https://kindui.dev/r/line-chart.json`. Package names such as `@kind-ui/charts` describe npm dependencies, not another level in the registry command. Choose unique names for future products; the catalog gate rejects collisions.

The catalog covers Line, Area, Bar, Box Plot, Combo, Heatmap, Histogram, Pie, Radar, Radial Bar, Sankey, Scatter, Waterfall and ActivityRings. Donut, bubble, gauge, stacked, horizontal, materials and loading use existing native parts/options. Each family install includes that module, the identical shared `chart.tsx` frame/public parts, and the MIT notice. It does not install other families. Styles come from the npm package. Native parts retain their implementation and identity, refs, handlers and ownership props. Configured Line, Heatmap and ActivityRings never add another Root. Other families can opt into the editable frame with `config` or compose in an existing Root.

The 51 previous `kind-*.json` recipe URLs are preserved from frozen compatibility source in `registry/charts/legacy/`, indexed by `registry/charts/legacy.json`. These payloads remain available but are omitted from discovery and prominent docs. Do not redirect them to different contracts or rebuild them from current docs examples.

## Build and docs consumption

From the repository root:

```sh
npm ci
npm run build:registry
npm run test:registry
npm run dev:registry
```

The builder validates the official vendored schemas and uses shadcn 4.21.4 to create a discovery index and 65 item JSON payloads. It needs root dependencies and canonical source; it does not install or run the docs app. `dev:registry` serves `/r/` on reserved port 6374 (override with `KIND_REGISTRY_PORT`). Generated output is not committed.

Docs generation consumes this build and copies canonical modules into ignored `generated/charts/`. The existing chart previews continue to use their maintained examples. CLI payloads and Manual display come from the same source. Original npm examples remain available for package consumers. Chart pages show package manager namespace commands and native numbered Manual steps; initial shadcn setup is explained in the installation guide.

Registry endpoints never apply the docs base path. Namespace commands stay the same when docs use `/charts/docs`. The docs static preview also serves root registry output. The docs export retains a compatibility copy in `out/r/`, preserving old `/charts/docs/r/` endpoints when mounted there.

Charts compatibility is checked against published `@kind-ui/charts@0.4.0` and its recorded npm integrity. Supported peers are React/DOM ^19.3.0, Recharts ^3.10.1 and Motion ^13.4.6. The CLI currently writes ^0.4.0 to package.json; retain a lockfile for the tested resolution. Review charts core and compositions together before changing compatibility.

## Domain-root deployment

Registry publication belongs to the host serving `kindui.dev`, separately from the docs mount. After the root build, copy only registry JSON into the existing domain-root static snapshot:

```sh
npm run snapshot:registry -- /absolute/generated/domain-root/site
```

This writes `out/r/` and preserves the homepage, other assets and `.openai` hosting identity. The domain-root host must serve these files at `/r/`; uploading only the docs export beneath `/charts/docs` does not publish the root registry. CI retains the production registry as its own `kind-ui-registry` artifact for this handoff. This PR prepares source and output; it does not deploy a site.

## Namespace registration

Merge this source change, deploy the root registry, and verify the live endpoints before submitting the shadcn directory entry. The docs present the intended namespace command:

```sh
npx shadcn@latest add @kind-ui/line-chart
```

That command becomes available to consumers after the deployment and directory acceptance handoff.

Prepared directory metadata is `registry/directory-entry.json`, including the existing inline Kind flower logo. Confirm that `@kind-ui` is still available, the live index contains 14 items without embedded file content, every payload is schema-valid and a clean consumer can discover and install it. Then add the entry to shadcn-ui/ui `apps/v4/registry/directory.json`, run upstream `pnpm validate:registries` from `apps/v4`, and submit for maintainer review. npm remains this repository's package manager; pnpm is the upstream validator's requirement.

Normal registry discovery supports the shadcn CLI and MCP tooling; no Kind-specific MCP server is added. The upstream directory validator checks schemas and uniqueness, which does not establish live endpoint availability. See [registry index documentation](https://ui.shadcn.com/docs/registry/registry-index). External submission and deployment are separate authorized handoffs.

## Verification

Root contracts build in a fixture without the docs application, check independent product dependencies, collisions and source boundaries, serve every root endpoint, and check deployment snapshot preservation.

In `apps/docs`, `npm run check:registry` uses the actual CLI to discover/install all 14 items through a project-configured namespace. It checks install isolation, npm integrity, strict Bundler/NodeNext typing, caller examples, all 51 existing compositions and variants, and a Vite build. An independent Manual consumer installs source from public JSON and receives the same checks. Browser checks cover installed caller behavior, installation tabs, keyboard, literal clipboard commands and mobile containment.

Environments blocking the official shadcn colors endpoint may optionally set `KIND_UI_SHADCN_COLORS_FILE` to independently retrieved, verbatim official neutral.json. Only the CLI's incidental color request is mirrored through REGISTRY_URL; Kind endpoints and npm installs remain real. The receipt records this limitation. Normal CI uses the official endpoint directly; do not claim unrestricted network validation from the fixture path.

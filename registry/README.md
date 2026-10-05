# Kind chart registry

Install editable Line, Area and Bar designs, or compose them in a business overview dashboard. Kind UI provides chart inspection, series visibility, accessibility and motion; these files own the palette, typography, framing, layout, sample data and data tables. The dashboard's reporting-period filter is application state. Change these files to fit your product.

## Install

In a React project initialized with shadcn, add the dashboard through the GitHub registry:

```sh
npx shadcn add bhaveshchow20/kind-ui/charts-dashboard
```

Choose an individual recipe with `line-chart`, `area-chart` or `bar-chart` in place of `charts-dashboard`. The CLI installs the required npm peers, the standard shadcn Card, and shared scoped chart CSS alongside your chart files. Import `ChartsDashboard` from your components alias's `charts/charts-dashboard` file. The host needs Tailwind CSS for the shadcn Card; each recipe imports the package stylesheet and its own editable chart CSS.

For namespaced HTTP installation, add this mapping to `components.json`:

```json
{
  "registries": {
    "@kindui": "https://raw.githubusercontent.com/bhaveshchow20/kind-ui/main/apps/docs/public/r/{name}.json"
  }
}
```

Then run `npx shadcn add @kindui/charts-dashboard`. An explicit mapping works independently of the registry directory. GitHub item addresses read the root source catalog; namespaced HTTP addresses read generated JSON with embedded files.

## Customize and update

Edit series metadata and CSS variables to change colors; edit card copy, sample data, axes and spacing directly. Each recipe exposes a typed `data` prop. Keep period keys unique within a recipe. Retain the accessible chart name and native table when adapting data. The metric displays the current-year total for Line and Area, and direct-channel orders for Bar. Package motion honors reduced-motion preferences. The dashboard uses a labeled native select and a responsive grid.

Inspect upstream differences before replacing edited files:

```sh
npx shadcn add @kindui/charts-dashboard --diff
```

Review and save your local changes, then apply the update with `--overwrite` only when you intend to replace them. Installation does not preserve a merge history. Keep stable item paths for compatible design updates; introduce a versioned item path only for the first breaking design change.

## Catalog maintenance

`catalog.mjs` is the single item definition. Edit it and the files in `charts/`, then run:

```sh
node scripts/build-registry.mjs
node scripts/build-registry.mjs --check
node --test scripts/registry.test.mjs
node scripts/check-registry.mjs
# After running its --consumer mode:
node scripts/check-registry-browser.mjs
```

The generator writes root `registry.json` for GitHub's source-file route and `apps/docs/public/r` for HTTP. Same-repository dependencies use full GitHub item addresses in the source catalog and generated HTTP addresses in embedded JSON. File targets use the configured components alias.

The schema/build gate uses pinned `shadcn@4.21.2`. Its consumer mode (`--consumer`) accepts `KIND_CHARTS_ARCHIVE` for local package validation. Public dependency installation and live remote routes are verified independently during integration. See the [official GitHub registry](https://ui.shadcn.com/docs/registry/github) and [item schema](https://ui.shadcn.com/docs/registry/registry-item-json) for CLI contracts.

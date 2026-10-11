# Kind UI chart consumer guidance

Install the existing consumer skill:
`npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.

Start with /llms.txt. Retrieve /markdown/installation.md and the relevant
family Markdown; /markdown/agents/consumer.md explains the retrieval workflow.
The chart page's Copy prompt identifies the selected source, package version,
setup manifest and task checks. /llms-full.txt is the optional complete set.

Install @kind-ui/charts and build Tailwind v4 CSS. Add an @source path to
node_modules/@kind-ui/charts/dist relative to your CSS file. Inspect the
installed package version and peers before adapting code. Motion is required.
Use public exports; there is no @kind-ui/charts/motion entry.

Import chart families directly by name. Each chart requires config, an accessible
name and explicit children. Compose the family’s Series, axes, Tooltip and Legend
parts; omitted parts stay absent. Set interaction directly on the chart and use
Content for contextual HTML controls or a data alternative. Read each family’s
API for its geometry and data contracts.

Adapt the example to the requested data. Keep units, domains, identities,
visibility and missing-value policy explicit. Add a chart name and complete data
alternative. For loading read /markdown/chart-components/chart.md; for metadata
read /markdown/chart-components/series-config.md.

Verify strict types and a production build, then inspect mobile containment,
keyboard access, zero/missing values and reduced motion. Report actual checks.

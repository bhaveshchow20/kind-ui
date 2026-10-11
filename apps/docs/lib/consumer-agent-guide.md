# Kind UI chart consumer guidance

Install the existing consumer skill:
`npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.

Start with /llms.txt. Retrieve /markdown/installation.md and the relevant
family Markdown; /markdown/agents/consumer.md explains the retrieval workflow.
The chart page's Copy prompt identifies the selected source, package version,
setup manifest and task checks. /llms-full.txt is the optional complete set.

Use CLI / Manual Installation on the chart page. Both paths install the same
editable family component and npm core. Install with
`npx shadcn@latest add @kind-ui/line-chart`, or follow the family page's Manual
steps. Import the local component, supply your own data and keep your lockfile.
Review local source edits before updating a composition.

Install @kind-ui/charts and import @kind-ui/charts/styles.css once. Inspect the
installed package version and peers before adapting code. Motion is required.
Use public exports; there is no @kind-ui/charts/motion entry.

Configured LineChart, HeatmapChart and ActivityRings supply their own context.
Other registry families can opt into the editable frame with config or retain
their native composition. Read the family's API before transferring a pattern
from another chart.

Adapt the example to the requested data. Keep units, domains, identities,
visibility and missing-value policy explicit. Add a chart name and complete data
alternative. For loading read /markdown/chart-components/root.md; for metadata
read /markdown/chart-components/series-config.md.

Verify strict types and a production build, then inspect mobile containment,
keyboard access, zero/missing values and reduced motion. Report actual checks.

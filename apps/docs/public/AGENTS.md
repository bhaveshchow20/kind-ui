# Kind UI charts consumer guidance

This is pre-release documentation. @kind-ui/charts is private at 0.0.0 and is not published to npm. Use the exact validated vendor tarball included in each example ZIP. Inspect /package-provenance.json for the checksum and source revision; do not substitute an invented registry command.

Start with /llms.txt and retrieve /markdown/start/installation.md, /markdown/concepts/identity.md and the chosen /markdown/components/<family>.md. Markdown contains actual consumer code; complete locked setup files are linked from each example. Copy prompt records the selected controls and controlled legend visibility. Pointer/focus inspection is transient.

Import presentation from @kind-ui/charts and its styles.css. Import native axes, Cells, grid and sizing from recharts. Motion is a required peer supplied by the package root; there is no /motion subpath. Keep data, domains, geometry and filtering consumer-owned.

A dataKey reads values. A seriesKey identifies metadata and visibility. Root config does not infer data. Pie category filtering requires matching filtered rows, Cells and totals. Scatter requires explicit x/y/z mapping, zero/missing handling and matching legend icons.

Preserve data alternatives, keyboard interactions, contrast and reduced-motion behavior. Automatic category paint emphasis exists only for maintained Pie and an eligible explicitly opted-in BarChart arrangement. Other charts have inspection or explicit consumer styling. Materials have family-specific bounds. Glass is paused.

Run the downloaded consumer's npm ci and npm run build. Classify failure as packaging, API, documentation, runtime or agent execution; report the exact reproducible error. The owner-private preview is not proof of anonymous docs retrieval or a published-package release gate.

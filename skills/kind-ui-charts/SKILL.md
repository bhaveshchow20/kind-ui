---
name: kind-ui-charts
description: Build, adapt, or review React and Next.js charts consuming @kind-ui/charts from npm. Use for chart selection, explicit compound charts, styling, controlled legends, loading, accessibility, and consumer verification with the documented public API.
---

# Kind UI charts

Deliver working consumer code using public `@kind-ui/charts` exports. Keep data,
units, domains, aggregation, request state, and accessible alternatives host-owned.
Inspect the consumer’s installed version before adapting a documented example. Do not substitute repository source imports for npm imports.

The [Candlestick guide](https://kindui.dev/charts/docs/components/candlestick/)
is a source candidate requiring Core 0.6.0 or later for public npm and registry
installation. Published Core 0.5.0 lacks these exports. Follow its selected prompt
and manifest release prerequisite; candidate verification uses the exact approved
artifact with its checksum and provenance.

## Decide, then read only what applies

1. Choose the family from the question, units, and data using the selection table
   in [composition](rules/composition.md). Then retrieve its explicit parts.
2. Inspect the framework, installed version, and application entry. For a new
   consumer or Next boundary, read [setup and verification](rules/setup-testing.md).
3. For paint, Default/Clay/Glow, or changing identities, read
   [theme and identity](rules/theme-identity.md).
4. For async data, controlled legends, mark selection, or data alternatives, read
   [interaction and accessibility](rules/interaction-accessibility.md).
5. Build the chosen consumer and report checks actually run using the verification
   steps in [setup and verification](rules/setup-testing.md).

Use the maintained docs examples for [Combo](https://kindui.dev/charts/docs/components/combo/),
[Sankey](https://kindui.dev/charts/docs/components/sankey/),
[Heatmap](https://kindui.dev/charts/docs/components/heatmap/),
and [Line](https://kindui.dev/charts/docs/components/line/).
Retrieve complete consumer source from the documentation. Examples render only
the graph and its explicit parts; the Candlestick live-update example includes
its chart-owned current observations table. The host owns other accessible data
alternatives. Use the
family table to route other chart requests.

## Retrieve a family contract when needed

For each family or option, retrieve the relevant Markdown
from the official [documentation index](https://kindui.dev/charts/docs/llms.txt).
The [complete reference](https://kindui.dev/charts/docs/llms-full.txt) includes
consumer code and API tables. Check the installed declarations for exact props;
chart families and series do not all share one contract. Fetch only the needed
family/shared-part pages. These are HTTP documentation resources, not an MCP server.

Do not invent a `Chart` namespace, schema, registry, or `material="default"`.
Default is the appearance label; omit `material` for it. Clay and Glow are
the opt-in materials. See the theme rule for Sankey's separate `finish` API.

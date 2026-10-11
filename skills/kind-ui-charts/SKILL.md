---
name: kind-ui-charts
description: Build, adapt, or review React and Next.js charts consuming @kind-ui/charts from npm. Use for chart selection, configured or composed charts, styling, controlled legends, loading, accessibility, and consumer verification with the public 0.3 API.
---

# Kind UI charts

Deliver working consumer code using public `@kind-ui/charts` exports. Keep data,
units, domains, aggregation, request state, and accessible alternatives host-owned.
This skill targets released 0.3; inspect the consumer's installed version before
adapting a recipe. Do not substitute repository source imports for npm imports.

## Decide, then read only what applies

1. Choose the family from the question, units, and data using the selection table
   in [composition](rules/composition.md). Then decide its composition owner.
2. Inspect the framework, installed version, and application entry. For a new
   consumer or Next boundary, read [setup and verification](rules/setup-testing.md).
3. For paint, Default/Clay/Glow, or changing identities, read
   [theme and identity](rules/theme-identity.md).
4. For async data, controlled legends, mark selection, or data alternatives, read
   [interaction and accessibility](rules/interaction-accessibility.md).
5. Build the chosen consumer and report checks actually run using the verification
   steps in [setup and verification](rules/setup-testing.md).

Adapt examples only when their family and ownership fit: [mixed-unit Combo](examples/controlled-combo.tsx),
[directed Sankey flows](examples/sankey-flows.tsx), [team matrix](examples/team-heatmap.tsx),
and [configured Line](examples/configured-line.tsx).
Each preserves a complete data alternative. They are starting points, not a universal
chart model; use the family table to route other chart requests.

## Retrieve a family contract when needed

For families or options beyond these examples, retrieve the relevant Markdown
from the official [documentation index](https://kindui.dev/charts/docs/llms.txt).
The [complete reference](https://kindui.dev/charts/docs/llms-full.txt) includes
consumer code and API tables. Check the installed declarations for exact props;
family roots and series do not all share one contract. Fetch only the needed
family/shared-part pages. These are HTTP documentation resources, not an MCP server.

Do not invent a `Chart` namespace, schema, registry, or `material="default"`.
Default is the appearance label; omit `material` for it. Clay and Glow are
the opt-in materials. See the theme rule for Sankey's separate `finish` API.

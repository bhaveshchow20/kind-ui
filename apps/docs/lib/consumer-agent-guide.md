# Kind UI chart consumer guidance

Install the consumer skill with `npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.

Install charts with `npm install @kind-ui/charts`.
Import `@kind-ui/charts/styles.css` once at the application entry.

Start with /llms.txt, /markdown/installation.md and /markdown/agents/consumer.md.
Retrieve the relevant component Markdown; /llms-full.txt includes complete code
and API tables. Copy prompt follows the selected example. Existing MCP documentation/web-fetch
tools can retrieve these same HTTP resources; the links are documentation, not
MCP server configuration.

Configured LineChart owns Root and responsive sizing defaults. Area and Bar use
explicit Root and ResponsiveContainer composition. Import public package exports.
The application owns data, domains, units, visibility state, chart names and data
alternatives. Motion is required; there is no /motion entry.

Typecheck and build the consumer. Inspect mobile layout, keyboard access, contrast,
legend toggles, missing and zero values and reduced motion.

For loading, theme colors, fill/background patterns, projection/percent stacks, marker/dash/directional motion, Pie defaults, Sankey labels/icons and Root interactions, retrieve the relevant family reference and /markdown/chart-components/root.md for loading. Its complete public options source is /examples/combo-motion/src/examples/combo-motion/options.tsx; selected example files include it and receive strict consumer checks.

# Kind UI chart consumer guidance

Install the consumer skill with `npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.

Install charts with `npm install @kind-ui/charts`.
Import `@kind-ui/charts/styles.css` once at the application entry.

Start with /charts/docs/llms.txt, /charts/docs/markdown/start/installation.md and /charts/docs/markdown/agents/consumer.md.
Retrieve the relevant component Markdown; /charts/docs/llms-full.txt includes complete code
and API tables. Copy prompt follows the selected example. Existing MCP documentation/web-fetch
tools can retrieve these same HTTP resources; the links are documentation, not
MCP server configuration.

Configured LineChart owns Root and responsive sizing defaults. Area and Bar use
explicit Root and ResponsiveContainer composition. Import public package exports.
The application owns data, domains, units, visibility state, chart names and data
alternatives. Motion is required; there is no /motion entry.

Typecheck and build the consumer. Inspect mobile layout, keyboard access, contrast,
legend toggles, missing and zero values and reduced motion.

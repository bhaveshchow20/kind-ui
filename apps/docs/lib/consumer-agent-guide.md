# Kind UI chart consumer guidance

Install the consumer skill with `npx skills add bhaveshchow20/kind-ui --skill kind-ui-charts`.
Install charts with `npm install @kind-ui/charts react react-dom recharts motion`.
Import `@kind-ui/charts/styles.css` once at the application entry.

Start with /llms.txt, /markdown/start/installation.md and /markdown/agents/consumer.md.
Retrieve the relevant family Markdown; /llms-full.txt contains complete consumer
code and API tables. Copy prompt follows the selected recipe. Runtime legend
choices remain application state.

Configured LineChart owns Root, responsive sizing and defaults. Area and Bar use
explicit Root and ResponsiveContainer composition. Import only public package
exports. The application owns data, domains, units, chart names and complete data
alternatives. Motion is a required peer; there is no /motion entry.

The npm package owns reusable chart behavior. Registry designs add editable art
direction and composition; application filters can remain local. The AI agents
page documents official shadcn MCP setup and the @kindui namespace mapping.

Typecheck/build the consumer and inspect narrow layout, keyboard access, contrast,
legend toggles, missing/zero values and reduced motion. Report reproducible failures.

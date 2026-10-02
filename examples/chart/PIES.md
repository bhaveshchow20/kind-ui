# Pie and donut recipes

Open `/pies.html` after `npm run dev:chart`. These two bounded recipes use public `PieChart`, `PieSeries`, `Root`, `Legend` and `Tooltip` exports with native Recharts Cells and center labels. Each standalone recipe controls Plain, Paper, Clay and Glow finishes independently from animation. Supply colors through `config`, or use the shared showcase palette controls.

Category identity is `row.id`, not the common numeric `hours` key. `Tooltip.itemKey` resolves that native payload ID. Controlled legend state filters data and Cells together; shares and the center total reflect only included categories. A zero category stays in the table and legend without inventing a painted share. Each card owns its state independently.

Clicking a slice selects its category; chart arrow keys inspect native tooltip items, Escape dismisses the tooltip, and Tab reaches the legend buttons. The readable table is the full data alternative. Animation is optional and reduced-motion aware; it never changes values or totals. Sector labels/custom geometry remain consumer-owned.

# Kind UI chart consumer guidance

Line and Area are documented in this preview. The package is private at 0.0.0 and unpublished. Use /package-provenance.json and the exact /examples/package/kind-ui-charts-0.0.0.tgz from the pinned PR57 snapshot; do not substitute main or a registry install.

Start with /llms.txt, /markdown/start/installation.md and /markdown/components/line.md and /markdown/components/area.md. Markdown includes standalone public consumer source and links to locked setup files. Copy prompt links the selected curve/material source; runtime legend toggles are not serialized.

Import LineChart, CartesianGrid, XAxis, YAxis, LineSeries, Tooltip and styles.css through @kind-ui/charts public exports. Configured LineChart owns Root, responsive sizing and configured defaults; explicit children need legend={{}} for its internally positioned legend. The application owns data, domains, units and controlled visibility. Motion is a required peer; there is no /motion entry.

Preserve the complete data, accessible name, data alternative, keyboard behavior, contrast and reduced motion. Use plain, paper, clay or glow; Glass remains paused. Typecheck/build the copied consumer and report exact reproducible failures. These owner-private URLs do not establish anonymous docs access or a package release.

Area uses public Root, ResponsiveContainer, AreaChart and AreaSeries exports with explicit axes, grid and tooltip. AreaChart has no configured wrapper conveniences. Place Legend outside the responsive plot; pass visibleSeries and onVisibleSeriesChange to Root for interactive toggles. Matching stackId values stack series. The four Area components and selected curve/material sources consume the unchanged pinned PR57 artifact.

# @kind-ui/charts

Private, experimental React 19 chart product. ESM only. This Kind UI package is not published; npm scope ownership is unverified.

Start with one consumer import:

```tsx
import { DataTable, LineChart, normalizeSeries } from '@kind-ui/charts';
import type { ChartModel, InputPoint, NormalizeOptions } from '@kind-ui/charts';
```

`LineChart` server-renders SVG. `DataTable` provides exact source values with explicit missing/imputed labels. Pass one application-owned `selectedId` and `onSelectionChange` to both views, or omit both for read-only views. `lightTheme` and `darkTheme` contain paint tokens only.

Normalization and semantic types are re-exported from the separate React-free `@kind-ui/charts-core` package. The React product maintains chart rendering; it does not embed a second normalizer or selection store. React is a peer dependency. No stylesheet import, provider, or browser global is required. The example supplies its own table and page CSS.

The optional `@kind-ui/cli` copies a `charts/line` composition that imports this runtime. Consumers own and edit that composition, while this package remains a maintained dependency. Using the runtime directly requires no CLI or generated configuration. Copied recipes are not automatically upgraded or merged when the runtime changes.

Fixed margins and simple tick labels are scaffold limitations. SVG scaling is not automatic label layout, and accessibility foundations are not a conformance certification. See the workspace root README for the complete API example, chart guarantees, and scope limits.

Packed imports, TypeScript declarations, generated recipe compatibility, and server rendering are checked using local tarballs. Placeholder npm-install commands are not a public installation path. Original implementation is MIT © 2026 Bhavesh Chowdhury.

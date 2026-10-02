# Sankey technical recipes

Run `npm run dev:chart`, then open `/sankeys.html`. Five energy-balance recipes
compose public Sankey primitives with native Recharts ResponsiveContainer,
Tooltip, labels and click events. The recipes animate by default and retain the same
75:25 output widths; solid and gradient are independent of quantities.

Flow tables include measured zero reserve. Keyboard buttons and pointer links
share inspection state; selecting zero reports zero without inventing a ribbon.
Dataset changes preserve balance and clear stale inspection. Empty datasets
keep headers/captions and a status message. Invalid graphs throw before native
layout; applications should validate at their input boundary and render their
own recoverable error UI. Finite extreme magnitudes that native layout cannot
represent throw a renderer-limit error; no hidden rescaling is performed.

On a phone, focus the diagram region and use arrow keys to scroll. Read labels
at the original diagram scale, or use the table without horizontal page scroll.
Frames too small for padding show a status and retain the table. Motion uses
opacity only and finishes immediately for reduced motion, interaction and
changed layout/data; unmount cancels playback. Optional `finish="paper" | "clay" | "glow"` is independent of the existing
solid/gradient paint selection. Paper adds inset sketch and grain, Clay adds
convex matte lighting without exterior shade, and Glow adds a bright inner rim
and bounded neutral halo. These decorate marks, never their sibling labels.
The halo is decorative rather than additional flow. Native geometry and paint
alpha are tested independently of exterior glow, including 1px/3px flows and
adjacent 3px flows separated by a 1px gap. Explicit filters and custom renderers
retain ownership; thin marks can show less relief.

The aggregate gate includes public validation/SSR tests, installed-tarball
NodeNext/Bundler and production build, packed browser checks and desktop/phone
screenshots. Screenshots are evidence, not pixel-baseline assertions.

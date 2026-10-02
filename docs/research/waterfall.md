# Waterfall composition decision

Verified with Recharts 3.10.1, React 19.3.0 and Motion 13.4.6.

Native research precedes the bounded wrapper:

- [Recharts Waterfall example](https://recharts.github.io/en-US/examples/Waterfall/)
  describes sequential changes using native range `Bar` values.
- [Ranged Bar example](https://recharts.github.io/en-US/examples/BarChartRangeExample/)
  demonstrates negative numeric range endpoints.
- [ReferenceLine API](https://recharts.github.io/en-US/api/ReferenceLine/)
  supplies data-space segments, explicit axis ids and native positioning.
- Installed `Bar` implementation (`computeBarRectangles`) scales both numeric
  endpoints directly, supports either layout, and omits null scale results.
  Nonzero `minPointSize` would fabricate a mark, so the bounded series fixes zero.
- Installed ReferenceLine types support string/number endpoints and z-index.
  Native axis ownership is retained; no pixel scale or chart-store replacement.

An invisible offset stack is unnecessary and can misrepresent signed/cross-zero
ranges. A custom SVG chart would duplicate axes, layout, selection and tooltip
ownership. The chosen integration adds only ordered arithmetic with explicit
missing/checkpoint semantics and native component composition. Totals in the
upstream example do not reset its running sum; our checkpoint contract is
explicitly different and documented. The implementation is original, not copied
from the example. Native Recharts and existing peers retain their licenses;
there are no dependencies or changed common APIs.

Material capability is reused: the established object-bounds bar filters work
on unstacked floating rectangles. Native custom geometry keeps material
ownership. No local material adapter is needed.

Limits: one unstacked series per Waterfall axes; category ids must be unique and
bound by the host; checkpoint mismatch is intentional discontinuity, not a
reconciliation assertion. No inference of missing changes, automatic financial
reconciliation, horizontal keyboard remapping or Brush-windowed connector
claim. Native accessibility selection and Kind tooltip dismissal continue to
apply. Hosts provide semantic tooltip content and accessible tables.

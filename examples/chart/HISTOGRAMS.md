# Histogram recipes

Open `/histograms.html` with `npm run dev:chart`. Both examples consume the public Histogram family.

- **Raw samples:** explicit equal-width temperature edges; rebin control; accepted/missing/nonfinite/out-of-range audit. Interior edges belong to the bin on their right; final edge is included. Heights are counts in samples, x positions in °C.
- **Pre-binned density:** unequal response-time intervals; density in ms⁻¹; equal counts in unequal widths have different heights. Native `Rectangle` shape and `ReferenceLine` compose through the public extension. Empty intervals remain in the table and numeric domain.

The chart owns quantitative geometry. The recipe owns units, formatted interval labels, sample audit and complete data tables. Count-mode area must not be interpreted as frequency for unequal widths. Keyboard arrow selection and tables expose zero counts. Motion honors reduced preferences and stops on interaction or data/geometry changes. These examples are feature proofs, not statistical bin-selection advice or performance claims.

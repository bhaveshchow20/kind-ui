---
"@kind-ui/charts": minor
---

Replace separate chart providers and configured recipes with one explicit compound API across every chart family. Chart components own their metadata, sizing and shared behavior; child parts determine what renders. Remove public Root/RootProps and configured/composed alternatives. This is a breaking change in the pre-1.0 API. Retain family-specific data and geometry contracts, controlled state, native customization and reduced-motion behavior.

While loading, show only the plot placeholder. Hide chart-owned legends and content until data is ready, preserving their state across loading interruptions.

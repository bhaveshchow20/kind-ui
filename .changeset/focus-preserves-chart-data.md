---
"@kind-ui/charts": minor
---

Make legend and mark activation focus and dim peers by default without changing geometry, visibility or tooltip values. Hide/show through legend activation now requires explicit interaction mode `visibility`; consumer-controlled visibleSeries and native hide remain available. Bind ActivityRings focus to original ring categories and retain persistent focus during native keyboard inspection.

Hide now suppresses paint and interaction while retaining full-data layout contributions, so surviving domains, stack baselines, grouped slots, radial allocations and pie angles remain unchanged. Category visibility retains original rows and native pointer indices.

Fade dim/restore and hide/show paint in both directions using chart motion controls, retarget interrupted fades from current opacity, and suppress hidden mark hits and accessibility immediately. Legend and tooltip entries retain original values and order, dim inactive entries, and restore smoothly. Disabled data stays disabled during chart or legend hover while pointer inspection continues. Clearing focus keeps legend items visually active. Both hiding and dimming retain an active legend item and its data.

# Skill sources and updates

These repository-local references are selected from Vercel Agent Skills. The upstream source was independently checked at the pinned revision below; local adaptations are documented for each selected guide.

## React composition patterns

- Upstream: [Vercel Agent Skills, `composition-patterns`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The guide is credited to Vercel Engineering; no individual author is identified in the upstream skill files.
- The composition rule files are sourced from this revision. Local correctness edits: `architecture-compound-components.md` and `state-context-interface.md` now narrow nullable context reads and type nullable refs; `state-decouple-implementation.md` fixes mismatched callback names; `state-lift-state.md` drops an incomplete ref-only example. The skill file adds a note to read individual rules on demand.

## Selected React rendering performance rules

- Upstream: [Vercel Agent Skills, `react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The upstream README credits the guide's original creation to [Shuding (@shuding)](https://x.com/shuding) at Vercel.
- This repo includes only `rerender-derived-state-no-effect`, `rerender-lazy-state-init`, and `rerender-no-inline-components`, sourced from this revision. In `rerender-lazy-state-init.md`, the examples were adapted to avoid stale prop-derived state and browser-only storage access during server rendering; the local `SKILL.md` describes this focused subset, not the full upstream skill.

The Vercel Agent Skills repository declares MIT in its root README, and both upstream skill manifests declare MIT. Keep that license and attribution information with these references. To update, compare the selected upstream files at a new commit SHA, review each rule and author/license notice, retain only rules useful to this React component library, then update the pin and these notes. Do not run a floating/latest installer update without review.

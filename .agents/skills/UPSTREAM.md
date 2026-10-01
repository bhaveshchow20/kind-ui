# Skill sources and updates

These repository-local references were selected after inspecting [EvilCharts `.agents/skills`](https://github.com/legions-developer/evilcharts/tree/e78bc53bb4de28cd0e31bf407884b12ffb441227/.agents/skills) at `e78bc53bb4de28cd0e31bf407884b12ffb441227`. Both referenced guide files matched Vercel upstream; the Vercel source was independently checked at the pinned revision below. Do not install EvilCharts-only workflows or shadcn instructions with them.

## React composition patterns

- Upstream: [Vercel Agent Skills, `composition-patterns`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The guide is credited to Vercel Engineering; no individual author is identified in the upstream skill files.
- The included composition rule files are unmodified from this revision. Its `SKILL.md` keeps the upstream guidance and adds a short local note to read individual rules on demand.

## Selected React rendering performance rules

- Upstream: [Vercel Agent Skills, `react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The upstream README credits the guide's original creation to [Shuding (@shuding)](https://x.com/shuding) at Vercel.
- This repo includes only `rerender-derived-state-no-effect`, `rerender-lazy-state-init`, and `rerender-no-inline-components`, sourced from this revision (trailing whitespace was removed from one file). The local `SKILL.md` describes this focused subset; it is not the full upstream skill.

The Vercel Agent Skills repository declares MIT in its root README, and both upstream skill manifests declare MIT. Keep that license and attribution information with these references. To update, compare the selected upstream files at a new commit SHA, review each rule and author/license notice, retain only rules useful to this React component library, then update the pin and these notes. Do not run a floating/latest installer update without review.

---
name: write-code
description: Writes and edits Charts code (the @kind-ui/charts package, docs examples and site code, registry, tests and scripts) by starting from the file that already does the same job, then checks it with the repo's checks and a cold read. Use whenever you write or change code in this repo, before you call the change done.
---

# Write Charts code

The bar: an expert in the area reads the file and says "this is how I'd write it", and anyone else reads it top to bottom without stopping. Readable first, then fast, never clever.

## 1. Find the twin

Every piece of code here has a twin that already does it. Open it before you write a line, and copy its shape, names and order.

| You're writing | Start from |
| --- | --- |
| A chart family | `packages/charts/src/line-chart.tsx`, `line-series.tsx`, `line-material.tsx` |
| Shared chart parts | `packages/charts/src/cartesian-parts.tsx`, `legend.tsx`, `tooltip.tsx` |
| Loading states | `packages/charts/src/loading-skeleton.tsx`, `loading-motion.tsx` |
| A unit test | `tests/chart.test.mjs` |
| A browser spec | `tests/chart.spec.ts` and its fixtures in `tests/fixtures/browser` |
| A docs page and its examples | `apps/docs/content/docs/charts/line.mdx`, `apps/docs/examples/line/` |
| A docs site file | the same path in the Agent UI docs (`kind-ui/agent-ui` `apps/docs`) |
| A script | `scripts/build-registry.mjs`; its test beside it as `*.test.mjs` |

If two twins disagree, one of them has the wrong shape. Say so instead of picking one. Copy a twin's shape, not its comments.

## 2. Load the area

Read [AGENTS.md](../../../AGENTS.md) and the expert notes for every area you touch: `.agents/experts/<name>/expert.md` and its `decisions.md`. For the docs site, follow the [`fumadocs`](../fumadocs/SKILL.md) skill. Check installed library docs (`node_modules/recharts`, `node_modules/motion`) over memory.

## 3. Write it

- **Built on Recharts and Motion.** Geometry, scales and SVG come from Recharts; animation from Motion. Don't hand-roll what either provides.
- **One shape.** Compound parts read `<Family>Chart.<Part>`; props, context and config types stay with their component; the public index is explicit reexports.
- **Prefer OSS.** Use the pinned dependencies before writing your own. A new runtime dependency needs an explicit reason.
- **Styling** is component-owned Tailwind v4 utilities; data-dependent values use CSS variables.
- **Names in full words** that say what a thing is. Booleans read as questions.
- **No comment by default.** Write one only when a reader would get the code wrong without it: a browser bug, a Recharts quirk, a trade-off. One to three lines.
- **No defensive code for cases that can't happen.** The types rule them out.
- **No helper for one caller,** and no wrapper that only renames.

## 4. Check it

Run the quick checks while you work and check exit codes, not output:

```sh
npm run lint
npm run typecheck
npm test                    # when you touched packages/charts
npm run test:docs           # when you touched apps/docs
npx playwright test tests/<name>.spec.ts   # only the spec your change reaches
```

Run `npm run check` once before you push. When a check is slow, hand it to a subagent with only the command and the files it covers, and keep writing.

## 5. Read it cold

Read the whole diff as the area's expert would, using the checklist in each `expert.md` you loaded, and as a teammate who has never seen it:

- Would an expert write it this way? If you can name a more idiomatic version, write that one.
- Is every name clear without its comment?
- Is anything duplicated that exists elsewhere, in this repo or in Recharts?
- Does any function do two things, or any file hold two ideas?

## 6. Unslop, then review

Run [`unslop`](../unslop/SKILL.md) on your diff, then [`expert-review`](../expert-review/SKILL.md). The change isn't ready to push until both have run.

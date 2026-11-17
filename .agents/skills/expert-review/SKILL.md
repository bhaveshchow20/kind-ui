---
name: expert-review
description: Reviews a Charts change with its experts (charts, docs, tooling), only the ones the diff reaches. Use before every push, or when asked for an expert review. Pass a base ref, expert names, or nothing.
---

# Expert review

Run the experts on what changed. Each expert lives in `.agents/experts/<name>/`: who it is, what it knows and its review checklist in `expert.md`, what's decided in `decisions.md`. You orchestrate; the experts review.

| Expert | Owns |
| --- | --- |
| `charts` | `packages/charts/**`, `tests/**`, `playwright*.config.mjs` |
| `docs` | `apps/docs/**`, `registry/**`, `skills/**`, `docs/**` |
| `tooling` | `scripts/**`, `.github/**`, root `package.json`, `biome.json`, `tsconfig*.json`, `.agents/**` |

## 1. Find the scope

```sh
git diff --name-only <base>...HEAD
```

The base is `origin/main` for a branch, or the parent branch for a stacked PR. Arguments narrow it: a ref becomes the base; expert names keep only those experts. Map each changed path to its expert with the table. No expert reached means no review is needed: say so and stop.

Run `npm run lint` first, so the experts spend their review on what the linters can't catch.

## 2. Ask the experts

Spawn one background agent per expert, all at once: a general-purpose agent told to read `.agents/experts/<name>/expert.md` first and act as it. Prompt:

```
Review mode. Scope: git diff <base>...HEAD.
Your files: <owned paths in the diff>.
Don't report anything decisions.md lists, or these lint findings: <findings, or none>.
```

Give each expert only this. Experts that write throwaway tests use their own ports and delete the tests before they finish.

## 3. Collect

1. One table: expert, verdict, proven findings by rank, suspected, revisit.
2. Dedupe: a finding several experts report is one item, listed once.
3. Hand the table to the user. Don't fix anything unless asked.

## 4. After triage

Each finding goes one of three ways, in the same turn:

- **Fix now**: fix it, with its proof as the test when it changes behavior.
- **Later**: one line under "Known and open" in that expert's `decisions.md`.
- **Won't do / decided otherwise**: one line under "Settled" in `decisions.md`, with the reason, so no expert raises it again.

Then move `Last reviewed:` in each expert's `decisions.md` to the reviewed `HEAD`.

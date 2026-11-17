# Experts

One expert per area of Charts: `charts`, `docs` and `tooling`. Each folder holds who the expert is, what it knows and its review checklist in `expert.md`, and what's already decided in `decisions.md`. The [`expert-review`](../skills/expert-review/SKILL.md) skill runs them.

## Every expert

Read before every task:

1. Your `expert.md` and `decisions.md`. Never re-raise a **Settled** item as a finding. If new facts show a decision was wrong, say which fact, once, under "Revisit".
2. `AGENTS.md`, and the specs in `docs/superpowers/specs/` your `expert.md` names.
3. The installed docs of the libraries your area uses (`node_modules/<pkg>`), then only the code the task needs. Trust the installed version over memory.

Two modes:

- **Question.** Answer it directly, first sentence first. Back every claim with a file and line, a test you ran, or a docs page. If you're guessing, say so.
- **Review.** You get a scope: a diff (`git diff <base>...HEAD -- <paths>`) or files. Review only that scope and what it touches. Prove every finding: a failing throwaway test, a repro you ran, or a measurement. What you couldn't reproduce goes under "Suspected". Hand back a two-sentence verdict; findings ranked by how much they'd stop an expert in your area adopting the code, each with its proof, the idiomatic version and the file to fix; then "Suspected" and "Revisit".

Rules:

- Read only unless the task says to fix. Never commit, push, open PRs or publish.
- Delete throwaway tests before you finish. Give every server you start its own port, and check exit codes.
- Ignore what `npm run lint` already reports.

# Main branch protection

Kind UI uses a small, owner-led contribution workflow. Protect `main` with pull requests and the existing aggregate CI checks, while allowing the owner to merge their own passing PRs. The reviewable configuration is [`.github/main-ruleset.json`](../.github/main-ruleset.json); committing that file alone does not enable protection on GitHub.

The [live main ruleset](https://github.com/bhaveshchow20/kind-ui/rules/24283802) was enabled on September 30, 2026. GitHub API read-back confirmed active enforcement, no bypass actors, all four rule types and `main` reporting `protected: true`. This records configuration verification; the next ordinary PR should verify the merge experience.

## Lessons from established OSS projects

Research checked on September 30, 2026, against these source snapshots:

| Project | Observable practice | Application to Kind UI |
| --- | --- | --- |
| React | Its runtime workflow runs on pull requests and pushes to `main`/release branches, uses a frozen lockfile, and separates runtime jobs from compiler changes. | Check proposed changes before merge and keep checking the default branch afterward. Preserve npm and the existing lockfile here. |
| Radix Primitives | Its PR build workflow runs lint, composed-ref checks, builds and tests; a separate SSR workflow checks its Next.js consumer. | Require existing component, package-consumer and browser contracts, rather than adding unrelated checks. |
| TanStack Query | Its PR workflow gives the test job an explicit name, cancels superseded runs, and separates testing from preview/version jobs. | Gate on predictable test check names. Keep optional review tooling separate from required CI. |

Sources: [React runtime workflow](https://github.com/facebook/react/blob/7c6ac13e19fef500b7f669a16bbd01ecc95965ca/.github/workflows/runtime_build_and_test.yml), [Radix build workflow](https://github.com/radix-ui/primitives/blob/f7ecd5ab16f5e1e820eb5786a1419a98a2d594ae/.github/workflows/build.yml), [Radix SSR workflow](https://github.com/radix-ui/primitives/blob/f7ecd5ab16f5e1e820eb5786a1419a98a2d594ae/.github/workflows/ssr.yml), and [TanStack PR workflow](https://github.com/TanStack/query/blob/381e25494dab66c9c09a64e209e8c4ca7d36aad3/.github/workflows/pr.yml).

These are observations of public source files, not claims about those repositories' required checks, approval counts or administrator bypass settings. The policy below is a recommendation for Kind UI, informed by those workflows and GitHub's rule semantics.

## Policy

Use an **active branch ruleset** targeting exactly `refs/heads/main`, with no bypass actors. Keep feature and stacked PR branches outside its scope. Rulesets expose active rules to readers and combine with other applicable protections; inspect existing rules before adding or changing them. [GitHub ruleset overview](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

| Rule | Setting |
| --- | --- |
| Restrict deletions | Enabled |
| Block force pushes | Enabled |
| Require pull request | Enabled |
| Required approving reviews | Zero |
| Require code-owner or latest-push approval | Disabled |
| Resolve review conversations | Required |
| Required status checks | `check (22)` and `check (24)` |
| Expected check source | GitHub Actions, app ID `15368` |
| Require branch to be up to date | Enabled |

GitHub permits required PRs without approvals. Zero approvals avoids a sole maintainer needing a second reviewer for their own PR. Review and address feedback before merging; automatic review does not replace the existing contribution expectations. Deletion and force-push restrictions preserve branch history. Strict checks validate against the current base, at the cost of rerunning CI after another merge. Binding checks to an expected app prevents another source from satisfying them. [Available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

Both required names were observed on successful GitHub Actions check runs. They are now compatibility receipts in [the CI workflow](../.github/workflows/ci.yml) for the same Node 22 pipeline: fast checks, the full packed-package gate and all four browser shards. The `(24)` label preserves the existing rule without running Node 24. Both receipts fail on failed/cancelled prerequisites and accept skipped browsers only after successful docs-only detection. Require both receipts, rather than the workflow title `CI`. Keep these names unique and coordinate any future rename with this ruleset. [Required check naming](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules).

Do not require CodeRabbit, paid integrations, deployments, signing or a merge queue for this setup. The repository's current scope provides no need for those gates. A merge queue also requires a `merge_group` workflow trigger that this CI does not have. [GitHub merge queue requirements](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue).

## Verification and maintenance

Inspect the live rule and effective branch rules with an authenticated GitHub CLI:

```sh
gh api repos/bhaveshchow20/kind-ui/rulesets/24283802
gh api repos/bhaveshchow20/kind-ui/rules/branches/main
gh api repos/bhaveshchow20/kind-ui/branches/main --jq .protected
```

After reviewing a deliberate policy change and updating the checked-in JSON, apply it to the existing rule:

```sh
gh api --method PUT repos/bhaveshchow20/kind-ui/rulesets/24283802 \
  --input .github/main-ruleset.json
```

After applying or editing the rule, read its saved configuration from GitHub and inspect the effective rules for `main`. Confirm active enforcement, the branch target, empty bypass list, both required check names and their app source. Keep the JSON synchronized with the saved rule; an exported configuration is a reproducibility aid, not ongoing enforcement.

Use the next ordinary PR to confirm GitHub requires both completion receipts and resolved conversations before offering a merge. Do not test force pushes or deletion against `main`. Required checks must report on the relevant latest commit; skipped workflows can leave a PR waiting indefinitely. Preserve the workflow's unfiltered `pull_request` trigger, and fix or rerun failed checks instead of bypassing them. [Troubleshooting required checks](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks).

Administrators can still edit the policy. Empty bypass actors means normal administrative pushes and merges must satisfy it; it does not remove administrator control over repository settings. If protection is unavailable because of access or plan limits, report the blocker without changing visibility, buying a plan or claiming the checked-in JSON protects the branch. GitHub documents ruleset availability by repository visibility and plan in its [ruleset overview](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets).

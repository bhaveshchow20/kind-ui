# Main branch protection

Kind UI uses a small, owner-led contribution workflow. Protect `main` with pull requests and the existing aggregate CI checks, while allowing the owner to merge their own passing PRs. The reviewable configuration is [`.github/main-ruleset.json`](../.github/main-ruleset.json); committing that file alone does not enable protection on GitHub.

The [live main ruleset](https://github.com/bhaveshchow20/kind-ui/rules/24283802) was enabled on September 30, 2026. GitHub API read-back confirmed active enforcement, no bypass actors, all four rule types and `main` reporting `protected: true`. This records configuration verification; the next ordinary PR should verify the merge experience.

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
| Required status checks | `All checks` |
| Expected check source | GitHub Actions, app ID `15368` |
| Require branch to be up to date | Enabled |

GitHub permits required PRs without approvals. Zero approvals avoids a sole maintainer needing a second reviewer for their own PR. Review and address feedback before merging; automatic review does not replace the existing contribution expectations. Deletion and force-push restrictions preserve branch history. Strict checks validate against the current base, at the cost of rerunning CI after another merge. Binding checks to an expected app prevents another source from satisfying them. [Available rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

The required `All checks` completion check in [the CI workflow](../.github/workflows/ci.yml) covers the Node 22 pipeline: fast checks, the full packed-package gate and all four browser shards. It fails on failed/cancelled prerequisites and accepts skipped browsers only after successful docs-only detection. Require this check, rather than the workflow title `CI`. Keep the name unique and coordinate any future rename with this ruleset. [Required check naming](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules).

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

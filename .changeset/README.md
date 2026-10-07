# Versioning and release handoff

Add a changeset for user-facing package behavior changes:

```sh
npm run changeset
npm run release:status
```

Documentation and tooling changes normally need no package release. An approved
package README refresh can use a patch changeset to update the npm page. Before 1.0, breaking
APIs increment minor; compatible fixes increment patch. The workspace remains
private at `0.0.0`. Kind charts are independently versioned.

## Version and changelog pull requests

`.github/workflows/version.yml` uses the official Changesets version action
compatible with the pinned CLI 3. It opens or updates a draft version/changelog
PR when package changesets reach main. It does not bump versions on ordinary
merges, publish packages, create tags or create GitHub Releases.

The action runs `npm run release:version`: the pinned Changesets CLI computes
and consumes the package changesets, then regenerates the npm lockfile and the
exact reviewed candidate in `.changeset/release-version.json`. Review package versions, changelog and lockfile together. GitHub
Actions must be allowed to create pull requests in repository Actions settings.
This workflow does not change that persistent setting or introduce credentials.
The default GitHub token creates PR check runs in an approval-required state;
approve those runs before review/merge. Unattended checks would require a
separately approved GitHub App or token, not a silent credential addition. See
[GitHub token workflow behavior](https://docs.github.com/en/actions/concepts/security/github_token).

The package contract still requires exactly the committed reviewed version; it
never accepts arbitrary stable versions. The version PR includes that policy,
its source version and consumed changeset IDs alongside the manifest, changelog
and lockfile. Review them together. No changesets means no version change.

After the version PR merges, the release workflow reconstructs the previous main
Changesets plan and requires an exact match. Ordinary main merges do not publish.
Manual dispatch can rehearse the current reviewed version; recover a failed
version merge by rerunning its original workflow, rather than dispatching a later
main commit. [Release automation](../docs/release-automation.md) describes the
publishing gate, identities, verification and retry behavior.

## Exact artifact release

`.github/workflows/release.yml` validates eligible main on Node 22, retains tested
tarballs, downloads the Node 22 candidate from the same run, and verifies source,
receipt, SHA-256, npm integrity and matching integration evidence. Its publishing
job requires a reviewed version transition, verified public artifact and the
approved job-scoped OIDC identity in the main-only `npm-release` environment.
PR validation has no publishing identity. Account, secret and trusted-publisher
setup are separate security decisions.

For local preparation, use Node 22.12+ and npm 11.9 on PATH, including child
commands. Run `npm run check` from a clean source commit. It retains the installed
and tested artifact in `artifacts/package/`; inspect `validated-artifact.json`
and the aggregate output together. The receipt alone proves the package gate.
Version, manifest or package-source changes require a fresh tested candidate.

An explicitly authorized publication with existing npm authentication uses the
archive under `artifacts/package/` named by the receipt's `filename` field. Check
CLI authentication with `npm whoami --registry=https://registry.npmjs.org`, then
pass that exact archive to `npm publish` with `--ignore-scripts --access public
--tag latest --registry=https://registry.npmjs.org`.

Check the receipt's SHA-256 before publication. Never repack at publication or
use `changeset publish`, which does not preserve this artifact handoff. Do not
send credentials or OTPs in chat, create placeholder versions, or upgrade npm to
introduce another publishing route.

For a workflow failure before npm publication, rerun all jobs of the original
run. Receipt/run-attempt checks intentionally reject artifacts from an earlier
attempt. After an ambiguous publication result, inspect the registry version and
`dist.integrity` before retrying; matching published bytes need no npm retry.
If npm publication succeeded but `github-release` failed, rerun only that failed
job in the original workflow run, preserving the successful upstream outputs.
Rerunning all jobs after publication skips the GitHub release because release
intent sees an already-published version. See [GitHub release and recovery](../docs/release-automation.md#github-release-and-recovery)
for the retry procedure and limits. Published versions are immutable.

Verify the exact `package.name` and `package.version` from the reviewed receipt
in a fresh registry-installed consumer, including strict TypeScript, the
stylesheet and a rendered LineChart. Compare registry integrity with the
retained artifact. Record publication and consumer results in
the release evidence; an authenticated website session alone does not establish
CLI authentication or package publish rights.

For subsequent GitHub-hosted publication, preserve the same full validation and
exact-artifact checks. Trusted publishing uses job-scoped `id-token: write` and a
protected release environment; adding trust or persistent permissions requires
approval. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

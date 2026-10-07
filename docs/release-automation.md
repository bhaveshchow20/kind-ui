# Charts release automation

A feature adds a package changeset. The pinned Changesets version action opens a
draft version PR; merging that reviewed PR selects the release. Ordinary main
merges do not bump versions or publish packages.

## Version review

`npm run release:version` preserves the existing Changesets CLI 3 and npm 11.9.
It updates the package manifest, changelog, npm-generated lockfile and
`.changeset/release-version.json`. That policy names one exact version, its
previous version and the consumed changeset IDs. The private root remains 0.0.0.
No pending package changesets means no version changes.

The release intent reconstructs the first parent's manifests, lockfile and
changesets in a disposable workspace and asks the same pinned CLI for its plan.
It rejects a fabricated manifest/policy bump, stale plan, another package,
private or prerelease charts, missing changelog and unconsumed changesets.
Refresh a version PR if newer package changesets reach main before it merges.

## Batch the next release

Starting from shipped `0.1.1`, feature PRs add changesets without changing the
package version. For example, a feature changeset begins with:

```md
---
"@kind-ui/charts": minor
---

Describe the feature for consumers.
```

Merge the intended feature and fix PRs first. Changesets updates the same draft
version PR as that batch grows. A minor changeset plus any patch changesets in
that batch produces one `0.2.0` version PR, with one changelog and all consumed
IDs in the reviewed policy. Keep that PR unmerged until the batch is complete;
then run its required CI and review before merging it. A later feature merge
after that version PR belongs to a later release. This example does not execute
versioning or authorize publication now.

## Artifact and publication

Only canonical `bhaveshchow20/kind-ui` main pushes and explicit main dispatches
enter the pipeline. A real version transition runs the full Node 22 validation
used by the current release workflow. Publication depends on validation and
artifact verification. Required PR CI remains the separate fail-closed “All checks”
gate; release validation also runs the complete `npm run check` on the merged commit.

The Node 22 tarball is retained from that exact run and attempt. Both verifier
and publisher require its immutable source commit, clean checkout, version,
SHA-256, SHA-512 integrity and matching integration evidence. They never rebuild
or repack it. The publisher runs `npm publish <verified.tgz> --ignore-scripts`
with public access and `latest`.

The intent skips versions already present on npm. The verifier compares any
existing version's integrity with the tested artifact, including retries; a
mismatch fails rather than retrying publication. The publisher rechecks absence
and integrity immediately before its command. It rejects a downgrade of latest.
Registry failures are errors, never proof of absence.

After publication, anonymous verification checks latest, metadata integrity and
the downloaded archive bytes. It allows up to ten registry reads, 30 seconds
apart, while the version is absent from metadata; it never republishes during these reads. Once the version appears, stale latest,
archive availability and integrity failures stop verification. After an
ambiguous result, inspect the public version and integrity before retrying.
Rerun all jobs of the original workflow; run-attempt guards reject stale artifacts.
A dispatch of a later ordinary main commit is validation only.

## Approved identity and activation

The approved draft activates only the publisher's OIDC identity. Its condition
requires canonical main, a validated release intent and a verified public
candidate. The `npm-release` environment independently restricts the branch to
main. No package is published by editing or merging this setup alone.
The existing local 0.1.1 publication does not prove that hosted OIDC works; no
extra package version is published to test setup.

The approved npm trust is limited to `@kind-ui/charts`, GitHub repository
`bhaveshchow20/kind-ui`, workflow filename `release.yml`, environment
`npm-release`, and direct `npm publish`. It does not grant dist-tag management
or introduce a token. Release jobs retain npm 11.9. A setup-only official npm
11.21 CLI can configure trust without changing the repository toolchain.

The GitHub environment allows the branch `main` only. The publisher alone gets
`id-token: write`; other release jobs retain `contents: read`. The OIDC subject is
`repo:bhaveshchow20/kind-ui:environment:npm-release`, and the workflow is
`bhaveshchow20/kind-ui/.github/workflows/release.yml@refs/heads/main`.
Do not cache release dependencies or outputs.

The approved repository Actions setting permits version PR creation while the
default workflow permission stays read-only. Only the version job has
`contents: write` and `pull-requests: write`; it creates/updates PRs and does not
approve them. With the default GitHub token, bot-created PR checks still need a
writer to approve workflow execution. Unattended bot CI would require a separately
approved GitHub App or token and is outside this setup.

GitHub tags and GitHub Release creation are outside this workflow. If added
later, they should follow successful anonymous npm integrity verification and
point to the exact source commit. The raw tarball publication command does not
produce the Changesets publishing action's structured published-package output.

## Verified setup and remaining proof

The official npm CLI created the approved trust and a separate authenticated
read verified its configuration:

- Package: `@kind-ui/charts`
- Provider: GitHub
- Trust ID: `1a7824a6-aa41-4b89-9e1a-6ec4a36c8402`
- Repository: `bhaveshchow20/kind-ui`
- Workflow: `release.yml`
- Environment: `npm-release`
- Registry permissions: `createPackage`, `createStagedPackage`

Creation requested `--allow-publish` only. npm adds its default stage-publish
capability; no staged-publish flag or dist-tag management permission was requested.
The existing GitHub environment still has exactly one branch policy (`main`),
and Actions PR creation is enabled while default token permissions remain `read`.
The account login was refreshed through npm's official browser handoff; no
credential value or token is stored in this repository.

The publisher's `needs: [plan, verify]` remains. Only that job gains
`id-token: write`, uses `npm-release` and configures the public npm registry URL.
Version and validation jobs have no OIDC permission. Required full checks remain
pending coordinated verification of the final draft. Hosted OIDC execution can
only be proven by the next authorized real release; do not publish a test version
to prove setup. A normal main merge with no version transition cannot publish.

## Sources and choices

- [Official npm trusted publishing](https://docs.npmjs.com/trusted-publishers/):
  exact workflow/environment claims, explicit direct publication permission,
  uncached release builds and automatic provenance.
- [Official npm trust CLI](https://docs.npmjs.com/cli/v11/commands/npm-trust/):
  supported configuration command and account 2FA requirements.
- [GitHub token workflow behavior](https://docs.github.com/en/actions/concepts/security/github_token):
  approval-required bot PR checks.
- [Pinned Changesets version action](https://github.com/changesets/action/tree/ae32849d5ba541f9ae29e40e22a623bc13562f51/version):
  the existing version-only action remains separate from publication.

The package's retained exact-archive handoff is preserved rather than replacing
it with directory publication or parallel test/publish jobs. Documentation
publishing remains independent of npm publication.

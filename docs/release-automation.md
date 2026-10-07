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

The preparation draft keeps publication hard-disabled. Activation requires the
approved trust to be verified, a reviewed publish-job condition requiring the
validated release intent and public candidate, and the protected environment.
The existing local 0.1.1 publication does not prove that hosted OIDC works; no
extra package version is published to test setup.

The approved npm trust is limited to `@kind-ui/charts`, GitHub repository
`bhaveshchow20/kind-ui`, workflow filename `release.yml`, environment
`npm-release`, and direct `npm publish`. It does not grant dist-tag management
or introduce a token. Release jobs retain npm 11.9. A setup-only official npm
11.21 CLI can configure trust without changing the repository toolchain.

The GitHub environment allows the branch `main` only. After a separately approved activation, the publisher alone gets
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

## Setup checkpoint and remaining gate

Read-only checks on this computer confirmed the existing GitHub environment has
exactly one branch policy (`main`) and Actions PR creation is enabled while the
default token permission remains `read`. Public npm metadata confirms `0.1.1`
but does not expose a trusted-publisher configuration. The installed npm 11.9
supports OIDC publishing but not the newer `npm trust` management command; the
previous setup-only CLI and browser authentication session are not resumed.
The earlier trust-creation attempt ended with an authentication `E404`; no
successful trust creation is recorded. Existing trust must be read back before
assuming it is absent or creating a duplicate.

The remaining setup action needs fresh approval for an official authenticated
trust read (and browser 2FA if npm requires it). Only if that proves the entry
missing, separately approve creation for `@kind-ui/charts`, GitHub repository
`bhaveshchow20/kind-ui`, workflow `release.yml`, environment `npm-release`, with
direct publication allowed and no additional dist-tag permission.

After that identity is verified, a separate reviewed activation would replace
the false gate with the following condition and publisher-only configuration:

```yaml
if: >-
  github.repository == 'bhaveshchow20/kind-ui' &&
  github.ref == 'refs/heads/main' &&
  needs.plan.outputs.publish == 'true' &&
  needs.verify.outputs.publishable == 'true'
permissions:
  contents: read
  id-token: write
environment: npm-release
```

The publisher's existing `needs: [plan, verify]` must remain, and setup-node must
use the public npm registry URL. The version and validation jobs must retain
read-only OIDC access. Required full checks and hosted OIDC execution remain
unverified for this preparation draft; no test version should be published to
prove setup. A normal main merge with no version transition cannot publish.

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

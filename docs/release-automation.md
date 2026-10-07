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

## Artifact and publication

Only canonical `bhaveshchow20/kind-ui` main pushes and explicit main dispatches
enter the pipeline. A real version transition runs the full Node 22/24 validation
matrix. Publication depends on both validations and artifact verification.

The Node 24 tarball is retained from that exact run and attempt. Both verifier
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
apart, for propagation; it never republishes during these reads. After an
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

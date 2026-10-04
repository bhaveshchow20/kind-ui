# Versioning and release handoff

Use the pinned official Changesets CLI for version/changelog preparation:

```sh
npm run changeset
npm run release:status
npm run release:version
```

Add a changeset for package behavior changes; documentation/tooling-only changes
need none. Before 1.0, use a minor bump for breaking APIs and patch for compatible
fixes. The version command also regenerates the npm lockfile. Review generated package
versions, changelog and lockfile together.
The workspace stays private. Private package versioning is enabled so a reviewed
first-version commit can be prepared before publication; tagging is disabled.
The first reviewed candidate is `0.1.0`, including its generated changelog.

The package currently remains private at `0.1.0`. Its package contract rejects
other versions and publication enablement until a separately approved change
updates that policy. Running `release:version` is an explicit
local source edit, never an automatic merge action. Do not use `changeset publish`:
it does not implement this repository's exact-tested-tarball handoff.

`.github/workflows/release.yml` is manual and restricted to `main`. It runs full
Node 22/24 validation, retains the exact tested tarballs, then downloads the Node
24 candidate from the same run and verifies its receipt, checksums, source and
integration evidence. The verification summary is the review handoff. A private
versioned run is a rehearsal, not a publishable candidate.

If a run fails, choose **Re-run all jobs**. Artifact names and receipts include
the run attempt, so a partial verification/publish retry cannot reuse a candidate
from an earlier attempt. This rejection is intentional; keep it intact.
After an ambiguous publication result, inspect the registry version and
`dist.integrity` against the selected candidate before attempting any retry.
An already-published version is immutable: do not republish it or silently select
new bytes/version; investigate a mismatch and prepare a separately reviewed
version if necessary. A successful matching publication needs no publish retry.

The publishing job is hard-disabled. This PR grants no OIDC permission, creates no
GitHub environment/trust/account/credential, publishes nothing and creates no
tags or GitHub Releases. After owner approval, the activation change must replace
that disabled condition with the manual-main condition, add job-scoped
`id-token: write` to that job and bind it to the protected `npm-release`
environment. Preserve `contents: read` and leave PR CI without publishing identity.

Current repository setup values for the proposed npm trusted publisher (reconfirm
identity before activation if an organization/repository move is approved):

| Field | Value |
| --- | --- |
| GitHub organization/user | `bhaveshchow20` |
| Repository | `kind-ui` |
| Workflow filename | `release.yml` |
| Environment | `npm-release` |
| Allowed action for this direct-publish design | `npm publish` |

The owner must confirm scope/name control, approve first version/dist-tag/support
boundaries, establish private security reporting, and configure environment
reviewers plus npm trust. These account/access decisions remain outside this PR.
[npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) needs npm
11.5.1+ and Node 22.14+; Node 24/npm 11.9 meet that requirement. OIDC publishing
from a public repository/package generates provenance automatically.

Bootstrap decision: recommend an owner-authenticated first publication of the
selected, verified versioned tarball with 2FA, then configure package-level trust
for subsequent manual runs. Never send credentials/OTP in chat. Alternatively,
[npm staging](https://docs.npmjs.com/staged-publishing/) requires npm 11.15+ and
creates a publicly visible `0.0.0-stage` placeholder for a new package. It requires
separate publication approval and a reviewed npm upgrade; it is not a dry run.
No bootstrap action is performed here.

After an explicitly authorized publication, compare the registry version,
`dist.integrity` and downloaded package with the selected candidate, verify its
provenance, and rerun an ordinary registry-installed consumer. Only then migrate
docs installation examples to that verified version, retain stylesheet/client
boundary instructions and the tested package-manager caveats, and remove local
tarball references from user-facing installs. Docs app/homepage edits are separate.

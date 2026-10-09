# Skill sources and updates

These repository-local references are selected from Vercel Agent Skills. The upstream source was independently checked at the pinned revision below; local adaptations are documented for each selected guide.

## React composition patterns

- Upstream: [Vercel Agent Skills, `composition-patterns`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The guide is credited to Vercel Engineering; no individual author is identified in the upstream skill files.
- The composition rule files are sourced from this revision. Local correctness edits: `architecture-compound-components.md` and `state-context-interface.md` now narrow nullable context reads and type nullable refs; `state-decouple-implementation.md` fixes mismatched callback names; `state-lift-state.md` drops an incomplete ref-only example. The skill file adds a note to read individual rules on demand.

## Selected React rendering performance rules

- Upstream: [Vercel Agent Skills, `react-best-practices`](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices)
- Pinned source revision: `063bee94c3f4df8453406c830b0a7df0f2860278` (2026-08-28)
- Skill metadata identifies Vercel as author and MIT as the license. The upstream README credits the guide's original creation to [Shuding (@shuding)](https://x.com/shuding) at Vercel.
- This repo includes only `rerender-derived-state-no-effect`, `rerender-lazy-state-init`, and `rerender-no-inline-components`, sourced from this revision. In `rerender-lazy-state-init.md`, the examples were adapted to avoid stale prop-derived state and browser-only storage access during server rendering; the local `SKILL.md` describes this focused subset, not the full upstream skill.

The Vercel Agent Skills repository declares MIT in its root README, and both upstream skill manifests declare MIT. Keep that license and attribution information with these references. To update, compare the selected upstream files at a new commit SHA, review each rule and author/license notice, retain only rules useful to this React component library, then update the pin and these notes. Do not run a floating/latest installer update without review.

## Kind AI setup selection (2026-10-09)

Four project-local guides were added for AI work; the existing React guides above were reused without updating or duplicating them. Installation copied reviewed declarative text and license notices only. Skill installation ran no upstream executable installer or lifecycle script and changed no MCP, global agent, or deployment configuration. No skill-installer guide was found in the available catalog or selected executor's skill locations.

### AI SDK: scoped adaptation

- Maintainer source: [Vercel AI, `skills/use-ai-sdk/SKILL.md`](https://github.com/vercel/ai/blob/e00b1b14e99b9f0fcb5e49848b26ff84613ea067/skills/use-ai-sdk/SKILL.md)
- Revision: `e00b1b14e99b9f0fcb5e49848b26ff84613ea067`
- License: Apache-2.0. Upstream's root copyright/license notice is retained as `ai-sdk/NOTICE`; the full Apache 2.0 terms are in `ai-sdk/LICENSE`.
- Installed: `ai-sdk/SKILL.md`, a Kind adaptation. Retains version-matched docs/source verification and typechecking. Adds SDK isolation, stable identities, and deterministic host-owned integration checks.
- Removed scope: automatic dependency installation, gateway authentication, model/provider selection, agents, DevTools setup, and upgrade recommendations. Setup sessions must not install dependencies solely because this upstream skill says to ensure the SDK is installed.
- Applied: inspected the temporary `ai@7.0.136` bundled UI message types, tool-usage docs, and action implementation while writing the mapping/acknowledgement contract. Manifest and lockfile changes were reverted; the final workspace declares no SDK dependency.

### Accessibility: focused Web Interface Guidelines

- Skill source: [Vercel Agent Skills, `web-design-guidelines`](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md)
- Rules source: [Vercel Web Interface Guidelines, `command.md`](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md)
- Revisions: `063bee94c3f4df8453406c830b0a7df0f2860278` and `434b7f91364665f2f733b310ec54809bf8f37937`
- License: MIT; full Vercel Labs notice retained in `web-design-guidelines/LICENSE`.
- Installed: `web-design-guidelines/SKILL.md`, a focused local adaptation. No floating rule fetch or `install.sh` execution. The reviewed upstream installer downloads from main and writes global agent configuration; those actions were unnecessary here.
- Changes: selected semantic HTML, form, focus, hydration, content, and interruptible/reduced-motion checks. Clarified that native controls do not need duplicate keyboard listeners. Removed page-level URL synchronization, fonts, theme, navigation guards, automatic virtualization, and blanket style prescriptions.
- Applied: added keyboard, IME, focus, motion, and scroll-position acceptance cases. These are future checks; no UI accessibility result is claimed by setup.

### Documentation: focused Writing Guidelines

- Skill source: [Vercel Agent Skills, `writing-guidelines`](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/writing-guidelines/SKILL.md)
- Rules source: [Vercel Writing Guidelines, `command.md`](https://github.com/vercel-labs/writing-guidelines/blob/83e2316b034cf572400513538e4e4da01c4cc742/command.md)
- Revisions: `063bee94c3f4df8453406c830b0a7df0f2860278` and `83e2316b034cf572400513538e4e4da01c4cc742`
- License: MIT; full Vercel Labs notice retained in `writing-guidelines/LICENSE`.
- Installed: `writing-guidelines/SKILL.md`, a focused local adaptation. No floating rule fetch. Retains accuracy, active voice, meaningful links, examples, audience, and support limits.
- Removed scope: Vercel site metadata/components, dashboard links, latest-model defaults, enterprise-provider policy, publishing, team notifications, and prescribed editor modes.
- Applied: reviewed `docs/ai-foundations.md` for status clarity, state ownership, source links, planned versus tested behavior, and concrete follow-up sessions.

### Original Kind routing guide

`kind-ai-components/SKILL.md` is original Kind UI text under the repository's MIT license. It routes component API and React performance work to the existing selected guides and links official Base UI, Motion, and Playwright documentation. It copies no premium examples or vendor implementation. Applied to package boundaries, primitive selection, host state ownership, motion checks, and the test plan.

### Reviewed alternatives not installed

| Candidate | Evidence reviewed | Decision |
| --- | --- | --- |
| Base UI maintainer review skill | [Entry point](https://github.com/mui/base-ui/blob/7e4b2f921cf0cafd62ea294675f1d670d1292dec/.agents/skills/base-ui-review/SKILL.md), repository license and explicit opt-in scope | Intended for named Base UI diff reviews, with optional agent fan-out and PR comments; not a consumer API skill. Use official composition/accessibility/animation docs through the Kind guide. |
| Motion AI Kit | [Official docs](https://motion.dev/docs/ai-kit), `motion-ai@14.1.0` npm manifest, skill and React/Base UI rule files, `dist/install.js`; [source checkout](https://github.com/motiondivision/ai-kit/tree/d1c5c26f424adfd47c112d894e9d424b57338c7e) | npm package declares MIT. CLI also installs MCP configuration and contains optional paid workflows. The selected source checkout is 14.0.0, so it is not the npm 14.1.0 source pin. Install neither CLI nor copied rules; link public docs from the original Kind guide. |
| Playwright maintainer CLI/component-testing skills | Official [CLI skill](https://github.com/microsoft/playwright-cli/blob/main/skills/playwright-cli/SKILL.md) entry and executor-bundled component-testing guide | CLI installation and a new story gallery do not fit the existing Vite/Playwright tests. Reuse the repository harness and official best-practice/accessibility docs. |
| Third-party Motion/MUI collections | Search surfaced community guides; not selected for installation | Official docs cover the needed consumer contracts. No unrecognized executable source is needed. |
| Full Vercel React/Next.js guide | Existing focused subset and source notes | Reuse the three selected React rules; do not add unrelated application/server optimizations. |

Motion's inspected Base UI rule bans function/spread `render`, but [current Base UI animation docs](https://base-ui.com/react/handbook/animation) show both element and function composition. Verify the chosen primitive's API instead of importing that blanket restriction. Motion's skill also directs server-dependent workflows to MCP; those are outside this setup.

The inspected Motion npm tarball had integrity `sha512-VZv/lT66HSH+WqM+xJDryQ/uGk6j7cadLm+qgrdPav3nLncryFVqtMl5bLc98WLQjT3KBZ94f6iwTVnZHvZ78A==`. It was downloaded for inspection with scripts disabled and extracted in `/tmp`, not installed into the project. No instructions from a downloaded executable were run.

### Review and update procedure

[provenance.json](provenance.json) records source revisions and SHA-256 values for selected upstream inputs and installed files. Hashes identify reviewed content; they are not a signature or automatic trust grant. Recheck official APIs at the implementation's pinned dependency versions. To update a skill, inspect the new source, referenced files, licenses, and executable side effects, review any scope changes, then update the adaptation and provenance together. Do not run a floating installer to refresh these guides.

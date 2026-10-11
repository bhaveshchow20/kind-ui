# Skill sources and updates

## Complete upstream selection (2026-10-10)

Eight public upstream skills are vendored intact under `.agents/skills/`. All files
in each selected upstream directory are included byte-for-byte: frontmatter,
compiled guides, examples, rules, references, agent metadata, assets, and the
shadcn coverage helper. No upstream installer, helper, CLI, or example command
was executed during installation. No unrelated upstream skills were installed.
Repository routing and precedence live in `AGENTS.md`, outside these distributions.

| Directory | Original source at exact revision | Attribution | License evidence |
| --- | --- | --- | --- |
| `composition-patterns` | [vercel-labs/agent-skills: skills/composition-patterns](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/composition-patterns) (`063bee94c3f4df8453406c830b0a7df0f2860278`) | Vercel Engineering | Root README declares MIT; retained in `licenses/vercel-agent-skills/README.md` |
| `react-best-practices` | [vercel-labs/agent-skills: skills/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/react-best-practices) (`063bee94c3f4df8453406c830b0a7df0f2860278`) | Vercel Engineering; original creation credited to Shuding in upstream README | Root README declares MIT; retained in `licenses/vercel-agent-skills/README.md` |
| `web-design-guidelines` | [vercel-labs/agent-skills: skills/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines) (`063bee94c3f4df8453406c830b0a7df0f2860278`) | Vercel | Root README declares MIT; retained in `licenses/vercel-agent-skills/README.md` |
| `codebase-design` | [mattpocock/skills: skills/engineering/codebase-design](https://github.com/mattpocock/skills/tree/49dd158d1076134a641b33efb035946536778336/skills/engineering/codebase-design) (`49dd158d1076134a641b33efb035946536778336`) | Matt Pocock | Root MIT notice copied unchanged to `codebase-design/LICENSE` |
| `accessibility` | [addyosmani/web-quality-skills: skills/accessibility](https://github.com/addyosmani/web-quality-skills/tree/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/accessibility) (`afa8da942115f2961fdbfa80807ea0b232ff6c00`) | Addy Osmani | Root MIT notice copied unchanged to `accessibility/LICENSE` |
| `emil-design-eng` | [emilkowalski/skills: skills/emil-design-eng](https://github.com/emilkowalski/skills/tree/e8a175de22ae1e49370fc144c1f3bb9aeedf988d/skills/emil-design-eng) (`e8a175de22ae1e49370fc144c1f3bb9aeedf988d`) | Emil Kowalski | Root MIT notice copied unchanged to `emil-design-eng/LICENSE` |
| `review-animations` | [emilkowalski/skills: skills/review-animations](https://github.com/emilkowalski/skills/tree/e8a175de22ae1e49370fc144c1f3bb9aeedf988d/skills/review-animations) (`e8a175de22ae1e49370fc144c1f3bb9aeedf988d`) | Emil Kowalski | Root MIT notice copied unchanged to `review-animations/LICENSE` |
| `shadcn` | [shadcn-ui/ui: skills/shadcn](https://github.com/shadcn-ui/ui/tree/c2a67849be260701852b0977ba15eb5f3a0ce2a4/skills/shadcn) (`c2a67849be260701852b0977ba15eb5f3a0ce2a4`) | shadcn | Root MIT notice copied unchanged to `shadcn/LICENSE.md` |

The composition and React performance guides replace the earlier local edits and
three-rule subset. The web interface guide replaces its focused local adaptation.
Other existing local guides and `skills/kind-ui-charts/` are unchanged. The setup
history below records their earlier selection decisions, not current limits on
these eight complete distributions.

### Licenses and additional source files

Vercel Agent Skills declares MIT in its root README; composition and React
performance frontmatter also declares MIT. The pinned repository has no standalone
root LICENSE or copyright notice to copy. Its complete root README is preserved
unchanged rather than inventing license wording or a copyright holder.

The web interface skill delegates to an external rules document. A reviewed
snapshot is included at `web-design-guidelines/references/command.md`, with the
original MIT copyright notice at `web-design-guidelines/LICENSE`, from
[Vercel Web Interface Guidelines at `434b7f91364665f2f733b310ec54809bf8f37937`](https://github.com/vercel-labs/web-interface-guidelines/tree/434b7f91364665f2f733b310ec54809bf8f37937).
These are supplemental files; the skill entry point remains unchanged. Its
instruction to fetch `main` remains floating, so a live review may use newer
rules than this snapshot. Record the actual fetched revision when reproducibility
matters. Installation itself uses only exact source revisions.

### Known upstream limitations

- `react-best-practices/AGENTS.md` contains three broken relative links:
  `./async-defer-await.md`, `./async-cheap-condition-before-await.md`, and
  `./server-hoist-static-io.md`. Their files exist in `rules/`; the compiled
  upstream links are preserved, not patched or duplicated.
- Vercel's skill READMEs describe upstream authoring/build commands and, for React,
  `src/` and `test-cases.json` that are absent from the pinned skill directory.
  The distribution is complete as shipped; it is not a standalone authoring tool.
- `accessibility/SKILL.md` links to `../web-quality-audit/SKILL.md`. That is an
  optional related skill outside this selection; it remains uninstalled. Its
  required local `references/WCAG.md` and `references/A11Y-PATTERNS.md` are included.
- `codebase-design/DESIGN-IT-TWICE.md` asks for `GLOSSARY.md` vocabulary, but upstream
  provides no such file in this distribution. Treat it as project-supplied context
  when that workflow is relevant; no glossary or additional skill was invented.
- `review-animations` preserves `disable-model-invocation: true`; select it for an
  explicit motion review. Its `STANDARDS.md` is included unchanged.
- shadcn's skill assumes CLI-injected project context and an existing integration.
  It preserves `user-invocable: false`, `allowed-tools` command patterns, and
  shell-injection syntax for `npx shadcn@latest info --json`. A supporting skill
  host may execute that floating CLI when loading the skill; host behavior and
  network/dependency authorization must be checked before such invocation. Plain
  file reads during this installation executed no injection.
  Vendoring does not provide that context, install components, configure MCP, or
  execute its helper. The helper reads local source and reports coverage; it was
  inspected, not run. References to a project's `DESIGN.md`, source paths, and
  example URLs are inputs/examples, not missing distribution files. Agent icon
  paths are relative to the skill root, where both original assets are included.

Upstream examples and broad prescriptions may need API/version verification and
measured evidence before applying them here. Their preservation does not certify
every example or make every rule applicable to a composable chart library.

### Reproducible verification and updates

[upstream-lock.json](upstream-lock.json) records each exact repository, commit,
source directory, installed/source path mapping, and SHA-256 for every vendored
file and supplemental notice. Hashes establish content identity, not signatures.
The retained local adaptations use [provenance.json](provenance.json) separately.

Run offline integrity and discovery checks from the repository root:

```sh
node .agents/skills/verify-upstream.mjs
```

For independent byte comparison, download each original repository's archive at
the exact `revision` in the lock, for example
`https://codeload.github.com/<repository>/tar.gz/<revision>`. Extract its top-level
contents into `<source-root>/<owner>__<repository>/`, including the supplemental
`vercel-labs__web-interface-guidelines` source, then run:

```sh
node .agents/skills/verify-upstream.mjs --source-root <source-root>
```

The verifier checks SHA-256, complete file inventories, discovery frontmatter and
unique selected skill names, license/supplemental files, expected missing relative
links, and optionally compares every file byte-for-byte with extracted sources. It performs no network requests,
source mutations, or upstream script execution.

To update, resolve a new exact upstream commit; inspect the selected directory,
all references, executable helpers, and license/copyright changes. Copy the entire
reviewed distribution unchanged, remove obsolete files, retain required notices,
review missing links and material limitations, and update the lock and these notes
together. Use the verifier against independently downloaded pinned sources, run
`npm run format` and the repository's full `npm run check`, then open a focused PR.
Do not refresh through a floating installer or narrow/rewrite upstream advice.

Biome excludes only the eight vendored skill directories and the upstream license
evidence directory so formatting cannot change their bytes or lint their example
assets as application code. Repository-authored routing, provenance, and verifier
remain checked. No runtime or browser verification gate is disabled.

## Kind AI setup selection (2026-10-09)

Four project-local guides were added for AI work; the existing React guides above were reused without updating or duplicating them. Installation copied reviewed declarative text and license notices only. Skill installation ran no upstream executable installer or lifecycle script and changed no MCP, global agent, or deployment configuration. No skill-installer guide was found in the available catalog or selected executor's skill locations.

### AI SDK: scoped adaptation

- Maintainer source: [Vercel AI, `skills/use-ai-sdk/SKILL.md`](https://github.com/vercel/ai/blob/e00b1b14e99b9f0fcb5e49848b26ff84613ea067/skills/use-ai-sdk/SKILL.md)
- Revision: `e00b1b14e99b9f0fcb5e49848b26ff84613ea067`
- License: Apache-2.0. Upstream's root copyright/license notice is retained as `ai-sdk/NOTICE`; the full Apache 2.0 terms are in `ai-sdk/LICENSE`.
- Installed: `ai-sdk/SKILL.md`, a Kind adaptation. Retains version-matched docs/source verification and typechecking. Adds SDK isolation, stable identities, and deterministic host-owned integration checks.
- Removed scope: automatic dependency installation, gateway authentication, model/provider selection, agents, DevTools setup, and upgrade recommendations. Setup sessions must not install dependencies solely because this upstream skill says to ensure the SDK is installed.
- Applied: inspected the temporary `ai@7.0.136` bundled UI message types, tool-usage docs, and action implementation while writing the mapping/acknowledgement contract. Manifest and lockfile changes were reverted; the final workspace declares no SDK dependency.

### Accessibility: historical focused Web Interface Guidelines

- Skill source: [Vercel Agent Skills, `web-design-guidelines`](https://github.com/vercel-labs/agent-skills/blob/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines/SKILL.md)
- Rules source: [Vercel Web Interface Guidelines, `command.md`](https://github.com/vercel-labs/web-interface-guidelines/blob/434b7f91364665f2f733b310ec54809bf8f37937/command.md)
- Revisions: `063bee94c3f4df8453406c830b0a7df0f2860278` and `434b7f91364665f2f733b310ec54809bf8f37937`
- License: MIT; full Vercel Labs notice retained in `web-design-guidelines/LICENSE`.
- Previously installed: `web-design-guidelines/SKILL.md`, a focused local adaptation, replaced by the complete upstream distribution on 2026-10-10. No floating rule fetch or `install.sh` execution. The reviewed upstream installer downloads from main and writes global agent configuration; those actions were unnecessary here.
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
| Full Vercel React/Next.js guide | Existing focused subset and source notes | Initially deferred; the complete upstream guide is now explicitly selected above. |

Motion's inspected Base UI rule bans function/spread `render`, but [current Base UI animation docs](https://base-ui.com/react/handbook/animation) show both element and function composition. Verify the chosen primitive's API instead of importing that blanket restriction. Motion's skill also directs server-dependent workflows to MCP; those are outside this setup.

The inspected Motion npm tarball had integrity `sha512-VZv/lT66HSH+WqM+xJDryQ/uGk6j7cadLm+qgrdPav3nLncryFVqtMl5bLc98WLQjT3KBZ94f6iwTVnZHvZ78A==`. It was downloaded for inspection with scripts disabled and extracted in `/tmp`, not installed into the project. No instructions from a downloaded executable were run.

### Review and update procedure

[provenance.json](provenance.json) records source revisions and SHA-256 values for the retained AI SDK and writing adaptations. The replaced web interface adaptation is now tracked in [upstream-lock.json](upstream-lock.json). Hashes identify reviewed content; they are not a signature or automatic trust grant. Recheck official APIs at the implementation's pinned dependency versions. To update a skill, inspect the new source, referenced files, licenses, and executable side effects, review any scope changes, then update the adaptation and provenance together. Do not run a floating installer to refresh these guides.

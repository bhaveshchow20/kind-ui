# Development direction

## Purpose and quality criteria

Kind UI should be kind to AI agentic stacks. Its goals are performance, accessibility, extensibility, familiar developer experience, and interoperability with agent-driven applications. Future features should make their relevant quality criteria testable: realistic performance boundaries, keyboard/assistive access, useful extension points, predictable typed contracts, and explicit lifecycle/error behavior.

For async interactions, define loading, partial, complete, and error states where they apply, including cancellation and retries. Use existing platform and library patterns; do not impose a universal state DSL or agent engine. Future examples and documentation should be useful to people and agents, with reproducible commands and actionable errors. These remain acceptance criteria, not a blanket reliability or compatibility guarantee.

## Current implementation

The workspace contains one package with React chart presentation and composed line components plus prop-controlled Motion, strict TypeScript, checks and contribution guidance. See the [component contracts](../packages/charts/README.md). There is no custom renderer, primitive engine, recipe format or CLI. The package structure does not imply a framework-neutral core.

Next, identify one concrete consumer need, evaluate established libraries that already solve its parts, and propose the smallest useful composition or integration. Review architecture and compatibility choices before implementing them. Keep each feature, integration, or tooling decision in a separate focused draft PR; stacks target their immediately preceding branch.

See [Kind UI architecture principles and acceptance criteria](agent-friendly-architecture.md) for public contracts, state boundaries, discoverability, and evidence required before claiming a reusable core or supported stack.

## Work with the ecosystem

Kind UI should compose with the capabilities already used by its consumers. Prefer familiar public APIs, composition, accessible primitives, and existing motion systems. New patterns require an unmet need and a clear justification; novelty is not a goal.

Evaluate reuse before selecting a renderer or adding geometry, state, theming, or installation infrastructure. Document alternatives, licensing, peer dependencies, bundle/runtime cost, and a compatibility-test plan. Add an integration only for a concrete consumer need; record the specific tested dependency versions rather than promising broad compatibility.

Future wrappers must preserve the relevant DOM props, accessibility attributes, refs, and handlers. Keep consumer ownership of markup, styling, state, and animation where the chosen integration requires it. Test representative host-library combinations when they are introduced.

## Scale only as needed

Use npm workspaces and explicit package exports. Add packages only for genuinely independent responsibilities. Do not invent a universal core, plugin framework, multiple adapters, or a custom builder in anticipation of hypothetical features.

Implementation PRs must add tests for their public contracts and relevant packed-consumer paths. Build output and artifacts are disposable. Accessibility, responsiveness, framework support, and performance claims need evidence before they enter documentation.

## Versioning and release policy

The workspace stays private at `0.0.0`; `@kind-ui/charts` is independently
versioned. User-facing package changes require a reviewed changeset and a
compatibility decision. Before 1.0, breaking APIs increment minor and compatible
fixes increment patch. Documentation, CI and development-only changes need no
package release.

The Changesets version workflow opens a draft version/changelog PR for pending
package changesets on main. The version command also updates the lockfile.
Ordinary merges do not bump versions. After the reviewed version PR merges,
publication follows the [exact artifact release handoff](../.changeset/README.md):
full checks, retained tested tarball, integrity verification, then publication
using approved authentication. CI success alone does not authorize publishing,
merging or persistent account/security changes.

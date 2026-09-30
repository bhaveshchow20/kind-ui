# Development direction

## Purpose and quality criteria

Kind UI should be kind to AI agentic stacks. Its goals are performance, accessibility, extensibility, familiar developer experience, and interoperability with agent-driven applications. Future features should make their relevant quality criteria testable: realistic performance boundaries, keyboard/assistive access, useful extension points, predictable typed contracts, and explicit lifecycle/error behavior.

For async interactions, define loading, partial, complete, and error states where they apply, including cancellation and retries. Use existing platform and library patterns; do not impose a universal state DSL or agent engine. Future examples and documentation should be useful to people and agents, with reproducible commands and actionable errors. These are design goals; no implementation or compatibility guarantee is made in this PR.

## Setup first

The current workspace contains one empty package, strict TypeScript, formatting/lint checks, read-only CI, and contribution guidance. There is no product API, chart renderer, primitive engine, recipe format, or CLI. The working package name and directory do not commit us to the final package architecture.

Next, identify one concrete consumer need, evaluate established libraries that already solve its parts, and propose the smallest useful composition or integration. Review architecture and compatibility choices before implementing them. Keep each feature, integration, or tooling decision in a separate focused draft PR; stacks target their immediately preceding branch.

See [Kind UI architecture principles and acceptance criteria](agent-friendly-architecture.md) for public contracts, state boundaries, discoverability, and evidence required before claiming a reusable core or supported stack.

## Work with the ecosystem

Kind UI should compose with the capabilities already used by its consumers. Prefer familiar public APIs, composition, accessible primitives, and existing motion systems. New patterns require an unmet need and a clear justification; novelty is not a goal.

Evaluate reuse before selecting a renderer or adding geometry, state, theming, or installation infrastructure. Document alternatives, licensing, peer dependencies, bundle/runtime cost, and a compatibility-test plan. Add an integration only for a concrete consumer need; setup installs none of these libraries and claims no compatibility with them.

Future wrappers must preserve the relevant DOM props, accessibility attributes, refs, and handlers. Keep consumer ownership of markup, styling, state, and animation where the chosen integration requires it. Test representative host-library combinations when they are introduced.

## Scale only as needed

Use npm workspaces and explicit package exports. Add packages only for genuinely independent responsibilities. Do not invent a universal core, plugin framework, multiple adapters, or a custom builder in anticipation of hypothetical features.

Implementation PRs must add tests for their public contracts and relevant packed-consumer paths. Build output and artifacts are disposable. Accessibility, responsiveness, framework support, and performance claims need evidence before they enter documentation.

## Versioning and release policy

Root and package stay private at `0.0.0`; CI only checks code. No releases, npm publication, deployments, credentials, or package/scope ownership are implied.

Before a first public release, explicitly decide the package set, supported environments, namespace ownership, security-reporting route, and release authorization. Adopt release tooling in a separate release-setup PR once those decisions are made. Until then, record compatibility and user-visible changes in the PR instead of maintaining fictional release notes.

The intended release policy is semantic versioning per independently versioned package. After release tooling is adopted, user-facing package changes require a reviewed changeset and compatibility decision, including the policy for pre-1.0 breaking changes. Documentation, CI, and development-only changes need no package release. A successful CI run never authorizes publishing or merging.

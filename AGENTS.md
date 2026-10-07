# Contributor and agent guide

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing this repository. Its workflow is authoritative; this file adds a short working map.

## Current state and architecture guidance

`packages/charts` exports React chart presentation and composed line components, prop-controlled Motion animation, and a default stylesheet; its README is the public API reference. Keep component props with their implementation, share only the context/config types that are needed, and keep the public index as explicit reexports. Static presentation belongs in the scoped CSS layer; data-dependent CSS variables and explicit consumer styles can remain inline. `examples/chart` consumes the exports and owns its data alternative. `tests` checks component behavior, consumer types and browser contracts. Keep geometry, axes, data and visibility state consumer-owned; do not add a universal chart schema, generic core or another package without a demonstrated need.

Build on established UI libraries. Check existing capabilities before adding primitives or infrastructure. Prefer familiar composition or a narrow integration. Preserve consumer control of styling, markup, state, refs, handlers, and animation where the API requires it. A new abstraction needs a concrete unmet need, alternatives considered, and a clear benefit beyond integration cost.

Do not install those libraries or implement a future feature just because they appear in this guidance. The current task's scope determines the work. Keep the workspace small; add package boundaries only when independently useful responsibilities are proven, rather than inventing a universal core or custom rendering/animation engine.

## Product criteria

Kind UI should be kind to AI agentic stacks: performance, accessibility, extensibility, familiarity, and agentic interoperability are review criteria. Favor predictable typed public contracts and explicit state over hidden behavior. Where a feature is asynchronous, define its loading/partial/completion/error states and cancellation/retry semantics, and test the relevant interruptions. Use familiar platform/library patterns before inventing new ones.

When documentation or tooling is introduced, make examples verifiable, errors actionable, and automation paths noninteractive where appropriate. These are future implementation standards, not a requirement to build an LLM backend, agent runtime, MCP server, or universal state DSL in setup.

## Work and verification

Use Node 22.12+ and npm 11.9. Use npm and the checked-in lockfile; do not add a second package manager.

- Install: `npm ci`
- Format: `npm run format`
- Lint: `npm run lint`
- Build/typecheck: `npm run typecheck`
- Packed-package contract: `npm run check:package`
- Component tests: `npm test`
- Chart example: `npm run dev:chart`; packed-consumer and browser checks: `npm run check:chart`
- Browser prerequisite: `npm exec playwright install -- --with-deps chromium`
- Required aggregate check: `npm run check`

Component tests use public exports and are repeated against the packed package. The package gate tests its own failure cases and checks an actual tarball in an isolated consumer; keep it in CI. When implementing behavior, introduce focused regression tests and package-consumer checks in the same PR, using exported APIs wherever practical. Test intentional error paths as well as successful input. Check the touched package and affected consumers, then run the full available aggregate check before proposing a change. Distinguish passed, failed, and unrun checks.

Keep one purpose per PR. For a stack, target the immediately preceding branch and describe only that incremental diff. Do not mix cleanup, generated output, unrelated refactors, or future features into a setup change.

Never edit `node_modules/`, `dist/`, artifacts, or caches as source. Regenerate `package-lock.json` with npm when manifests change. Keep imports within documented public exports; avoid reaching into another package's source. New dependencies and public API changes need an explicit reason and review.

## Safety and release boundaries

Never add secrets, credentials, telemetry, external uploads, or hidden network behavior. Follow [SECURITY.md](SECURITY.md) for security findings. Do not publish, deploy, merge, create release credentials, or change visibility/access unless explicitly authorized.

The workspace remains private at `0.0.0`; `@kind-ui/charts` is published on npm and independently versioned. Follow the versioning and changeset policy in [docs/development.md](docs/development.md). The existing version workflow opens one reviewed version PR for accumulated changesets; the release workflow publishes its exact validated artifact through the configured OIDC identity. Publication and persistent security changes require explicit authorization. Preserve existing user work and report blockers instead of bypassing permissions or verification.

## Optional React agent skills

For component API or composition work, read `.agents/skills/composition-patterns/SKILL.md`, then only the specific rule files needed. For React render-performance work, read `.agents/skills/react-best-practices/SKILL.md`, then only its relevant selected rule. These references are on-demand; do not load the full set by default or treat guidance as a substitute for the current library API and consumer contract. Source and update notes are in `.agents/skills/UPSTREAM.md`.

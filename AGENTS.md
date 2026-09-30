# Contributor and agent guide

Read [CONTRIBUTING.md](CONTRIBUTING.md) before changing this repository. Its workflow is authoritative; this file adds a short working map.

## Current state and architecture guidance

This is setup-only: `packages/kind-ui/src/index.ts` is empty. `docs/development.md` records direction and unresolved decisions. No renderer, framework adapter, domain package split, recipe format, or CLI has been selected.

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
- Required aggregate check: `npm run check`

There are no product behavior tests yet. The package gate tests its own failure cases and checks an actual tarball in an isolated consumer; keep it in CI. When implementing behavior, introduce focused regression tests and package-consumer checks in the same PR, using exported APIs wherever practical. Test intentional error paths as well as successful input. Check the touched package and affected consumers, then run the full available aggregate check before proposing a change. Distinguish passed, failed, and unrun checks.

Keep one purpose per PR. For a stack, target the immediately preceding branch and describe only that incremental diff. Do not mix cleanup, generated output, unrelated refactors, or future features into a setup change.

Never edit `node_modules/`, `dist/`, artifacts, or caches as source. Regenerate `package-lock.json` with npm when manifests change. Keep imports within documented public exports; avoid reaching into another package's source. New dependencies and public API changes need an explicit reason and review.

## Safety and release boundaries

Never add secrets, credentials, telemetry, external uploads, or hidden network behavior. Follow [SECURITY.md](SECURITY.md) for security findings. Do not publish, deploy, merge, create release credentials, or change visibility/access unless explicitly authorized.

All packages remain `private: true` and `0.0.0`. Follow the versioning and changeset policy in [docs/development.md](docs/development.md); no automated publishing is configured. Preserve existing user work and report blockers instead of bypassing permissions or verification.

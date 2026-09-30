# Draft PR: Establish Kind UI’s chart-first ecosystem foundation

This is the checked-in draft description for the private repository `bhaveshchow20/kind-ui`. The GitHub draft PR carries the current verification status. No npm publication or deployment is included; npm scope ownership remains unverified.

## Summary

- Organize the existing private workspace into `@kind-ui/charts-core`, `@kind-ui/charts`, and the optional `@kind-ui/cli`; Kind UI is the selected umbrella name
- Preserve the tested chart semantic/geometry core and React line-chart/table views, and expose normalization plus semantic types through the ergonomic `@kind-ui/charts` entry point
- Add a small bundled, versioned `charts/line` recipe and local `kind-ui init` / `add` flow, with dry-run, explicit runtime requirements, safe paths, and no overwrites or automatic installs
- Distinguish maintained chart runtime code from copied application compositions that the consumer owns and edits
- Retain the explicit missing-value, domain, unit, timezone, stable-identity, theme, and controlled-selection contracts
- Extend isolated package-consumer verification to the CLI binary, bundled assets, generated recipe, TypeScript declarations, and server rendering
- Document the broader Fumadocs/TanStack-inspired ecosystem direction and phased quality gates without claiming a mature ecosystem or copying upstream source

## Scope

One chart product, one optional composition, and one runnable Vite example. Every package remains private, original implementation remains MIT © 2026 Bhavesh Chowdhury, and these unpublished packages and the unverified npm scope are not a public installation route. There is no network registry, dependency installation, automatic recipe upgrade/merge, whole-app generator, new UI family, AI backend, public deployment, or release automation.

The scaffold establishes useful boundaries and checks. A full documentation site, production accessibility and browser validation, responsive label/layout policies, Next.js compatibility verification, and broader chart functionality are subsequent work, not completed features.

## Verification

See the final implementation report for the exact commands run and their results. The expected aggregate check is `npm run check`: lint, types, chart and CLI regressions, package/example builds, and local-tarball consumer verification. Existing chart coverage must remain intact. Test output, not this draft, establishes what passed.

Remote CI is established by the workflow runs against the draft PR commit, separately from local verification. Local tarball checks do not publish the packages.

## Follow-up decisions

- npm scope ownership, version policy, and public-release authorization
- Real consumer feedback and the next useful chart capability
- A documentation site with runnable examples, source, API reference, and verified install paths
- Production accessibility, narrow-container behavior, supported browsers/frameworks, and performance boundaries
- Safe recipe migration only after a real later recipe version and edit-preservation strategy exist
- Additional UI-library families only when concrete consumers justify them

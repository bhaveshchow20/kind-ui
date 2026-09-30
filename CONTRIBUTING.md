# Contributing

This is the private pre-release Kind UI ecosystem foundation. Kind UI is the selected name, with intended `@kind-ui/*` packages and the `kind-ui` binary. npm scope ownership is not yet verified. Do not publish packages, expose the repository, or deploy the example as part of a contribution.

1. Use Node 24 and npm 11.9; run `npm ci`
2. Create a focused branch when working in a Git checkout, then run `npm run dev` for the example and `npm run dev:packages` in a second terminal for live package edits
3. Run `npm run format` and `npm run check` before proposing changes
4. Prepare a draft PR with the behavior changed, tests run, and known limits; a local draft description does not imply that a remote PR exists

## Maintain the boundaries

Keep `packages/charts-core` free of React, DOM/browser globals, themes, and app state. It owns chart-specific semantics and geometry, not a generic platform for unrelated libraries. New semantic behavior belongs in normalization with tests; new geometric algorithms belong in geometry; paint and accessible DOM belong in `packages/charts`. Preserve the ergonomic `@kind-ui/charts` entry point for React consumers, including its semantic re-exports. Avoid new abstractions or product packages until concrete consumers need them.

The application owns selection. Require caller-provided stable IDs. Never turn missing observations into zeros by default. Preserve raw values in exact-value views. Never change data domains based on a palette. Keep chart/table interaction in sync through the same controlled props.

## Keep recipes small and consumer-owned

The CLI in `packages/cli` ships a versioned local recipe registry. Recipes are editable compositions over maintained packages, not copies of chart internals. Declare their version and runtime compatibility with the recipe. A new CLI version must not imply that copied files will be upgraded or merged automatically.

Validate the complete write plan before applying it. `--dry-run` must create nothing. Never overwrite an existing config, recipe, or receipt. Preserve user edits associated with a matching receipt; refuse differing untracked files and changed recipe versions/destinations. Record the generated baseline hash, not a new hash that silently adopts user edits. Reject unsafe paths and symlinks within project file paths. Keep the first CLI free of network fetches, executable recipe hooks, dependency installation, telemetry, and hidden package upgrades. New mutation behavior requires an explicit contract and regression tests before adding commands.

## Verify the actual consumer experience

Chart regressions should cover empty/all-missing data, zero/negative/fractional values, constant and explicit domains, invalid numbers/IDs, reordered input, timezone behavior, keyboard/pointer interaction, theme changes, and server rendering.

CLI regressions should cover initialization, dry-run without writes, missing/invalid configuration, unknown recipes, repeated installation, preservation of consumer edits, unsafe paths, and symlinks. Packaging checks must exercise tarballs outside workspace resolution, the CLI binary and bundled recipe, public imports/declarations, generated TSX, and server rendering. Placeholder registry-install commands cannot establish a working consumer path for unpublished packages; use the local tarball flow in `scripts/check-packages.mjs`.

Documentation and examples are part of the product. Keep examples on public package exports, describe what is implemented versus planned, and verify commands against current output. Do not describe the Vite example as a complete documentation site or a production accessibility certification.

## Provenance and release safety

All new original code uses this repository's MIT license, copyright Bhavesh Chowdhury. Do not paste implementation from another project without reviewing its license and preserving required notices. Document relevant primary design sources in `docs/research.md`; architecture inspiration is not a license to copy source.

Publishing, namespace ownership, version automation, the supported framework/browser matrix, production accessibility validation, and additional UI families are follow-up decisions. Use the phases in [ADR 0003](docs/decisions/0003-ecosystem-and-cli.md) as a quality benchmark, not a claim that those phases are complete. CI has read-only permissions and never publishes or deploys.

# Kind UI Showcase

Draft homepage and interactive gallery for Kind UI Charts. Preserve the engraved artwork, bloom, frosted controls, themes and real-world examples while preparing for launch. Charts, legends, tooltips and chart interactions use public library exports; custom promotional video transformations are separate from the chart package.

## Run locally

Use Node 22.12+ and npm 11.9. From the repository root:

```sh
npm ci
npm run build
cd apps/showcase
npm ci
npm run dev
```

The checked-in app manifest currently consumes the repository’s local chart package. This is not an npm publication claim or a final release pin. The homepage labels the package pre-release and does not offer an unverified registry install command.

## Checks

```sh
npm run typecheck
npm run build
npm run check:snippets
npm run test:browser
```

Run browser checks from this directory after a production build and after installing the repository’s browser prerequisites. The test server binds only to `127.0.0.1:4875`; it does not publish a preview. Chromium checks cover narrow/resized layouts, theme controls, keyboard dialogs and tooltips, local palette drafts, legend-preserving replay, reduced motion, and visible reveal progression for Bar, Histogram, Box Plot and Waterfall. Test enumeration or compilation alone is not a browser pass.

## Release coordination

PR #102 is a reviewed candidate, not the final artifact. Wait for the integrated compact Heatmap (#96), color/legend defaults (#97) and activity rings (#99) artifact. Do not implement those APIs in this app or patch library internals here.

When the final artifact is handed off:

1. Compare its SHA-256 with the owner’s receipt before installation. Record the version, source commit, checksum and installed integrity in the PR; install the exact bytes without repacking.
2. Rerun typechecking, production build, all 256 generated examples and browser checks. Check font/axis measurement, repeated/rapid family switching and replay, hover/keyboard interruption, resizing, tooltip digit bounds, legend controls, palette apply/dismissal and reduced-motion preference changes.
3. Once npm publication is independently verified, pin the exact published version, regenerate the npm lockfile, and run a clean registry `npm ci` in a fresh consumer. Compare registry integrity with the final artifact. Only then replace the pre-release panel with verified, versioned installation commands.

Keep PR #53 draft and previews private. Do not merge, deploy publicly, change domains or announce launch as part of preparation.

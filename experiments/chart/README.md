# Chart experiment

An executable composition study, not an exported Kind UI component. The library package remains empty and unpublished. This fixture tests whether shared labels, number formatting, and consumer-owned visibility make a small chart easier to maintain and inspect before proposing an API.

## Run

From the repository root:

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run dev:chart
```

The browser-install command may require administrator permission for Linux system dependencies. Open the local URL printed by Vite. `npm run check:chart` typechecks, builds, and runs the focused browser tests. `npm run check` also verifies the unchanged packed library. Test screenshots are written under ignored `artifacts/chart-tests/` and retained as CI artifacts for 14 days.

## Behavior

- Two line series use consumer-owned React state and Recharts primitives. Native toggle buttons expose `aria-pressed`; Space/Enter and repeated toggles keep focus on the button.
- The custom tooltip shares labels and formatting with the table, announces keyboard-selected values, and omits hidden series. Focus the chart and use left/right arrows.
- `null` means “No data” and breaks the line; zero remains zero. The table always includes both series and their visibility status. Empty data, all missing values, and all-hidden selection have explicit messages.
- The scenario selector changes the fixture's data without resetting visibility. Styling, tooltip markup, chart marks, and state all remain ordinary editable application code.

Actual dependencies: React/React DOM/React Is 19.3.0 and Recharts 3.10.1 (MIT). Development tooling adds Vite 8.3.1 and Playwright 1.63.0. These are isolated to the private experiment workspace; they do not become dependencies of `kind-ui`.

## Evaluation limits

The initial browser workload is seven rows, two series, and 20 repeated legend toggles at a 1100 × 1200 viewport, plus a 390px-wide layout. The interaction regression guard is five seconds for 20 toggles; it includes automation overhead and is not a rendering benchmark. Record the production JS/CSS gzip sizes from the build. The provisional full-fixture JS budget is 250 kB gzip; a large chart dependency still needs a task-specific cost decision before an API proposal.

No reusable Kind API has been extracted, so there is no incremental library-cost comparison yet. No cross-framework, SSR/hydration, screen-reader compatibility, broad agent reliability, or WCAG conformance claim is made. Animation is disabled in this fixture. Native semantics and live-region assertions need a real assistive-technology pass before making accessibility support claims. Follow-up API work must earn its abstraction with documented consumers and separate evidence.

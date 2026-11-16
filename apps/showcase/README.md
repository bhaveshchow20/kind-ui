# Kind UI homepage

The approved homepage and interactive gallery use public `@kind-ui/charts` exports. Preserve the artwork, controls, themes and examples. Applications own the promotional presentation; reusable chart behavior stays in the library.

## Run locally

Use Node 22.12+ and npm 11.9. From the repository root:

```sh
npm ci
npm run build
cd apps/showcase
npm ci
npm run dev
```

The app's checked-in dependency consumes the repository chart package. Release artifacts and registry versions are verified through the [existing release workflow](../../docs/release-automation.md).

## Validate

From this directory:

```sh
npm run typecheck
npm run build
npm run check:snippets
npm exec playwright install -- chromium webkit
npm run test:browser
```

Run browser checks after the production build, using the same environment. The test server binds to `127.0.0.1:7273`. The maintained tests cover routes, generated public consumers, narrow layouts, themes, keyboard interactions, legends, motion and reduced-motion behavior. Report the actual run results and exact installed artifact.

WebKit checks cover mobile card growth and animated headline stability across widths from 320px to 2560px, using mobile and desktop Safari profiles. Install WebKit alongside Chromium for the full suite.

## Preview and public mounts

Unset deployment intent and preview builds emit noindex directives. For the public `/charts` build:

```sh
KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm run build
KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm run test:browser -- tests/routes.spec.ts
```

Docs is a separate app mounted at `/charts/docs`; navigation destinations live in `lib/site-links.ts`. See [production indexing](../../docs/production-indexing.md) for canonical metadata, preview protection, root robots, sitemaps and hosting verification. Building or testing locally does not deploy either app.

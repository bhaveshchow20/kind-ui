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

## Domain-root hosting preparation

The existing homepage can host the generated registry at
[https://kindui.dev/r/](https://kindui.dev/r/) and the Docs export at
[https://kindui.dev/charts/docs/](https://kindui.dev/charts/docs/). First build Docs
with `KIND_UI_DEPLOYMENT_ENV=production`,
`NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs`, and
`KIND_DOCS_ORIGIN=https://kindui.dev`. Then, from the repository root:

```sh
npm run build:registry
node apps/showcase/scripts/prepare-hosting.mjs
KIND_UI_DOMAIN_ROOT=1 KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm --prefix apps/showcase run build
```

This keeps the homepage at `/charts`, stages JSON directly at `/r`, and
maps exported Docs pages to their existing paths. Assets are generated outputs;
edit their catalog or documentation sources, then prepare again. The command
only prepares local hosting source; the deployment owner must build and deploy
that prepared source through the existing hosting integration.

After this build, verify the combined host with:

```sh
KIND_UI_DOMAIN_ROOT=1 KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm run test:browser -- tests/registry-hosting.spec.ts --project=chromium
```

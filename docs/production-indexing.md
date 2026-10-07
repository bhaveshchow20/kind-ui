# Production indexing

Both apps use server-rendered Next metadata and static robots/sitemap routes. Set
`KIND_UI_DEPLOYMENT_ENV=production` **at build time only for the public deployment**.
Unset, `preview` and `development` builds emit `noindex, nofollow`, deny crawlers and
export an empty sitemap. `NODE_ENV=production` alone does not enable indexing.
`VERCEL_ENV` is also recognized; a Vercel preview cannot override its protection
with the production flag. These directives are not access control.

Public builds use `NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts` and
`NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs`. Canonicals always name the public
URLs: `https://kindui.dev/charts/`, `https://kindui.dev/charts/docs/`, and, for
example, `https://kindui.dev/charts/docs/components/line/`. The Docs sitemap uses
the maintained page catalog, excluding generated legacy aliases and retrieval
assets. The homepage sitemap contains its one page. No guessed modification dates
or ranking priorities are emitted.

## Hosting verification before publication

The domain owner must serve the production `robots.txt` **at
`https://kindui.dev/robots.txt`**, routing/copying the app output there. A file only
at `/charts/robots.txt` or `/charts/docs/robots.txt` does not govern domain crawling.
Its Sitemap entries point to `/charts/sitemap.xml` and `/charts/docs/sitemap.xml`.
Do not mount a preview robots file at the public domain root. Keep separate build
outputs for production and previews; do not reuse an indexable export on a preview
hostname without a host-level `X-Robots-Tag: noindex` override.

Verify HTTP 200 for both sitemaps and the root robots file, canonical and robots
metadata in initial HTML (including a nested Docs page and a legacy alias), and
absence of a conflicting `X-Robots-Tag: noindex` on production responses. Sites or
CDN indexing overrides can still block production even when HTML is correct.
Inspect an actual preview for `noindex, nofollow` and no production sitemap entries.
These checks are a deployment-owner handoff; source tests do not prove live hosting.

Run `node --test scripts/indexing.test.mjs` for environment/URL policy checks.
Then build each app in production and preview modes and check its emitted HTML and
metadata routes. No Search Console submission or credentials are required.

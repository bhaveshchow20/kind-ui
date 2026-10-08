# Production indexing

Both apps use server-rendered Next metadata and static robots/sitemap routes. Set
`KIND_UI_DEPLOYMENT_ENV=production` **at build time only for the public deployment**.
Unset, `preview` and `development` builds emit `noindex, nofollow`, deny crawlers and
export an empty sitemap. `NODE_ENV=production` alone does not enable indexing.
`VERCEL_ENV` is also recognized; a Vercel preview cannot override its protection
with the production flag. These directives are not access control.

Public builds use `NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts` and
`NEXT_PUBLIC_KIND_DOCS_BASE_PATH=/charts/docs`. Canonicals always name the public
URLs: `https://kindui.dev/charts`, `https://kindui.dev/charts/docs/`, and, for
example, `https://kindui.dev/charts/docs/components/line/`. The Docs sitemap uses
the maintained page catalog, excluding generated legacy aliases and retrieval
assets. The homepage sitemap contains its one page. No guessed modification dates
or ranking priorities are emitted.

The homepage canonical follows the showcase's default no-trailing-slash route;
Docs uses its exported trailing-slash routes. Legacy `/start/installation/`,
`/quickstart/`, and `/start/quickstart/` routes point to Installation. The old
composition route points to its Composition section. Legacy routes are excluded
from the sitemap and search catalog.

Docs titles and descriptions come from each page's existing visible frontmatter.
Open Graph and Twitter repeat those page-specific summaries and absolute canonical
URLs, using the existing 512×512 cherry blossom image with a square summary card.
The homepage describes the chart library and emits `SoftwareSourceCode` JSON-LD
with its name, repository, language and license. No ratings, offers, unverified
compatibility, publication dates or rich-result eligibility are claimed.

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

## Maintained validation

Docs CI first builds and checks the protected root-mounted preview, then retains
those exact browser fixtures. Using the same installed dependencies, it builds the
production `/charts/docs` mount and checks every emitted page canonical/robots tag
and complete sitemap membership. It retains homepage, Line and legacy-installation
HTML plus robots/sitemap output in `docs-production-indexing`. Copied consumers
and browser fleets are not repeated for the second build.

The SEO workflow builds the showcase on Node 22 in both configurations and runs
the maintained routes suite. It checks initial HTML, social metadata, structured
project facts, crawlable documentation links, served metadata routes and the
direct public path's status, plus existing mobile/navigation flows. Docs export
checks require unique titles and descriptions for every canonical page and matching
metadata for aliases. To reproduce the showcase checks locally:

```sh
# In apps/showcase, with existing installed dependencies and browser prerequisites:
KIND_UI_DEPLOYMENT_ENV=preview npm run build
KIND_UI_DEPLOYMENT_ENV=preview npm run test:browser -- tests/routes.spec.ts
KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm run build
KIND_UI_DEPLOYMENT_ENV=production NEXT_PUBLIC_SHOWCASE_BASE_PATH=/charts NEXT_PUBLIC_DOCS_URL=/charts/docs/ npm run test:browser -- tests/routes.spec.ts
```

Keep the same deployment environment for build and test, since metadata routes are
static and the test compares their served bytes with that deployment intent.

## Guidance reviewed

Implementation follows the installed Next.js 16.3 metadata and JSON-LD docs and
the official [Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
and [robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
guidance. Google guidance informed [canonicalization](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[descriptions](https://developers.google.com/search/docs/appearance/snippet),
[sitemap discovery](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
and [truthful structured data](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Two open-source agent references were read before applying their scoped guidance:

- [Web Quality Audit](https://github.com/addyosmani/web-quality-skills/blob/afa8da942115f2961fdbfa80807ea0b232ff6c00/skills/web-quality-audit/SKILL.md):
  compare runtime evidence and source findings, then repeat equivalent checks.
  GitHub API read on 2026-10-07: 2,898 stars, 254 forks, latest commit 2026-08-24.
- [Next.js SEO](https://github.com/laguagu/claude-code-nextjs-skills/blob/c51d9c872cf5a3c0e147ea2ff8e04e8af39395f4/skills/nextjs-seo/SKILL.md):
  use installed framework guidance, verify emitted URLs/inheritance and protect
  previews. GitHub API read on 2026-10-07: 67 stars, 18 forks, latest commit 2026-10-05.

The first repository shows wider adoption; the second is a smaller recently
maintained reference. Star counts are adoption evidence, not correctness evidence.
No reference bundle or downloaded script was installed in this product repository.
Search Console state, actual indexing and ranking changes remain unmeasured.

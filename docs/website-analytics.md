# Website analytics

Both website applications use `apps/analytics.mjs`. This is separate from the published charts package.

The public GA4 web-stream ID is `G-1WENXL62G2` (Kind UI website, stream `16070938179`). It is configured as the default for both apps. `NEXT_PUBLIC_GA_MEASUREMENT_ID` can override it; an empty value disables analytics. Production intent must also be configured through the existing indexing settings. Builds without an ID, previews and development omit the analytics script. At runtime, it runs only on `kindui.dev`.

Disable every **Enhanced measurement** option in the GA4 web stream. Page views and navigation are recorded explicitly, once per pathname change; enabling automatic history page views would duplicate events and could transmit unfiltered URLs. The integration strips query strings and fragments, reports only referrer origins, disables Google signals and advertising consent, and respects browser privacy signals. This intentionally omits UTM attribution rather than forwarding arbitrary query values.

Analytics is opt-in. Before consent, no Google script or measurement request is made. The compact preferences control links to the public privacy page. Code and prompt copy events contain only a fixed action type, never the copied content. Automatic form/search tracking and session replay are not enabled.

Events: `page_view`, `docs_navigation` (`destination_path`), `github_click`, `npm_click`, and `copy_example` (`content_type`: code, prompt, install, markdown).

Verify the production ID in both build outputs. After deployment, allow analytics in a test browser and confirm the gallery-to-docs journey in GA4 Realtime/DebugView. Browser tests mock the Google script and verify the queued event contracts; they do not prove receipt in GA4. Keep optional Google email subscriptions off. Recheck privacy disclosures if collection changes.

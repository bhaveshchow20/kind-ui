# Website analytics

Both website apps use `apps/analytics.mjs` to configure Cloudflare Web Analytics. This is separate from the published charts package. It measures traffic and performance without creating any visible UI, cookies or localStorage identifiers.

The public site token is configured for `kindui.dev` in Cloudflare Web Analytics. `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` overrides it; an empty value disables the beacon. The existing production indexing settings gate injection, so development and preview builds omit it. Cloudflare receives the standard beacon; the site adds no custom copy, chart-data or prompt events.

Google Analytics and its consent controls have been removed. Previously stored Google cookies can be cleared through browser settings; removing the integration does not delete historical reports in Google Analytics.

After deployment, confirm the beacon loads on the gallery and docs, verify no Google scripts or consent controls remain, and check incoming page views in the Cloudflare Web Analytics dashboard. Do not inject a second beacon through automatic hosting integration.

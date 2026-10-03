# Kind UI Showcase

Source for the public Kind UI chart showcase. It includes the landing page, interactive chart gallery, custom palettes, theme controls, code examples, and engraved hero/footer artwork.

## Run locally

From the repository root, build the library first, then install and run this app:

```sh
npm run build
cd apps/showcase
npm install
npm run dev
```

The app uses the local `@kind-ui/charts` workspace package, so chart rendering, legends, tooltips, and interactions come from the library itself. The site UI uses Radix primitives and Motion.

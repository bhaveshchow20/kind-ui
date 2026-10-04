# Dependencies and reference provenance

Original docs source and adaptations of Kind UI examples use this repository's MIT license. Downloaded consumers include that LICENSE. Installation retains dependencies' own licenses and notices; package-lock.json records transitive versions and integrity. This table records inspected direct package metadata, not a claim that all transitive software has one license.

| Dependency | Pinned version | License |
| --- | --- | --- |
| @kind-ui/charts | private 0.0.0, guarded aa7fe56 artifact | MIT |
| Fumadocs core and UI | 16.15.18 | MIT |
| Fumadocs MDX | 15.4.6 | MIT |
| Fumadocs TypeScript generator | 5.4.1 | MIT |
| shadcn/ui Tabs and Button source adaptations | official new-york-v4 registry | MIT, notice in components/ui/LICENSE.shadcn |
| Radix Tabs / Dialog / Select / Dropdown Menu / Slot | 1.1.21 / 1.1.23 / 2.3.7 / 2.1.24 / 1.3.0 | MIT |
| Lucide React | 1.50.0 | ISC |
| clsx / tailwind-merge | 2.1.1 / 3.6.0 | MIT |
| class-variance-authority | 0.7.1 | Apache-2.0 |
| Next.js | 16.3.8 | MIT |
| React and React DOM | 19.3.0 | MIT |
| Recharts | 3.10.1 | MIT |
| Motion | 13.4.6 | MIT |
| fflate | 0.8.3 | MIT |
| Tailwind CSS and PostCSS adapter | 4.3.3 | MIT |
| TypeScript | 5.9.3 | Apache-2.0 |
| Geist variable font through Fontsource | 5.3.0 package | OFL-1.1 |
| DefinitelyTyped React/DOM/Node/MDX types | package-lock versions | MIT |

The font's OFL license ships with @fontsource-variable/geist. API and syntax work runs at build time; no TypeScript compiler or Shiki runtime is added to client examples. Consumer build tooling uses Vite 8.3.1 (MIT), pinned in the generated example manifest/lock.

Visual references were inspected read-only: [beUI Composition Chart](https://beui.dev/charts/composition-chart), [beUI source](https://github.com/starc007/ui-components), [EvilCharts docs](https://evilcharts.com/docs), and the separately owned Kind UI showcase. beUI supplies the Preview/Usage/Code flow and restrained navigation reference; Fumadocs remains this app's documented infrastructure. No reference site's implementation or proprietary site assets were copied. Tabs and Button are adapted from the official shadcn/ui registry, with its complete MIT notice preserved. Other navigation controls compose installed Radix primitives. The Kind UI homepage shared selected-pill augmentation from PR53 (aa6ee84450c8e09947cfd14985510c48af7450ec) is reused with free Motion. Its Animate UI TabsContent and Motion Primitives implementations were inspected but not copied. Panel/shell transitions are original local compositions. The wordmark is original text; chart colors follow Kind UI's own read-only showcase palette.

Authoritative dependency sources: [Fumadocs](https://github.com/fuma-nama/fumadocs), [Next.js](https://github.com/vercel/next.js), [React](https://github.com/facebook/react), [Recharts](https://github.com/recharts/recharts), [Motion](https://github.com/motiondivision/motion), [fflate](https://github.com/101arrowz/fflate), [Tailwind](https://github.com/tailwindlabs/tailwindcss), [TypeScript](https://github.com/microsoft/TypeScript), [Fontsource](https://github.com/fontsource/font-files).

---
name: write-docs
description: Writes or reviews the Charts docs in apps/docs/content/docs (Get Started, chart pages, building blocks and guides) in the site's voice. Use for new pages, prose edits, example captions and docs reviews. Pair it with the fumadocs skill, which covers the site's mechanics.
---

# Write Charts Docs

Write like you're explaining the chart to a friend who hasn't used it yet. Say what it does, show it, then explain what happens. The [`fumadocs`](../fumadocs/SKILL.md) skill covers where files go and how examples and API tables are wired; this one covers the words.

Size the work to the request. For a sentence or a caption, read this guide and the section you're changing, check any API claim you touch, and reread the section. For a new page or a rewrite, follow the steps below. A review produces findings, a draft stays in chat, and an edit changes files. Treat existing wording as intentional unless the request calls for revising it.

## 1. Read the Page and Its Reference

Use `content/docs/charts/line.mdx` as the reference for a chart page. Read the page you're changing and its neighbors, so it continues what the reader already knows, and link to concepts other pages already teach (series config, identity, materials, motion) instead of repeating them.

## 2. Check What the Chart Does

For every behavior you describe, read its source in `packages/charts/src/` and its tests in `tests/`. This matters most for defaults, keyboard, focus, motion, reduced motion and what screen readers hear. When the prose and the TSDoc disagree, fix both against the code. Don't describe planned behavior as shipped.

## 3. Write the Page

**Open with the point.** The frontmatter `description` starts with a verb and says what the reader can do: "Compare values over time with one or more lines." The first paragraph adds when to use it, starting "Use a … to …", without repeating the description. Then the example, with a `caption` saying what to try and what happens: "Hover or focus a point to see its values." The caption is plain text, so no Markdown in it.

**Then the usual sections**, adapted to the chart, never added empty:

- **Installation:** the `shadcn add` command for the chart's registry item and the `npm install` alternative, as `bash tab=` blocks.
- **Composition:** a `text` tree of the compound parts (`LineChart`, `LineChart.Series`, …), then a sentence on what each renders.
- **Usage:** one short subsection per behavior someone needs: the props that change it, what the chart does on its own, the keys, and what it announces.
- **API Reference:** the generated props tables, narrowed to Charts' own options.
- A closing `<Caption>` only when there's a limit or mapping the reader would otherwise miss.

**Explain one thing at a time.**

- Use familiar words, contractions and short paragraphs. Address the reader: "Use X to…", "Pass Y when…".
- Name the part or prop and say what it does. Skip marketing claims, rhetorical openings and invented scenarios.
- Explain the action before the code, and the result or a limit after it. Include defaults, timing and announcements when they change how someone uses the chart.
- Use Title Case for titles and headings. Keep identifiers exact (`LineChart.Series`, `visibleSeries`).
- Prefer periods, commas or parentheses to em dashes.
- Bold a visible label when it helps the reader find what to press. Name keys consistently: Enter, Space, Shift+Tab, arrow keys.
- Never mention a package version or a release status.

**Keep examples small and graph-first.** The live example shows the smallest realistic chart. A snippet in Usage teaches one prop or composition. Include imports in complete examples, and explain code in the prose rather than in comments. Don't add examples that differ only in a visual variant, and don't add visible tables, captions or readouts that repeat what the chart shows; keep the chart's accessible name.

**Keep the API reference to the chart's own options.** Descriptions come from TSDoc in `packages/charts/src`, so write them there: what the prop does, and `@default`. Don't reproduce inherited Recharts or DOM props.

Never name other component libraries or reference projects. Recharts, Motion, shadcn, Fumadocs, Next.js and Tailwind are fine.

## 4. Read and Verify

Read the page in order and ask: can someone understand what the chart is for, use the example, and tell what happens next, without an unexplained name or repeated setup? Then check the rendered page and its Markdown at `/llms.mdx/docs/<path>.md`, and run `npm run test:docs`. Report what changed and what you checked, including anything you couldn't.

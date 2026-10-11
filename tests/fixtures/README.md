# Internal chart fixtures

Homepage (`apps/showcase`) and docs (`apps/docs`) own the maintained examples.
These fixtures exercise public package contracts: geometry, missing and zero
values, visibility, refs, keyboard inspection, resizing, loading and motion.
Change a fixture when its tested behavior changes; visual or documentation
updates do not require matching edits here. Keep new cases minimal and use public
package exports.

`browser/` contains regression hosts without tracked HTML pages, gallery navigation
or copied-code tools. `npm run check:packed` typechecks these hosts and generates
entry files from one shared template into a temporary directory. Vite builds the
private cases into ignored `artifacts/browser-fixtures/`; the temporary entries
are removed after the build. Playwright serves that build and the isolated packed
consumers. Loading and presentation reuse their host components in the packed
gate, using the same generated entry template.

The remaining family directories contain small consumers installed against the
actual tarball. Keep those independent of website presentation so regression
checks remain reproducible even when homepage and docs change.

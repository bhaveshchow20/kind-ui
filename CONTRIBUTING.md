# Contributing

Kind UI is currently private and pre-release. The repository is being prepared for an open-source library workflow; it is not a published package or a production-support promise.

## Start here

1. Read [README.md](README.md), [AGENTS.md](AGENTS.md), and the [development direction](docs/development.md).
2. Use Node 22.12+ (Node 24 recommended) and npm 11.9, then run `npm ci`.
3. Create one focused branch for the agreed scope. Discuss a new feature, public API, dependency, or cross-package abstraction before implementing it.
4. Run `npm run format` and `npm run check`. Report exactly what was checked and anything blocked.
5. Open a draft PR describing the purpose, changed behavior/API, verification, and known limits. For stacked work, name and link its immediate base PR.

## Commands

- `npm run build`: compile the empty package entry point and its declarations
- `npm run typecheck`: run the strict TypeScript build
- `npm run lint`: check formatting and lint rules
- `npm run format`: apply formatting and safe lint fixes
- `npm run check:package`: build, validate package-gate fixtures, then verify a tarball in an isolated offline consumer
- `npm run check`: lint, strict build, and the packed-package gate

There are no product behavior tests yet. The package gate checks required packed files, ESM import, and strict NodeNext/Bundler declaration resolution without workspace links. Its small native Node tests prove missing outputs/docs and unwanted files fail validation. Each implementation PR must add its focused tests and include them in `check`. Package functionality must also be checked through packed public exports, rather than only workspace source imports.

## Review expectations

Evaluate proposals against Kind UI’s goals: performance, accessibility, extensibility, familiarity, and interoperability with agentic applications. Turn the relevant goals into focused acceptance checks; do not describe goals as guarantees before testing them.

Keep changes small enough to review as one decision. Prefer an existing pattern and a concrete consumer need over an abstraction for hypothetical features. Explain dependency additions and keep runtime dependencies in the package that uses them. Keep explicit package exports; propose package or framework boundaries when actual consumers justify them.

Work with established UI libraries rather than rebuilding their strengths. Prefer reusable accessible primitives and existing motion systems where appropriate, with narrow interoperable wrappers. Explain dependency, peer-range, licensing, and bundle implications. Avoid making optional styling or animation choices mandatory for unrelated consumers. Do not claim compatibility without a representative consumer test.

Include regressions for fixed bugs, document observable behavior, and keep documentation truthful at each stack level. Changes that affect a public API must describe compatibility and the applicable versioning decision. Do not promise support for untested frameworks or browsers.

Do not commit dependency folders, build output, tarballs, coverage, credentials, or environment files. Generated lockfile changes must follow manifest changes. Original contributions use the repository's MIT license; inspect third-party licenses and preserve notices before reusing code. Referencing another library's design does not authorize copying its implementation.

## Reporting and participation

Use the issue forms for reproducible non-sensitive bugs or focused proposals. For security concerns, follow [SECURITY.md](SECURITY.md). Follow the [Code of Conduct](CODE_OF_CONDUCT.md). There is no guaranteed review or support turnaround at this pre-release stage.

## CodeRabbit review setup

The [repository configuration](.coderabbit.yaml) requests CodeRabbit reviews for draft PRs, stacked base branches, and subsequent pushes. The owner must separately install/approve the GitHub app for this repository; configuration alone does not grant access or establish that a review ran. Repository visibility and any paid plan require a separate owner decision. Automatic review remains subject to [CodeRabbit eligibility and limits](https://docs.coderabbit.ai/management/plans); an explicit `@coderabbitai review` trigger may be required. Inspect the actual review and CI results before merging, and address relevant feedback in a focused change. Automatic code changes and unrelated automation are disabled in the project configuration.

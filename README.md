# Kind UI

Kind UI is a UI library ecosystem intended to be kind to your AI agentic stack: performant, accessible, extensible, familiar, and easy to compose into agent-driven applications. These are design and verification goals, not delivered guarantees.

This is a pre-release library workspace. The library retains one empty package entry point. A [working chart experiment](experiments/chart/README.md) evaluates one concrete composition without exporting a component API or selecting the library’s final architecture.

## Local setup

Requires Node 22.12+ (Node 24 recommended) and npm 11.9.

```sh
npm ci
npm exec playwright install -- --with-deps chromium
npm run check
```

`check` runs Biome, a strict TypeScript build, and an isolated packed-package check for ESM, declarations, and required documentation. It also builds and browser-tests the chart experiment. Run `npm run dev:chart` to inspect it locally. The empty working package is in `packages/kind-ui`; build output stays in its ignored `dist/` directory. Root and package manifests remain `private: true` and unpublished. The working package name does not imply npm ownership or an installation route.

## Direction

Build with established UI libraries, not against them. Prefer familiar composition and existing primitives, styling, and motion capabilities. Introduce a new pattern only for a concrete need that existing options do not meet. Future architecture and package boundaries will be reviewed in small steps; this setup makes no feature or compatibility claims.

## Contributing

Start with [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). See [development direction and release policy](docs/development.md), [security reporting](SECURITY.md), and our [Code of Conduct](CODE_OF_CONDUCT.md).

Nothing is published or deployed. MIT © 2026 Bhavesh Chowdhury.

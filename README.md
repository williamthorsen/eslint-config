# @williamthorsen/eslint-config

A pnpm-workspace monorepo of flat ESLint 9+ configurations and tooling published under `@williamthorsen/*`.

## Packages

| Package                                                           | Description                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`@williamthorsen/eslint-config-basic`](packages/basic)           | Flat ESLint preset for JavaScript, JSON, YAML, Markdown, and `package.json`                   |
| [`@williamthorsen/eslint-config-typescript`](packages/typescript) | Flat ESLint preset for TypeScript projects, with opt-in React, Next, Vitest, and a11y configs |
| [`@williamthorsen/strict-lint`](packages/strict-lint)             | CLI that runs ESLint with warnings promoted to errors, with a configurable allowlist          |
| [`@williamthorsen/tsconfig`](packages/tsconfig)                   | Shared TypeScript base config for Node-only projects                                          |

Each package has its own README with installation and usage details.

## Getting started

This repo uses [pnpm](https://pnpm.io/) and Node.js. Versions are pinned via `packageManager` in `package.json` and `engines.node`.

```shell
pnpm install
```

The root `eslint.config.ts` imports `packages/typescript/src` directly. `nmr build` serves publishing: it emits the `dist/` that consumers resolve through `node_modules`.

## Scripts

This repo uses [`@williamthorsen/nmr`](https://www.npmjs.com/package/@williamthorsen/nmr) as its script runner. Most scripts come from nmr's built-in registries; project-specific overrides live in `.config/nmr.config.ts`.

Run from the repo root to fan out across all workspaces, or from a workspace directory to target that package only.

```shell
nmr ci            # build + check:strict (mirrors GitHub Actions)
nmr build         # build all packages (or current package from a workspace dir)
nmr check         # typecheck + format check + lint check + tests
nmr check:strict  # typecheck + format check + strict-lint + coverage + agent-file check
nmr lint          # eslint --fix
nmr lint:check    # eslint without fix
nmr lint:strict   # strict-lint
nmr test          # vitest, the unit and tool tiers
nmr test:unit     # vitest, the unit tier alone
nmr test:tool     # vitest, the tool tier alone
nmr test:all      # vitest, every tier
nmr test:coverage # vitest with coverage, the unit and tool tiers
```

`nmr` is context-aware: the same command runs different scripts depending on whether you're in the repo root or a workspace directory. See the [nmr README](https://github.com/williamthorsen/node-monorepo-tools/tree/main/packages/nmr#readme) for the full command reference.

## Releases

Releases are triggered by the **Release** GitHub Actions workflow (manual `workflow_dispatch`):

1. The workflow runs [`@williamthorsen/release-kit`](https://github.com/williamthorsen/node-monorepo-tools/tree/main/packages/release-kit) to analyze commits, bump versions, regenerate CHANGELOGs, and push tags of the form `<workspace>-v<semver>`.
2. Tag pushes trigger the **Publish** and **Create GitHub Release** workflows.

Don't push release tags by hand — manual tags can desync `package.json` versions, CHANGELOGs, and the commit history that release-kit reads.

Publishing targets differ by package:

| Package                                    | Registry        | Visibility |
| ------------------------------------------ | --------------- | ---------- |
| `@williamthorsen/eslint-config-basic`      | GitHub Packages | restricted |
| `@williamthorsen/eslint-config-typescript` | npm             | public     |
| `@williamthorsen/strict-lint`              | npm             | public     |
| `@williamthorsen/tsconfig`                 | npm             | public     |

## Gotchas

- **Root-level Vitest excludes `packages/**`.** Packages carry no Vitest config of their own; `nmr root:test` runs only root-level tests.

## License

ISC.

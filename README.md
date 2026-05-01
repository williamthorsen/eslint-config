# @williamthorsen/eslint-config

A pnpm-workspace monorepo of flat ESLint 9+ configurations and tooling published under `@williamthorsen/*`.

## Packages

| Package                                                           | Description                                                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`@williamthorsen/eslint-config-basic`](packages/basic)           | Flat ESLint preset for JavaScript, JSON, YAML, Markdown, and `package.json`                   |
| [`@williamthorsen/eslint-config-typescript`](packages/typescript) | Flat ESLint preset for TypeScript projects, with opt-in React, Next, Vitest, and a11y configs |
| [`@williamthorsen/strict-lint`](packages/strict-lint)             | CLI that runs ESLint with warnings promoted to errors, with a configurable allowlist          |

Each package has its own README with installation and usage details.

## Getting started

This repo uses [pnpm](https://pnpm.io/) and Node.js. Versions are pinned via `packageManager` in `package.json` and `engines.node`.

```shell
pnpm install
pnpm exec nmr build    # required on a clean checkout — see "Gotchas" below
```

The build step is required because the root `eslint.config.js` imports from `packages/typescript/dist/esm/`. After the first build, `nmr ci` keeps things in order automatically.

## Scripts

This repo uses [`@williamthorsen/nmr`](https://www.npmjs.com/package/@williamthorsen/nmr) as its script runner. Most scripts come from nmr's built-in registries; project-specific overrides live in `.config/nmr.config.ts`.

Run from the repo root to fan out across all workspaces, or from a workspace directory to target that package only.

```shell
nmr ci                # build + check:strict (mirrors GitHub Actions)
nmr build             # build all packages (or current package from a workspace dir)
nmr check             # typecheck + format check + lint check + tests
nmr check:strict      # check + coverage + audit + strict-lint
nmr lint              # eslint --fix
nmr lint:check        # eslint without fix
nmr lint:strict       # strict-lint
nmr test              # vitest
nmr test:coverage     # vitest with coverage
nmr outdated          # compatible-range dependency check
nmr outdated:latest   # latest-version dependency check
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

## Commit conventions

Commit titles follow the format `[{scope}|{type}: ]{title}`, rendered by `describe-change.sh`:

- **Scopes:** `basic`, `root`, `strict-lint`, `ts`, or `*` for changes spanning multiple workspaces.
- **Types:** `ai`, `ci`, `deps`, `docs`, `feat`, `fix`, `internal`, `refactor`, `tests`, `tooling`. Append `!` for breaking changes (e.g., `feat!`).
- **`deps` is always its own commit.** `cliff.toml` and release-kit categorize the changelog by type — mixed commits land in the wrong section.

Full reference: [`docs/versioning-and-changelog.md`](docs/versioning-and-changelog.md).

## Gotchas

- **`nmr lint` and `nmr check` fail on a clean checkout** until `packages/typescript` is built. The root `eslint.config.js` imports from its `dist/`. Run `nmr build` first, or use `nmr ci`, which builds before checking.
- **The `basic` package has no build step.** `build` and `test` are no-ops — edits to `index.mjs` and `rules/*.mjs` take effect immediately.
- **Root-level Vitest excludes `packages/**`.** Each package owns its own test config; `nmr root:test` runs only root-level tests.

## License

ISC.

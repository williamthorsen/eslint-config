# eslint-config monorepo

## Overview

A pnpm-workspace monorepo of flat ESLint 9+ configurations and tooling published under `@williamthorsen/*`. Three packages: a small JavaScript config (`basic`), a comprehensive TypeScript config (`typescript`, the primary public artifact, with React/Next/Vitest/testing-library presets and custom rules), and a CLI utility that runs ESLint with warnings promoted to errors (`strict-lint`).

## Project structure

- `packages/basic/` — `@williamthorsen/eslint-config-basic`. Flat config for JavaScript/JSON/MD/YAML. No build step; ships `index.mjs` directly.
- `packages/typescript/` — `@williamthorsen/eslint-config-typescript`. Compiled to `dist/esm/`. Modular submodule exports (`./configs`, `./ignores`, `./plugins`, `./utils`). Custom ESLint rules live in `plugins/rules/`.
- `packages/strict-lint/` — `@williamthorsen/strict-lint`. Compiled to `dist/esm/`; ships a `strict-lint` bin.
- `eslint.config.js` (repo root) — imports from `packages/typescript/dist/esm/`; depends on a built typescript package.
- `.config/nmr.config.ts` — repo-level overrides for the `nmr` script runner.
- `.config/release-kit.config.ts`, `.config/audit-deps.config.json`, `.config/sync-labels.config.ts` — config for the corresponding tools invoked by GitHub Actions reusable workflows.
- `cliff.toml` — git-cliff template aware of the `workspace|type:` commit format.
- `__tests__/version-alignment.app.test.ts` — root-level test that checks Node version consistency across the monorepo.

## Commands

This repo uses [`@williamthorsen/nmr`](https://www.npmjs.com/package/@williamthorsen/nmr) as its script runner. Most commands come from nmr's built-in registries; only project-specific overrides live in `.config/nmr.config.ts`. From the repo root, commands fan out across all workspaces; from a workspace directory, they target that package only.

```bash
nmr ci                # Build all packages, then run check:strict (matches GitHub Actions)
nmr check             # typecheck + format check + lint check + tests
nmr check:strict      # check + coverage + audit + strict-lint
nmr build             # Build all packages (or the current package from a workspace dir)
nmr lint              # eslint --fix; lint:check is the non-mutating variant
nmr lint:strict       # Run strict-lint over the codebase
nmr test              # vitest
nmr outdated          # Check dependencies (use outdated:latest for non-compatible)
```

Releases are triggered via the **Release** GitHub Actions workflow (`workflow_dispatch`), which uses release-kit to bump versions, regenerate CHANGELOGs, and push tags. Tag pushes (`<workspace>-v<semver>`) then trigger the **Publish** and **Create GitHub Release** workflows. Don't push release tags by hand.

## Architecture

- **Flat ESLint config (ESLint 9+) everywhere.** Both consumer-facing packages export arrays compatible with the flat-config format. Selective subpath imports are supported on the typescript package (`@williamthorsen/eslint-config-typescript/configs`, `/plugins`, etc.).
- **The repo's own lint depends on the typescript package's compiled output.** Root `eslint.config.js` imports `packages/typescript/dist/esm/index.js` and `.../ignores/index.js`. Build before lint on a clean checkout.
- **strict-lint runs from source in dev.** Its bin is not symlinked into the workspace `node_modules/.bin/`, so the repo overrides `lint:strict` and `root:lint:strict` to invoke the source via `tsx` (see `.config/nmr.config.ts`).
- **Custom ESLint rules** in `packages/typescript/plugins/rules/`: `memoized-functions-returned-by-hook`, `no-undefined-with-number`, `no-unused-map`, `prefer-function-declaration`.
- **Hooks:** `lefthook` runs prettier on staged files pre-commit (see `lefthook.yml`).

## Commit conventions

Commit titles are rendered by `describe-change.sh` from `commit.title_format` in `~/.agents/preferences.yaml` (currently `[{scope}|{type}: ]{title}`). Don't assemble titles by hand — invoke the commit skill, which calls the script. The project-specific values to pass are:

- **`--scope`:** `basic`, `root`, `strict-lint`, `ts`, or `*` for changes spanning multiple workspaces.
- **`--type`:** `ai`, `ci`, `deps`, `docs`, `feat`, `refactor`, `tests`, `tooling`. Append `!` after the type for breaking changes (e.g., `feat!`).
- **Separation rule:** `deps` is always its own commit. Never mix dependency updates with `feat`/`refactor`/etc. — `cliff.toml` and release-kit categorize by type, so mixed commits land in the wrong section.

Full reference: `docs/versioning-and-changelog.md`.

## Code style

- **pnpm command usage convention:**
  - Binaries: `pnpm exec {binary}` (e.g., `pnpm exec vitest`)
  - Package scripts: `pnpm run {script}`
  - Built-in pnpm commands: `pnpm {command}` (e.g., `pnpm install`)

## Gotchas

- **`nmr lint`/`nmr check` will fail on a clean checkout** until `packages/typescript` is built. The root eslint config imports from its `dist/`. `nmr ci` deliberately runs `build` before `check:strict` for the same reason.
- **The `basic` package has no build step** (`build` and `test` scripts are no-ops). Edits to `index.mjs` or `rules/*.mjs` take effect immediately.
- **Publishing targets differ by package.** `basic` publishes to GitHub Packages (restricted scope `@williamthorsen`); `typescript` and `strict-lint` publish to public npm. Tags, tokens, and audiences are not interchangeable.
- **Don't push release tags manually.** The `Release` workflow is the source of truth; manual tags can desync versions and CHANGELOGs from the actual commit history release-kit analyzes.
- **Root-level Vitest excludes `packages/**`.** Each package owns its own test config; `nmr root:test` runs only root-level tests.

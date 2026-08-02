# eslint-config monorepo

@nmr/AGENTS.md

## Overview

A pnpm-workspace monorepo of flat ESLint 9+ configurations and tooling published under `@williamthorsen/*`. Four packages: a small JavaScript config (`basic`), a comprehensive TypeScript config (`typescript`, the primary public artifact, with React/Next/Vitest/testing-library presets and custom rules), a CLI utility that runs ESLint with warnings promoted to errors (`strict-lint`), and a shared TypeScript base config (`tsconfig`).

## Project structure

- `packages/basic/` — `@williamthorsen/eslint-config-basic`. Flat config for JavaScript/JSON/MD/YAML. No build step; ships `index.mjs` directly.
- `packages/typescript/` — `@williamthorsen/eslint-config-typescript`. Sources under `src/`, compiled to `dist/esm/`. Modular submodule exports (`./configs`, `./ignores`, `./plugins`, `./utils`). Custom ESLint rules live in `src/plugins/rules/`.
- `packages/strict-lint/` — `@williamthorsen/strict-lint`. Compiled to `dist/esm/`; ships a `strict-lint` bin.
- `packages/tsconfig/` — `@williamthorsen/tsconfig`. No build step; ships `tsconfig.base.json`, which inlines `@tsconfig/strictest`'s settings and adds the Node/build options it omits. The repo root consumes it via the workspace symlink.
- `eslint.config.ts` (repo root) — imports `packages/typescript/src/` directly; needs no build.
- `.config/nmr.config.ts` — repo-level overrides for the `nmr` script runner.
- `.config/release-kit.config.ts`, `.config/audit-deps.config.json`, `.config/sync-labels.config.ts` — config for the corresponding tools invoked by GitHub Actions reusable workflows.

## Commands

This repo uses [`@williamthorsen/nmr`](https://www.npmjs.com/package/@williamthorsen/nmr) as its script runner. Most commands come from nmr's built-in registries; only project-specific overrides live in `.config/nmr.config.ts`. From the repo root, commands fan out across all workspaces; from a workspace directory, they target that package only.

```bash
nmr ci           # Build all packages, then run check:strict (matches GitHub Actions)
nmr check        # typecheck + format check + lint check + tests
nmr check:strict # typecheck + format check + strict-lint + coverage + agent-file check
nmr build        # Build all packages (or the current package from a workspace dir)
nmr lint         # eslint --fix; lint:check is the non-mutating variant
nmr lint:strict  # Run strict-lint over the codebase
nmr test         # vitest, excluding integration tests (test:integration runs those alone)
nmr upgrade      # Report available dependency upgrades (add --write to apply)
```

Releases are triggered via the **Release** GitHub Actions workflow (`workflow_dispatch`), which uses release-kit to bump versions, regenerate CHANGELOGs, and push tags. Tag pushes (`<workspace>-v<semver>`) then trigger the **Publish** and **Create GitHub Release** workflows. Don't push release tags by hand.

## Architecture

- **Flat ESLint config (ESLint 9+) everywhere.** Both consumer-facing packages export arrays compatible with the flat-config format. Selective subpath imports are supported on the typescript package (`@williamthorsen/eslint-config-typescript/configs`, `/plugins`, etc.).
- **Custom ESLint rules** in `packages/typescript/src/plugins/rules/`: `memoized-functions-returned-by-hook`, `no-undefined-with-number`, `no-unused-map`, `prefer-function-declaration`.
- **Hooks:** `lefthook` runs prettier on staged files pre-commit (see `lefthook.yml`).

## Commit conventions

Commit titles are rendered by `describe-change.sh` from `commit.title_format` in `~/.agents/preferences.yaml` (currently `[{scope}|{type}: ]{title}`). Don't assemble titles by hand — invoke the commit skill, which calls the script. The project-specific values to pass are:

- **`--scope`:** `basic`, `root`, `strict-lint`, `ts`, `tsconfig`, or `*` for changes spanning multiple workspaces.
- **`--type`:** see the work-types table in `docs/versioning-and-changelog.md`. Append `!` after the type for breaking changes (e.g., `feat!`); `drop` always carries it.
- **Separation rule:** `deps` is always its own commit. Never mix dependency updates with `feat`/`refactor`/etc. — release-kit categorizes by type, so mixed commits land in the wrong section. The one carve-out is an `@tsconfig/strictest` bump that changes settings, which must carry the mirrored `tsconfig.base.json` edit; see Gotchas.

Full reference: `docs/versioning-and-changelog.md`.

## Code style

- **pnpm command usage convention:**
  - Binaries: `pnpm exec {binary}` (e.g., `pnpm exec vitest`)
  - Package scripts: `pnpm run {script}`
  - Built-in pnpm commands: `pnpm {command}` (e.g., `pnpm install`)

## Gotchas

- **`nmr build` is a publishing step, not a prerequisite.** Lint, typecheck, and tests all read `src`. `nmr ci` still runs `build` first so publish-path breakage surfaces early.
- **The `basic` package has no build step** (`build` and `test` scripts are no-ops). Edits to `index.mjs` or `rules/*.mjs` take effect immediately.
- **Publishing targets differ by package.** `basic` publishes to GitHub Packages (restricted scope `@williamthorsen`); `typescript`, `strict-lint`, and `tsconfig` publish to public npm. Tags, tokens, and audiences are not interchangeable.
- **Don't push release tags manually.** The `Release` workflow is the source of truth; manual tags can desync versions and CHANGELOGs from the actual commit history release-kit analyzes.
- **Two Vitest configs serve the whole repo.** `vitest.config.ts` and `vitest.root.config.ts` each call the factory from `@williamthorsen/nmr/vitest`; packages carry no config of their own, because Vitest walks up from the run root to find one. The root variant excludes `packages/**`, so `nmr root:test` runs only root-level tests.
- **Test suites are selected by filename, not by config.** `*.int.test.ts` is the `integration` project and `*.app.test.ts` the `app` project; everything else under `__tests__` is `unit`. `nmr test` runs `!integration`, so an integration test is reached only by `nmr test:integration`, which `nmr ci` does not invoke. That command also cannot fail empty — the shared config sets `passWithNoTests`, so a suite that loses its `.int.` infix or moves out of `__tests__` stops running and still reports success.
- **`tsconfig.base.json` inlines `@tsconfig/strictest` deliberately, and a root test holds it to that.** An `extends` cannot be reintroduced: resolvers that don't realpath pnpm symlinks fail to follow the second hop, which is the bug the inlining fixed. `__tests__/tsconfig-base.app.test.ts` compares the inlined block against the installed devDependency in both directions, so bumping `@tsconfig/strictest` fails the suite whenever upstream's settings changed. Mirror the change into the base in the same commit as the bump, typed for the settings change rather than as `deps`: a strictness setting upstream added or altered is consumer-visible, and `deps` would file it under a dev-only section. Splitting the two leaves an intermediate commit whose suite fails in either order.
- **Lint fixtures live in `packages/typescript/__fixtures__/`, outside `src`.** That keeps them out of test collection, coverage, and the published `dist`; two of them are deliberately named `*.test.*`, and ESLint ignores the whole tree because the fixtures violate the rules they exercise.
- **`*.rules.test.ts` names a rule-tester table, which the Vitest lint config skips.** These files declare their cases as a table handed to `RuleTester.run()`, which generates the `describe`/`it` blocks internally, so `@vitest/eslint-plugin` parses no test call in them: its rules have nothing to act on, and `vitest/require-hook` reports the table itself as unhooked setup. The root config ignores the infix rather than allowlisting tester variable names, so a new custom rule needs no config edit. The infix does not affect suite selection — these still run as `unit`. Keep hand-written Vitest assertions in a sibling plain `*.test.ts`, where the plugin's rules do apply; `no-unused-map` is split that way.

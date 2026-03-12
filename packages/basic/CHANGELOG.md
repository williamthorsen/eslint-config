# Changelog

All notable changes to this project will be documented in this file.

## [basic-v5.11.8] - 2026-03-12

### Dependencies

- Ts|deps: Upgrade all deps to latest minor version

## [typescript-v5.12.3] - 2026-03-10

### Dependencies

- Ts|deps: Upgrade all deps to latest minor version

## [typescript-v5.12.2] - 2026-03-09

### Dependencies

- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest minor version
- #32 deps: Upgrade all deps to latest compatible version (#33)

Upgrades all dependencies to the latest compatible version across the monorepo. Includes 8 major version bumps, a deprecated package migration, parser import adaptations for breaking ESM changes, a pre-existing tsconfig bug fix, and audit-ci allowlist entries for transitive dev-only vulnerabilities.

Major upgrades:

- @types/node 22 → 25
- globals 16 → 17
- eslint-plugin-unicorn 62 → 63
- eslint-plugin-jsonc 2 → 3, jsonc-eslint-parser 2 → 3
- eslint-plugin-yml 1 → 3, yaml-eslint-parser 1 → 2
- glob 11 → 13
- vite-tsconfig-paths 5 → 6

Replaced deprecated eslint-plugin-markdown with @eslint/markdown.

Adapted parser imports to namespace imports (`import * as`) required by jsonc-eslint-parser v3 and yaml-eslint-parser v2, which dropped default exports.

Fixed pre-existing bug in tsconfig.eslint.json where `include` patterns failed to resolve linted files, causing 27 parserOptions errors.

Deduplicated lockfile and added audit-ci allowlist entries for 6 transitive dev-only vulnerabilities (3 × minimatch via ESLint 9, rollup via vite, ajv via eslint, js-yaml via changesets).

### Features

- Ts|feat: Relax the complexity threshold from 11 to default
- #34 feat: Replace jsonc/sort-keys with eslint-plugin-package-json (#37)

Replaces the hand-maintained `jsonc/sort-keys` package.json ordering configuration with `eslint-plugin-package-json`'s `recommended` and `stylistic` configs in both the `basic` and `typescript` ESLint config packages. This eliminates ~190 lines of manually maintained key-order rules and delegates to `sort-package-json`'s canonical ordering.

### Tooling

- Root|tooling: Simplify Vitest config

## [5.11.0] - 2025-08-03

### Dependencies

- Root|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version

Also removed `@eslint/plugin-kit` patch.

## [5.7.1] - 2025-06-28

### Tooling

- \*|tooling: Modernize build toolchain

## [5.7.0] - 2025-05-31

### Dependencies

- Ts|deps: Upgrade all deps to latest version

## [5.6.0] - 2025-05-17

### Dependencies

- \*|deps: Upgrade all deps to latest version
- \*|deps: Reduce duplication of dependencies

## [5.4.0] - 2025-05-09

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [5.3.0] - 2025-05-04

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.4.0] - 2025-04-28

### Dependencies

- \*|deps: Upgrade all deps to latest version

### Refactoring

- \*|refactor: Fix lint

## [3.3.0] - 2025-04-06

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.2] - 2025-03-23

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.1] - 2025-03-03

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.2.0] - 2025-02-23

### Dependencies

- \*|deps: Upgrade all deps to latest minor version
- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest minor version
- \*|deps: Upgrade all deps to latest version

### Features

- \*|feat: Disable JSONC formatting rules

Prettier handles formatting

### Formatting

- \*|fmt: Autoformat

## [1.0.0] - 2024-10-12

### Bug fixes

- \*|fix: Helper function is not included in distribution bundle

Added `utils/` to filepaths to allow inclusion of `relativePathToDir` helper function.

- Multi|fix: relativePathToDir resolves target relative to code file

Fixed the issue that `relativePathToDir` finds the relative path from the location of the `relativePathToDir.js` file instead of the caller's file. The function now accepts a second argument specifying which directory should serve as the base directory.

### Dependencies

- Deps: Upgrade all deps to latest version
- Deps: Upgrade all deps to latest version
- Deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps & runtimes to latest version
- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- - | deps: Upgrade all deps to latest minor version
- - | deps: Upgrade most deps to latest major version

Upgraded all deps to latest major version except for `eslint`, which is pinned at v8.x for compatibility with `@teypescript-eslint` deps.

- - | deps: Upgrade all deps to latest minor version
- - | deps: Upgrade all deps to latest major version
- \*|deps: Upgrade all deps to latest version

Also replaced `@esbuild-kit/esm-loader` with `tsx.

### Documentation

- Docs: Mark all packages as UNLICENSED
- \*|docs: Update all licenses

### Features

- Feat: Align package.json rules with sortjson sorting
- Js|feat: Adopt 1TBS braces to align with Deno style
- \*|feat: Add helper function to get relative path

The JS and TS modules now export a helper function, `relativePathToDir`, to facilitate flat configs in monorepos

- - | feat: Enable guard-for-in rule

### Refactoring

- Refactor: Add type annotation to linter configs

### Tooling

- Tooling: Use audit-ci to wrap package audits

Allows some vulnerabilities to be ignored

- Tooling: Rationalize linter configuration

Moved base configuration to monorepo root.
Removed unneeded `typescript` package and TS config from `typescript` workspace, which has no TypeScript files.
Added typechecking to root level checks.

- Tooling: Enable strict linting in monorepo root & workspaces
- \*|tooling: Add Deno config, remove formatting rules

## [0.10.0] - 2022-12-31

### Features

- Feat: Disable no-extra-parens rule

## [0.9.1] - 2022-12-31

### Dependencies

- Deps: Upgrade all dependencies to latest

## [0.9.0] - 2022-12-29

### Dependencies

- Deps: Remove unused eslint-plugin-import

### Refactoring

- Refactor: Remove unneeded import rule

`eslint-plugin-import` is not used in these configs

### Tooling

- Tooling: Add code-quality scripts to package files

## [0.7.4] - 2022-12-28

### Dependencies

- Deps: Upgrade all dependencies to latest

deps: Upgrade all dependencies to latest version

## [0.7.3] - 2022-12-17

### Dependencies

- Deps: Upgrade all dependencies to latest version
- Deps: Upgrade all dependencies to latest version

## [0.7.1] - 2022-12-05

### Dependencies

- Deps: Upgrade all dependencies

## [0.7.0] - 2022-12-04

### Bug fixes

- Fix: Stop some JS rules from applying to JSON files
- Fix: Plugins barrel is not available in distributed package
- Fix: YAML parser is wrongly configured

### Dependencies

- Deps: Upgrade all dependencies to latest
- Deps: Upgrade all dependencies to latest version
- Dep: Upgrade all dependencies

### Documentation

- Docs: Add LICENSE file to each package

### Features

- Feat: Add JS and TS configs
- Feature: Refine JavaScript rules
- Feature: Refine TypeScript rules
- Feature: Refine YML settings

Use recommended YML rules instead of standard.
Allow use of double quotes to avoid escaping single quote.

- Feat: Separate JS from TS rules in merged config

### Refactoring

- Refactor: Convert configs to flat syntax
- Refactor: Reorder linter exclusions

<!-- generated by git-cliff -->

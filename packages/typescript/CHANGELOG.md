# Changelog

All notable changes to this project will be documented in this file.

## [eslint-config-typescript-v5.13.0] - 2026-03-11

### Features

- Ts|feat: Downgrade no-deprecated and tune unicorn and n rule severities

Downgrades `no-deprecated` to warn in eslint-config-typescript so strict-lint's
`maxSeverity` guard can prevent escalation.

Disables overly prescriptive `unicorn` and `n` rules (`no-process-exit`, `no-for-loop`, `prefer-default-parameters`, `prefer-math-min-max`). Downgrades `consistent-function-scoping` to warn.

Adds warn-level `unicorn` rules to the strict-lint `defaultMaxSeverity` map.

## [typescript-v5.12.3] - 2026-03-10

### Dependencies

- Ts|deps: Upgrade all deps to latest minor version

### Tooling

- \*|tooling: Change package registry to from github to npmjs

Publish `strict-lint` and `eslint-config-typescript` packages to npmjs.org. Consume `release-kit` and `toolbelt.objects` from npmjs.org.

## [strict-lint-v5.3.8] - 2026-03-09

### Bug fixes

- Ts|fix: Widen ensureExtendsElement to accept plugin configs with string[] plugins

`eslint-plugin-react-hooks` types its config with `plugins: string[]`, which is incompatible with both `TSESLint.FlatConfig.Config` and `ExtendsElement`. Widening the parameter to `Record<string, unknown>` lets the function serve its purpose as a type bridge.

### Dependencies

- Ts|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- Ts|deps: Downgrade ESLint plugins with bad typings

Reverted `eslint-plugin-react-hooks` from v7.0.0 to v5.2.0.
Downgraded `@vitest/eslint-plugin` from v1.3.23 to v1.3.10.

- Ts|deps: Add @eslint/config-helpers to dev deps

Allow use of `ExtendsElement` type to address the misalignment of `typescript-eslint` and `eslint` types.

- Ts|deps: Upgrade all deps to latest minor version
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

- Ts|feat: Refine linting rules
- Ts|feat: Relax the complexity threshold from 11 to default
- #34 feat: Replace jsonc/sort-keys with eslint-plugin-package-json (#37)

Replaces the hand-maintained `jsonc/sort-keys` package.json ordering configuration with `eslint-plugin-package-json`'s `recommended` and `stylistic` configs in both the `basic` and `typescript` ESLint config packages. This eliminates ~190 lines of manually maintained key-order rules and delegates to `sort-package-json`'s canonical ordering.

### Refactoring

- Ts|refactor: Modernize plugin syntax
- Ts|refactor: Adapt syntax and type annotations to satisfy stricter typing
- \*|refactor: Use explicit .ts extension

### Tooling

- Root|tooling: Simplify Vitest config
- Ts|tooling: Remove fragile automatic compilation

## [5.11.0] - 2025-08-03

### Dependencies

- \*|deps: Upgrade all deps to latest version

Also removed `@eslint/plugin-kit` patch.

### Features

- Ts|feat: Enable improved no-array-callback-reference rule

Enabled the `unicorn/no-array-callback-reference` rule after improvements made in `eslint-plugin-unicorn` v60.

## [5.10.0] - 2025-07-20

### Dependencies

- Ts|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Disable no-redeclare in TypeScript projects
- Ts|feat: Refine rules

### Tooling

- Ts|tooling: Use full-permission token when publishing

## [5.9.0] - 2025-07-13

### Bug fixes

- Ts|fix: Adapt to new deps
- Ts|fix: Build step generates unwanted files

### Dependencies

- Root|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Add hook-function memoization rule

Added a new `sky-pilot-react` plugin with `sky-pilot-react/hook-returns-memoized-functions` rule.

Moved React rules to a React configuration.

- Ts|feat: Decrease severity of some unicorn rules

## [5.8.0] - 2025-06-28

### Features

- Ts|feat: Disable poorly behaved new linting rules

Disabled `vitest/prefer-called-once`, which conflicts with `vitest/prefer-called-times`.
Disabled `vitest/prefer-importing-vitest-globals`, which doesn't recognize imported functions sharing the same name as Vitest globals.

## [5.7.1] - 2025-06-28

### Tooling

- \*|tooling: Modernize build toolchain

## [5.7.0] - 2025-05-31

### Dependencies

- Ts|deps: Upgrade all deps to latest version
- Ts|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Relax unbound-method & promises rules
- Ts|feat: Disable void-expression and extraneous-class rules in test files

## [5.6.0] - 2025-05-17

### Dependencies

- \*|deps: Upgrade all deps to latest version
- \*|deps: Reduce duplication of dependencies

### Features

- Feat: Disable some rules

Disabled some overly proscriptive rules.
Disabled rules inappropriate for test files.

## [5.5.0] - 2025-05-14

### Dependencies

- Deps: Upgrade all deps to latest version

### Features

- Ts|feat: Enable custom JS rules
- Ts|feat: Disable rules inappropriate for tests
- Ts|feat: Align hexadecimal casing with Prettier

## [5.4.0] - 2025-05-09

### Dependencies

- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Refine rules

## [5.3.0] - 2025-05-04

### Dependencies

- Ts|deps: Add eslint-plugin-import to dev deps
- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Add import ESLint config
- Ts|feat: Require file extensions in default TS config
- Ts|feat: Avoid unneeded braces in switch-case

### Tooling

- Ts|tooling: Fix: Prettier formats dist folder when run from workspace

## [5.2.0] - 2025-04-30

### Features

- Ts|feat: Use full n configuration instead of rules only
- Ts|feat: Add strict skypilot config

## [5.1.0] - 2025-04-29

### Dependencies

- Ts|deps: Add JSX A11y ESLint plugin to dev deps

### Features

- Ts|feat: Add typechecking to Vitest config
- Ts|feat: Disable vitest/no-hooks rule
- Ts|feat: Add JSX A11y config

### Refactoring

- Ts|refactor: Improve naming & docs in eslint-comments config
- Ts|refactor: Improve imports from React plugins

## [5.0.2] - 2025-04-29

### Bug fixes

- Ts|fix: Optional plugins are required for unused configs

Fixed the issue that all plugins were required to build the linter config, even if they weren't used by the consumer.

### Tooling

- \*|tooling: Use generic workspace script runner

## [5.0.1] - 2025-04-29

### Dependencies

- Ts|deps: Remove optional peer dependencies to avoid install warnings

## [5.0.0] - 2025-04-29

### Dependencies

- Ts|deps: Dependencies maybe unavailable when auto-install-peers=false
- Ts|deps: Add Vitest ESLint plugin to dev & peer deps
- Ts|deps: Upgrade Vitest ESLint plugin to latest version

### Features

- Ts|feat: Add optional Vitest ESLint config
- Ts|feat: Add Jest DOM rules to Testing Library config

### Refactoring

- Ts|refactor: Revert configs API to v3.4.0

## [4.0.1] - 2025-04-29

### Dependencies

- Ts|deps: Remove optional plugins from dev dependencies

## [4.0.0] - 2025-04-29

### Dependencies

- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Use optional configs when plugins are available

### Tooling

- Ts|tooling: Add optional plugins to manifest

## [3.4.0] - 2025-04-28

### Dependencies

- Ts|deps: Add Testing Library ESLint plugin to dev deps
- Ts|deps: Add Next.js ESLint plugin to dev deps
- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Add React config
- Ts|feat: Refine rules
- Ts|feat: Enable recommended Unicorn rules by default
- Ts|feat: Add React Testing Library config
- Ts|feat: Add Next.js ESLint configuration

### Refactoring

- Ts|refactor: Modernize JavaScript config
- \*|refactor: Fix lint

## [3.3.1] - 2025-04-06

### Bug fixes

- Ts|fix: SkyPilot plugin files are not included in distribution bundle

## [3.3.0] - 2025-04-06

### Dependencies

- Ts|deps: Add @typescript-eslint/utils to dev deps
- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Include SkyPilot plugin in TS config

### Refactoring

- Ts|refactor: Fix lint

### Tooling

- \*|tooling: Set Node 18 as minimum version

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

### Features

- Ts|feat: Allow CommonJS globals in CJS files
- Ts|feat: Loosen strict void & template expression rules
- Ts|feat: Disable some troublesome rules from the n plugin
- \*|feat: Disable JSONC formatting rules

Prettier handles formatting

### Formatting

- \*|fmt: Autoformat

### Tooling

- \*|tooling: Remove Deno

## [3.1.1] - 2025-01-04

### Dependencies

- \*|deps: Upgrade all deps to latest version

## [3.1.0] - 2024-11-05

### Dependencies

- \*|deps: Upgrade all deps to latest version

### Features

- Ts|feat: Rationalize configs
- Ts|feat: Support JSX

## [3.0.4] - 2024-11-04

### Bug fixes

- Ts|fix: Wrong file extension for primary export

## [3.0.3] - 2024-11-04

### Bug fixes

- Ts|fix: Export of relativePathToDir utility is not resolved correctly

## [3.0.2] - 2024-11-04

### Bug fixes

- Ts|fix: ESLint cannot import module

## [3.0.1] - 2024-11-04

### Bug fixes

- Ts|fix: Files are excluded from distribution bundle

## [3.0.0] - 2024-11-04

### Features

- Ts|feat: Modernize configs

## [2.2.0] - 2024-11-03

### Features

- Ts|feat: Improve rule priority for TS files

## [2.1.1] - 2024-11-03

### Bug fixes

- Ts|fix: Distribution contain source files instead of transpiled files

## [2.1.0] - 2024-11-03

### Tooling

- Ts|tooling: Explicitly export an MJS file

To allow use by a project that does not assume ESM.

## [2.0.0] - 2024-11-03

### Dependencies

- \*|deps: Upgrade all deps to latest minor version

### Features

- Ts|feat: Convert source files to TypeScript
- Ts|feat: Convert source files to TypeScript (2)

### Tooling

- \*|tooling: Modernize ESLint configs
- Root|tooling: Configure lint rules for project

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
- Deps: Upgrade all deps to latest version
- Deps: Upgrade all deps to latest version
- Deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps & runtimes to latest version
- \*|deps: Upgrade all deps & runtimes to latest version
- \*|deps: Upgrade all deps & runtimes to latest version

Closes security vulnerability in `semver`

- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- \*|deps: Upgrade all deps to latest version
- - | deps: Upgrade all deps to latest minor version
- - | deps: Upgrade most deps to latest major version

Upgraded all deps to latest major version except for `eslint`, which is pinned at v8.x for compatibility with `@teypescript-eslint` deps.

- - | deps: Upgrade all deps to latest minor version
- - | deps: Upgrade all deps to latest major version
- - | deps: Require v9 or better for ESLint as peer dep
- \*|deps: Upgrade all deps to latest version

Also replaced `@esbuild-kit/esm-loader` with `tsx.

### Documentation

- Docs: Mark all packages as UNLICENSED
- \*|docs: Update all licenses

### Features

- Feat: Align package.json rules with sortjson sorting
- Ts|feat: Enforce multiline commas to align with Deno style
- Ts|feat: Adopt 1TBS braces to align with Deno style
- \*|feat: Add helper function to get relative path

The JS and TS modules now export a helper function, `relativePathToDir`, to facilitate flat configs in monorepos

- Ts|feat: Report unused directives
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
- Ts|tooling: Fix broken ignores

## [0.10.0] - 2022-12-31

### Features

- Feat: Disable no-extra-parens rule

## [0.9.1] - 2022-12-31

### Dependencies

- Deps: Upgrade all dependencies to latest

## [0.9.0] - 2022-12-29

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

### Dependencies

- Deps: Upgrade all dependencies to latest
- Deps: Upgrade all dependencies to latest version
- Dep: Upgrade all dependencies

### Documentation

- Docs: Add LICENSE file to each package

### Features

- Feat: Add JS and TS configs
- Feature: Refine TypeScript rules
- Feature: Refine TypeScript rules
- Feat: Separate JS from TS rules in merged config

### Refactoring

- Refactor: Convert configs to flat syntax

<!-- generated by git-cliff -->

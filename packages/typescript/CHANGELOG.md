# Changelog

All notable changes to this project will be documented in this file.

## 8.4.0 — 2026-08-04

### ♻️ Refactoring

- Remove runtime logic from config barrel (#138)

  Removes logic from the typescript package's barrel file to make it pure. Expands test coverage to include the opt-in `createConfig` factories in `@williamthorsen/eslint-config-typescript`. Adds a guard that fails when the package or its `./configs` subpath drops or renames an export.

### ⚙️ Tooling

- Migrate the test suite to nmr's isolation tiers (#137)

  Changes Vitest configuration so that test suites are selected by a tier ("unit", "tool", "localhost", and "remote") corresponding to the services they use. `nmr test:unit` and `nmr test:tool` each run one of these; `nmr test:all` runs every suite. A test verifies that all test file names include the tier infix. `nmr test:integration` no longer exists, and no tests carry the `.int.` infix.

## 8.3.0 — 2026-08-02

### 🎉 Features

- Add defineConfig for authoring strict-lint configs (#133)

  Adds a `defineConfig` helper function for authoring the `strict-lint` config file.

### 🐛 Bug fixes

- Correct misbehaving Vitest rules (#132)

  Corrects some Vitest rules that were triggering broken behavior in repos using them. The Vitest config is now used in this repo's own linting configuration; some violations surfaced by the newly enabled rules have been fixed. The ESLint config for TypeScript now exports `patterns.testFiles`, an array of file patterns commonly used for tests.

## 8.1.1 — 2026-08-01

### ⚙️ Tooling

- Migrate Vitest configs to the nmr projects model (#126)

  The suite in which a test runs is now determined by filename alone: An `.int.` infix marks an integration test; an `.app.` marks an app test; and anything else under `__tests__` runs as a unit test. Integration tests are again excluded from the default test run and from the standard check, and are instead run by `nmr test:integration`. A new workspace picks up the same rules without a test config.

## 8.1.0 — 2026-07-26

### ⚙️ Tooling

- Consume TypeScript config from source (#121)

  Simplifies the repo's own ESLint configuration and migrates the configuration to TypeScript. Tooling no longer depends on a build step; `nmr build` now serves publishing alone. The `strict-lint` command runs its compiled entry point directly instead of a committed launcher. `tsx` is no longer a dependency.

## 8.0.0 — 2026-07-24

### 🎉 Features

- 🚨 **Breaking:** Bound config discovery and remove the built-in allowlist (#115)

  `strict-lint` now stops at the project root when walking up the directory tree to find configs. Within the project, all configs on the path from the project root to the directory where the command is run are merged; later settings prevail. A new `--debug` flag reports the resolved project root and the config files that contributed.

  `@williamthorsen/strict-lint` no longer carries built-in exemptions: The style and modernization rules that used to stay warnings now fail the lint run unless a config exempts them. Projects that want the previous exemptions can now import them from `@williamthorsen/eslint-config-typescript`, which exports that set of downgrades as `advisoryRuleSeverities`.

### 🐛 Bug fixes

- Eliminate no-unused-map false positives and false negatives (#118)

  Fixes an issue where the `sky-pilot/no-unused-map` rule erroneously flagged `.map()` calls whose results were in fact used: passed to a constructor, spread, interpolated into a template literal, or implicitly returned from an arrow function. The rule also now ignores `.map` calls on values that are not arrays, and it flags discarded `.map()` calls that previously slipped through, including calls inside a nested callback and calls written with optional chaining. A call prefixed with `void` is accepted as an explicit discard.

## 7.0.0 — 2026-07-23

### 🎉 Features

- 🚨 **Breaking:** Publish a shared TypeScript config on a Node 24 floor (#108)

  Introduces `@williamthorsen/tsconfig`, a published baseline that Node-only TypeScript projects can extend. It pairs the strictest available TypeScript settings with additional Node and build options. A consumer is left to declare its own ambient types, path aliases, JSX, and file globs.

  `@williamthorsen/eslint-config-typescript` now requires Node 24 or later.

- 🚨 **Breaking:** Make exported configs composable with ESLint core's defineConfig (#109)

  Every config this package exports now composes with ESLint's `defineConfig()` in a TypeScript `eslint.config.ts` that typechecks under strict mode. Previously this was a type error, so a TypeScript config had to fall back to the deprecated `tseslint.config()` or a cast, leaving a deprecation warning that could not be cleared.

  `createConfig.next()` now resolves to an array of configs and must be spread: `...(await createConfig.next())`.

## 6.0.2 — 2026-07-20

### 📦 Dependencies

- Declare eslint-plugin-import as a direct dependency (#99)

  Fixes a failure that prevented `@williamthorsen/eslint-config-typescript` from loading for consumers that had not separately installed `eslint-plugin-import`.

### 📚 Documentation

- Add a migrating-to-v6 guide for consumers upgrading from v5 (#101)

  Adds a guide with a complete walkthrough for migrating @williamthorsen/eslint-config-typescript from v5 to v6.

  Closes #100.

## 6.0.1 — 2026-07-19

### 📦 Dependencies

- Declare @eslint/js as a direct dependency (#96)

  Fixes a packaging defect where consuming `@williamthorsen/eslint-config-typescript` under a strict package manager such as pnpm forced every project to declare `@eslint/js` in its own package.json, even though the project's own code never uses that dependency. Consumers can now remove that spurious declaration.

## 6.0.0 — 2026-07-18

### 🎉 Features

- 🚨 **Breaking:** Adopt projectService in the published TypeScript config (#86)

  The TypeScript preset now resolves each file's owning `tsconfig.json` itself, so type-aware linting no longer needs per-repo parser wiring. Consumers no longer set `parserOptions.project` or maintain a lint-only `tsconfig.eslint.json`; the only setting they keep is `tsconfigRootDir`.

  Upgrading is breaking: Remove any `parserOptions.project` and ensure every linted TypeScript file belongs to a discoverable `tsconfig.json`, folding any lint-only `tsconfig.eslint.json` include globs into the real `tsconfig.json` before deleting it.

### 🧪 Tests

- Add a test suite to the typescript package and fix the defects it surfaced (#79)

  Fixes four defects in the package's opt-in config presets and custom lint rules. `createConfig.react()` now loads under ESLint 10 instead of erroring at config load, and the React strict preset now loads instead of failing. One custom rule now reports a violation instead of crashing the lint run when it matches, and another now flags discarded `Array#map` results that it previously missed — so projects using the recommended or strict preset may see new lint findings where `map` is called only for its side effects.

### ⚙️ Tooling

- Migrate the build to nmr-compile by converging packages on the canonical src/ layout (#75)

  The two compiled packages now build on the project's shared build tooling, so upgrading that tooling no longer risks silently breaking either package's build. Anyone importing either package's main entry now receives its type declarations — one of the two previously shipped its main entry without them.

- Reduce tsconfigs to deviations from TypeScript 6 defaults (#83)

  Streamlines TypeScript configs by removing settings that were identical to the default.

  Two behavior changes are included: Unused function parameters now raise a type error (prefix a parameter's name with `_` to exempt one), and the compilation target now matches the supported Node version instead of trailing it.

### 📦 Dependencies

- 🚨 **Breaking:** Upgrade dependencies to latest and drop Node 18/20 support (#78)

  Consuming a published config now requires ESLint 10 and Node `^22.13.0 || >=24`; support for Node 18 and 20 is dropped.

## 5.17.4 — 2026-05-01

### 🐛 Bug fixes

- Declare `@typescript-eslint/utils` as a peer dependency (#67)

  Fixes `ERR_MODULE_NOT_FOUND` failures in consumers of `@williamthorsen/eslint-config-typescript` whose pnpm graph does not happen to hoist `@typescript-eslint/utils` into a location reachable from the eslint-config's compiled files. The package's compiled rules import `@typescript-eslint/utils` at runtime, but it was previously declared only in `devDependencies` — so pnpm's strict isolation could leave it unreachable depending on the consumer's resolution graph. Declaring it as a peer dependency makes the contract explicit and ensures consumers resolve a single shared copy.

### ⚙️ Tooling

- Adopt the nmr script runner (#58)

  Replaces the hand-rolled `run-workspace-script.ts` infrastructure and custom utility scripts with `@williamthorsen/nmr`, a context-aware script runner for pnpm monorepos. The root `package.json` scripts go from ~30 entries to 3 (`ci`, `postinstall`, `prepare`), and the consistency tests are replaced with a single `runConsistencyChecks` import from nmr. In total, ~635 lines are removed and ~76 added.

## 5.17.1 — 2026-03-28

### 🐛 Bug fixes

- Fix broken next config with @next/eslint-plugin-next 16.x (#53)

  Update `configs/next.ts` and its ambient type declaration to use the `@next/eslint-plugin-next` 16.x API, which moved flat config exports from `flatConfig` to `configs` with kebab-case keys.

### ♻️ Refactoring

- Defer loading of optional config modules (#54)

  Replaces static imports of the 5 optional config modules (`jsx-a11y`, `next`, `react`, `testing-library`, `vitest`) with inline dynamic `import()` wrappers in `createConfig`. Fixes the `./plugins` export path, which incorrectly pointed to `configs/index.js` instead of `plugins/index.js`.

## 5.12.2 — 2026-03-09

### 🎉 Features

- Replace jsonc/sort-keys with eslint-plugin-package-json (#37)

  Replaces the hand-maintained `jsonc/sort-keys` package.json ordering configuration with `eslint-plugin-package-json`'s `recommended` and `stylistic` configs in both the `basic` and `typescript` ESLint config packages. This eliminates ~190 lines of manually maintained key-order rules and delegates to `sort-package-json`'s canonical ordering.

### 📦 Dependencies

- Upgrade all deps to latest compatible version (#33)

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

<!-- Generated by release-kit. Do not edit this file. Use .meta/changelog-overrides.json to override entries. -->

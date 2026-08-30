# Changelog

All notable changes to this project will be documented in this file.

## 13.0.0 — 2026-08-30

### 🎉 Features

- 🚨 **Breaking:** Enforce the combined inline form for a module's type and value imports (#198)

  A module's type and value imports now go in one statement, with `type` marking the type specifiers: `import { Component, type ComponentProps } from './Component.ts'`. A new rule, `sky-pilot/no-split-imports`, reports a module imported in more than one statement and merges the group wherever one statement can carry it. Nothing reported a split pair before, and the config's own autofix produced one, so lint pushed code away from the form the config recommends.

  **Migration.** `eslint-plugin-import-x` replaces `eslint-plugin-import`, which does not support ESLint 10. In your own config:

  1. Rename every `import/` rule id, `eslint-disable` directive, and `settings` key to `import-x/`. Grep for the namespace rather than leaving it to the run: a stale `settings` key is ignored without a word.
  2. Delete `import/no-duplicates` rather than renaming it: its fixer writes invalid syntax for a default import and deletes side-effect imports. `sky-pilot/no-split-imports` replaces it.
  3. Run `eslint --fix` once.

  `docs/migrating-to-v13.md` walks through each step. Separately, `unicorn/no-named-default` is now off, so `import { default as x }` no longer reports.

## 12.0.2 — 2026-08-29

### 🐛 Bug fixes

- Stop no-floating-disposable reporting a Node crypto stream (#195)

  Fixes an issue where `sky-pilot/no-floating-disposable` was triggered by the streams `node:crypto` returns, such as the `Hash` from `createHash`. The rule's default `allow` list has been expanded to include the six `node:crypto` factories that return a stream.

  The `allow` list matches a callee by name, so any userland function named `createHash` is also exempt from the rule.

### 🧪 Tests

- Fail typed rule-tester cases and outputs that do not typecheck (#196)

  Adds a compile gate to `createTypedRuleTester()`. Every case a typed rule suite declares, along with every fixer and suggestion `output` it asserts, is compiled under the rule fixture's `tsconfig.json`, and a compile error fails the suite.

  Corrects the seven `no-unused-map` cases the gate rejects; each reached for an ambient `console` the fixture program does not declare.

  Separately, moves the rule-tester helper from `__tests__/` to a sibling `test-utils/`, where coverage measures it.

## 12.0.1 — 2026-08-28

### 🐛 Bug fixes

- Stop no-floating-disposable reporting a call that returns its receiver (#191)

  Fixes a false positive in `sky-pilot/no-floating-disposable`, which demanded a `using` binding for a call that returns its own receiver and so acquires nothing to release. The rule now recognizes a receiver-returning call from its signature rather than by comparing types, so the exemption holds whatever type the checker resolves for the receiver.

- Stop no-floating-disposable reporting a resource handed a callback (#192)

  Fixes an issue where `sky-pilot/no-floating-disposable` flagged a resource that is still in use after its block ends, such as a child process or an event emitter driven by listeners. The `using` rebind it suggested disposed the resource before those listeners ran, so taking the suggestion broke working code.

  The rule now leaves alone any resource that is handed a callback. The signal is deliberately broad: it also covers a callback that runs immediately, so a few genuine leaks now go unreported.

## 12.0.0 — 2026-08-27

### 🎉 Features

- 🚨 **Breaking:** Add no-floating-disposable rule to the sky-pilot plugin (#185)

  Adds `sky-pilot/no-floating-disposable` to `@williamthorsen/eslint-config-typescript`. The rule reports a discarded call or `new` expression whose type is disposable, so a resource that needs `using` to be released is not left unbound; nothing else reports the mistake, since the call typechecks. Severity is `warn` in the plugin's `recommended` preset, which the TypeScript config extends, and `error` in `strict`.

  Migration: Fix or suppress any violations surfaced by the new rule.

- Add readiness checks that next.rootDir is set and absolute (#186)

  Adds two checks to `@williamthorsen/eslint-config-typescript`'s readiness kit: that an eslint config reaching `@next/eslint-plugin-next` sets `settings.next.rootDir`, and that every value it sets is absolute.

- 🚨 **Breaking:** Report a disposable resource bound to a plain declaration (#188)

  Extends `sky-pilot/no-floating-disposable` to report a disposable resource bound to a plain `const`, `let`, or `var` that never leaves the scope declaring it. A suggestion rewrites the declaration keyword to `using` or `await using`.

  A declaration is left alone where `using` would be the wrong binding: the resource escapes its scope, it sits at module or global scope, it is released by hand, or a `var` is read past its block. `checkDeclarations: false` drops the declaration half and keeps the discarded one.

  Migration: Fix or suppress any violations the declaration half surfaces.

### 🐛 Bug fixes

- Stop no-unpublished-barrel from reporting a source-path entry point (#184)

  Fixes an issue where `sky-pilot/no-unpublished-barrel` reported the entry point of a package that publishes source rather than a build.

- Restore the repo root to both readiness kits' search directories (#187)

  Fixes an issue where the readiness kits in `@williamthorsen/tsconfig` and `@williamthorsen/eslint-config-typescript` skipped the repo root in a monorepo running readyup below 0.33.0. Each kit now supplies the root itself, so the sweep is whole under any readyup version.

## 11.0.0 — 2026-08-26

### 🎉 Features

- 🚨 **Breaking:** Declare readyup as an optional peer of both kit-shipping packages (#179)

  Declares `readyup` as an optional peer dependency of `@williamthorsen/tsconfig` and `@williamthorsen/eslint-config-typescript`, with a `>=0.33.0` floor. Both packages ship readiness kits that run against the consumer's own readyup, and below 0.33.0 that readyup omits the repo root from a monorepo's workspace list, so the kits check every member package and leave the root unchecked.

  Both kits now take readyup's workspace list directly, dropping the root literal each carried to compensate for the older behavior.

  Migration: A consumer running `rdy` against either kit upgrades `readyup` to 0.33.0 or later.

- 🚨 **Breaking:** Add no-unpublished-barrel rule to the sky-pilot plugin (#180)

  Adds `sky-pilot/no-unpublished-barrel` to `@williamthorsen/eslint-config-typescript`. The rule reports a file whose body holds only imports and re-exports, unless the package publishes the module to which the file compiles. The rule has a severity of `warn` in the plugin's `recommended` preset, which the TypeScript config extends, and `error` in `strict`.

  Migration: A consumer whose repository holds a barrel outside a published entry point gets a new report on upgrade.

### ♻️ Refactoring

- Align function names with naming conventions (#181)

  Renames functions in the `tsconfig`, `eslint-config-typescript`, and `strict-lint` workspaces to align with naming conventions.

## 10.0.0 — 2026-08-12

### 🎉 Features

- 🚨 **Breaking:** Enforce package-json/specify-peers-locally (#165)

  Enforces `package-json/specify-peers-locally`. Every peer dependency a package declares must also appear in its own `devDependencies`; in a pnpm workspace a catalog entry satisfies it without repeating the version.

  Migration: A consumer relying on the workspace root's hoisting or on pnpm's `autoInstallPeers` to resolve its peers gets new errors until each peer is declared locally.

## 9.0.0 — 2026-08-11

### 🎉 Features

- 🚨 **Breaking:** Require author, engines, and publish metadata in package.json (#162)

  Adds six `package-json` rules to `@williamthorsen/eslint-config-typescript` and removes three overrides that suppressed rules the plugin's `recommended` preset supplies. Every `package.json` must now declare `author` and `engines` and carry no empty field; one that publishes must also declare `bugs`, `homepage`, `keywords`, `repository`, and `sideEffects`, and may not take a dependency on a local path. `specify-peers-locally` is the only rule the config still disables.

### 🐛 Bug fixes

- Accept a source-path import in the kit's extends check (#155)

  Fixes an issue where the readiness check bundled with `@williamthorsen/eslint-config-typescript` reported that this repo's root ESLint config did not extend the package. The kit now accepts that an import via the workspace path is equivalent.

### 🧪 Tests

- Adopt vitest's `assert` for test narrowing and retire `@sindresorhus/is` (#157)

  Consolidates the test suite's type-narrowing assertions on `vitest` in place of Node's built-in assertions. A failing narrowing check now names the value under test rather than reporting a bare truthiness result. Removes the disused `@sindresorhus/is` dependency.

### 🤖 Agentic support

- Update AGENTS.md (#161)

  Updates project guidance in AGENTS.md. In particular, most information about the `nmr` task runner has been removed in deference to the guidance bundled with `nmr` itself. `nmr check` is now promoted as the usual check in place of the much slower, and usually unnecessary, `nmr ci`.

## 8.7.0 — 2026-08-09

### 🎉 Features

- Add a readyup kit that checks consumer lint config (#150)

  Adds a readiness check that reports whether a project's ESLint setup is wired correctly for the version of this config it has installed, and names the change to make where it is not. Only a misconfiguration that stops ESLint running is reported as an error; the rest arrive as warnings and recommendations. Consumers run the checks with `rdy run --from npm:@williamthorsen/eslint-config-typescript`, or list the package in their readyup configuration to include them in a standing run.

## 8.6.0 — 2026-08-07

### 🎉 Features

- Disable prefer-simple-condition-first and repair inert rule overrides (#145)

  Disables two rules in `@williamthorsen/eslint-config-typescript`: `unicorn/prefer-simple-condition-first` and `unicorn/no-for-each`.

- Support explicit resource management for consumers (#148)

  Adds `ESNext.Disposable` to the libraries recognized by TypeScript in the exported base config. This enables the use of `using` and `await using` declarations.

## 8.5.0 — 2026-08-05

### 🎉 Features

- Disable conflicting class-member-order rule

  Disables `unicorn/consistent-class-member-order` because it conflicts with a similar `@typescript-eslint` rule.

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
